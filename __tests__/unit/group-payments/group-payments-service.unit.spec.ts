import { mock } from "vitest-mock-extended";
import type { IGroupPaymentsRepository } from "@src/shared/database/interfaces/group-payments.repository.interface";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { GroupPaymentsService } from "@src/modules/group-payments/group-payments.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { MatchPresencesService } from "@src/modules/match-presences/match-presences.service";
import { GroupsService } from "@src/modules/groups/services/groups.service";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { randomUUID } from "crypto";
import { makeGroupMemberMock } from "../../utils/groups";
import { makeGroupMatchMock } from "../../utils/group-matches";
import {
  makeCreateGroupPaymentInputMock,
  makeGroupPaymentMock,
  makePaymentFilterQueryMock,
} from "../../utils/group-payments";

const groupPaymentsRepoMock = mock<IGroupPaymentsRepository>();
const groupMatchesRepoMock = mock<IGroupMatchesRepository>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();
const groupMatchesServiceMock = mock<GroupMatchesService>();
const matchPresencesServiceMock = mock<MatchPresencesService>();
const groupsServiceMock = mock<GroupsService>();

// Fixed "now" so the monthly-fee period (current Brazil month start) is
// deterministic: 2026-01-15 in Brazil is in January, starting 2026-01-01.
const FAKE_NOW = new Date("2026-01-15T12:00:00.000Z");
const CURRENT_MONTH_START = new Date("2026-01-01T00:00:00.000Z");

let sut: GroupPaymentsService;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FAKE_NOW);
  sut = new GroupPaymentsService(
    groupPaymentsRepoMock,
    groupMatchesRepoMock,
    userBelongsToGroupServiceMock,
    groupMatchesServiceMock,
    matchPresencesServiceMock,
    groupsServiceMock,
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock({
      type: GroupMemberType.MONTHLY,
    }),
  });
  groupsServiceMock.isUserOwner.mockResolvedValue(false);
  groupPaymentsRepoMock.findManyPaginated.mockResolvedValue({
    data: [],
    total: 0,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GroupPaymentsService", () => {
  describe("create", () => {
    it("should create a monthly-fee payment for the current month when the member pays the monthly fee", async () => {
      const dto = makeCreateGroupPaymentInputMock();
      const userId = randomUUID();
      groupPaymentsRepoMock.create.mockResolvedValueOnce(
        makeGroupPaymentMock(),
      );

      await sut.create({
        createGroupPaymentDto: dto,
        userId,
        groupId: "group-id",
      });

      expect(groupPaymentsRepoMock.create).toHaveBeenCalledWith({
        amount: dto.amount,
        receipt: undefined,
        groupId: "group-id",
        userId,
        matchId: undefined,
        period: CURRENT_MONTH_START,
      });
    });

    it("should throw BadRequestException when a daily member pays without a match", async () => {
      userBelongsToGroupServiceMock.check.mockResolvedValueOnce({
        isMember: true,
        member: makeGroupMemberMock({
          type: GroupMemberType.DAILY,
        }),
      });

      const promiseResult = sut.create({
        createGroupPaymentDto: makeCreateGroupPaymentInputMock(),
        userId: randomUUID(),
        groupId: "group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(groupPaymentsRepoMock.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when a monthly member pays per match", async () => {
      const promiseResult = sut.create({
        createGroupPaymentDto: makeCreateGroupPaymentInputMock({
          matchId: randomUUID(),
        }),
        userId: randomUUID(),
        groupId: "group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(groupPaymentsRepoMock.create).not.toHaveBeenCalled();
    });

    it("should use the match date as the period when a daily member pays for a match they attended", async () => {
      userBelongsToGroupServiceMock.check.mockResolvedValueOnce({
        isMember: true,
        member: makeGroupMemberMock({
          type: GroupMemberType.DAILY,
        }),
      });
      const match = makeGroupMatchMock({
        matchDate: new Date("2026-01-10T23:00:00.000Z"),
      });
      groupMatchesServiceMock.findOne.mockResolvedValueOnce(match);
      matchPresencesServiceMock.checkIfUserWentToMatch.mockResolvedValueOnce(
        true,
      );
      groupPaymentsRepoMock.create.mockResolvedValueOnce(
        makeGroupPaymentMock({ matchId: match.id }),
      );

      await sut.create({
        createGroupPaymentDto: makeCreateGroupPaymentInputMock({
          matchId: match.id,
        }),
        userId: "user-id",
        groupId: "group-id",
      });

      expect(groupPaymentsRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: match.id,
          period: match.matchDate,
        }),
      );
    });

    it("should throw BadRequestException when a daily member did not attend the match", async () => {
      userBelongsToGroupServiceMock.check.mockResolvedValueOnce({
        isMember: true,
        member: makeGroupMemberMock({
          type: GroupMemberType.DAILY,
        }),
      });
      groupMatchesServiceMock.findOne.mockResolvedValueOnce(
        makeGroupMatchMock(),
      );
      matchPresencesServiceMock.checkIfUserWentToMatch.mockResolvedValueOnce(
        false,
      );

      const promiseResult = sut.create({
        createGroupPaymentDto: makeCreateGroupPaymentInputMock({
          matchId: randomUUID(),
        }),
        userId: "user-id",
        groupId: "group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(groupPaymentsRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findAllByGroup", () => {
    it("should return the paginated payments of the whole group", async () => {
      const payments = [makeGroupPaymentMock()];
      groupPaymentsRepoMock.findManyPaginated.mockResolvedValueOnce({
        data: payments,
        total: 1,
      });

      const response = await sut.findAllByGroup(
        "group-id",
        makePaymentFilterQueryMock(),
      );

      expect(groupPaymentsRepoMock.findManyPaginated).toHaveBeenCalledWith(
        { groupId: "group-id", period: undefined },
        { skip: 0, take: 10 },
      );
      expect(response).toEqual({
        data: payments,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it("should filter by the whole year when only the year is given", async () => {
      await sut.findAllByGroup(
        "group-id",
        makePaymentFilterQueryMock({ year: 2026 }),
      );

      expect(groupPaymentsRepoMock.findManyPaginated).toHaveBeenCalledWith(
        {
          groupId: "group-id",
          period: {
            gte: new Date("2026-01-01T00:00:00.000Z"),
            lt: new Date("2027-01-01T00:00:00.000Z"),
          },
        },
        { skip: 0, take: 10 },
      );
    });

    it("should filter by the month when year and month are given", async () => {
      await sut.findAllByGroup(
        "group-id",
        makePaymentFilterQueryMock({ year: 2026, month: 3 }),
      );

      expect(groupPaymentsRepoMock.findManyPaginated).toHaveBeenCalledWith(
        {
          groupId: "group-id",
          period: {
            gte: new Date("2026-03-01T00:00:00.000Z"),
            lt: new Date("2026-04-01T00:00:00.000Z"),
          },
        },
        { skip: 0, take: 10 },
      );
    });

    it("should throw BadRequestException when filtering by month without a year", async () => {
      const promiseResult = sut.findAllByGroup(
        "group-id",
        makePaymentFilterQueryMock({ month: 3 }),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAllByUser", () => {
    it("should return the paginated payments of the user when they are a member", async () => {
      await sut.findAllByUser(
        "group-id",
        "user-id",
        makePaymentFilterQueryMock(),
      );

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId: "user-id",
        groupId: "group-id",
      });
      expect(groupPaymentsRepoMock.findManyPaginated).toHaveBeenCalledWith(
        { groupId: "group-id", userId: "user-id", period: undefined },
        { skip: 0, take: 10 },
      );
    });

    it("should throw ForbiddenException when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findAllByUser(
        "group-id",
        "user-id",
        makePaymentFilterQueryMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        groupPaymentsRepoMock.findManyPaginated,
      ).not.toHaveBeenCalled();
    });
  });

  describe("findPendingMatches", () => {
    it("should return the matches the user attended but has not paid for", async () => {
      const matches = [makeGroupMatchMock()];
      groupMatchesRepoMock.findUnpaidAttendedMatches.mockResolvedValueOnce(
        matches,
      );

      const response = await sut.findPendingMatches(
        "group-id",
        "user-id",
      );

      expect(
        groupMatchesRepoMock.findUnpaidAttendedMatches,
      ).toHaveBeenCalledWith("group-id", "user-id");
      expect(response).toEqual(matches);
    });
  });

  describe("findOne", () => {
    it("should return the payment to its owner", async () => {
      const payment = makeGroupPaymentMock({ userId: "user-id" });
      groupPaymentsRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        payment,
      );

      const response = await sut.findOne({
        paymentId: payment.id,
        userId: "user-id",
        groupId: "group-id",
      });

      expect(response).toEqual(payment);
    });

    it("should return any payment of the group to the group owner", async () => {
      const payment = makeGroupPaymentMock({
        userId: "someone-else-id",
      });
      groupsServiceMock.isUserOwner.mockResolvedValueOnce(true);
      groupPaymentsRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        payment,
      );

      const response = await sut.findOne({
        paymentId: payment.id,
        userId: "owner-id",
        groupId: "group-id",
      });

      expect(response).toEqual(payment);
    });

    it("should throw ForbiddenException when a non-owner requests someone else's payment", async () => {
      groupPaymentsRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        makeGroupPaymentMock({ userId: "someone-else-id" }),
      );

      const promiseResult = sut.findOne({
        paymentId: "payment-id",
        userId: "user-id",
        groupId: "group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw NotFoundException when the payment does not exist", async () => {
      groupPaymentsRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.findOne({
        paymentId: "payment-id",
        userId: "user-id",
        groupId: "group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
