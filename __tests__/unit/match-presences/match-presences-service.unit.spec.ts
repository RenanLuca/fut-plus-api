import { mock } from "vitest-mock-extended";
import type { IMatchPresencesRepository } from "@src/shared/database/interfaces/match-presences.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { MatchPresencesService } from "@src/modules/match-presences/match-presences.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import {
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { UserRank } from "@src/shared/enum/userRank";
import { randomUUID } from "crypto";
import {
  makeGroupMemberMock,
  makeGroupMemberWithUserMock,
} from "../../utils/groups";
import { makeGuestUserMock } from "../../utils/match-guests";
import { makeGroupMatchMock } from "../../utils/group-matches";
import {
  makePresenceSummaryMock,
  makeUpdateMatchPresenceInputMock,
} from "../../utils/match-presences";

const matchPresencesRepoMock = mock<IMatchPresencesRepository>();
const groupMembersRepoMock = mock<IGroupMembersRepository>();
const guestUsersRepoMock = mock<IGuestUsersRepository>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();
const groupMatchesServiceMock = mock<GroupMatchesService>();

let sut: MatchPresencesService;
beforeEach(() => {
  sut = new MatchPresencesService(
    matchPresencesRepoMock,
    groupMembersRepoMock,
    guestUsersRepoMock,
    userBelongsToGroupServiceMock,
    groupMatchesServiceMock,
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
  groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockResolvedValue(
    makeGroupMatchMock(),
  );
  groupMembersRepoMock.findAllByGroupIdWithUser.mockResolvedValue([]);
  guestUsersRepoMock.findAllByGroupMatchId.mockResolvedValue([]);
  matchPresencesRepoMock.findAllByGroupMatchId.mockResolvedValue([]);
});

describe("MatchPresencesService", () => {
  describe("findMatchPresences", () => {
    it("should split members and guests into confirmed, declined and pending", async () => {
      const confirmedMember = makeGroupMemberWithUserMock({
        userId: "confirmed-member-id",
        rank: UserRank.BRASILEIRAO,
      });
      const pendingMember = makeGroupMemberWithUserMock({
        userId: "pending-member-id",
        rank: UserRank.BRASILEIRAO,
      });
      const declinedGuest = makeGuestUserMock({
        id: "declined-guest-id",
        rank: UserRank.CHAMPIONS_LEAGUE,
      });
      groupMembersRepoMock.findAllByGroupIdWithUser.mockResolvedValueOnce(
        [confirmedMember, pendingMember],
      );
      guestUsersRepoMock.findAllByGroupMatchId.mockResolvedValueOnce([
        declinedGuest,
      ]);
      matchPresencesRepoMock.findAllByGroupMatchId.mockResolvedValueOnce(
        [
          makePresenceSummaryMock({
            userId: confirmedMember.userId,
            isPresent: true,
          }),
          makePresenceSummaryMock({
            userId: null,
            guestUserId: declinedGuest.id,
            isPresent: false,
          }),
        ],
      );

      const response = await sut.findMatchPresences(
        "group-id",
        "match-id",
        "user-id",
      );

      expect(response.confirmed).toEqual([
        expect.objectContaining({
          id: confirmedMember.userId,
          isGuest: false,
        }),
      ]);
      expect(response.declined).toEqual([
        expect.objectContaining({
          id: declinedGuest.id,
          isGuest: true,
        }),
      ]);
      expect(response.pending).toEqual([
        expect.objectContaining({
          id: pendingMember.userId,
          isGuest: false,
        }),
      ]);
    });

    it("should sort each group by rank, highest first", async () => {
      const lowRank = makeGroupMemberWithUserMock({
        userId: "low-rank-id",
        rank: UserRank.BRASILEIRAO,
      });
      const highRank = makeGroupMemberWithUserMock({
        userId: "high-rank-id",
        rank: UserRank.BALLON_DOR,
      });
      groupMembersRepoMock.findAllByGroupIdWithUser.mockResolvedValueOnce(
        [lowRank, highRank],
      );
      matchPresencesRepoMock.findAllByGroupMatchId.mockResolvedValueOnce(
        [
          makePresenceSummaryMock({
            userId: lowRank.userId,
            isPresent: true,
          }),
          makePresenceSummaryMock({
            userId: highRank.userId,
            isPresent: true,
          }),
        ],
      );

      const response = await sut.findMatchPresences(
        "group-id",
        "match-id",
        "user-id",
      );

      expect(response.confirmed.map((m) => m.id)).toEqual([
        highRank.userId,
        lowRank.userId,
      ]);
    });

    it("should throw ForbiddenException when the requester is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findMatchPresences(
        "group-id",
        "match-id",
        "user-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        groupMembersRepoMock.findAllByGroupIdWithUser,
      ).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the match does not belong to the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.findMatchPresences(
        "group-id",
        "match-id",
        "user-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateMatchPresences", () => {
    it("should set the user's presence and return a confirmation message", async () => {
      const dto = makeUpdateMatchPresenceInputMock({
        isPresent: false,
      });

      const response = await sut.updateMatchPresences(
        "user-id",
        "group-id",
        "match-id",
        dto,
      );

      expect(
        matchPresencesRepoMock.setUserPresence,
      ).toHaveBeenCalledWith("match-id", "user-id", false);
      expect(response).toEqual({
        message: "Match presence updated successfully",
      });
    });

    it("should throw ForbiddenException and not set presence when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.updateMatchPresences(
        "user-id",
        "group-id",
        "match-id",
        makeUpdateMatchPresenceInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        matchPresencesRepoMock.setUserPresence,
      ).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException and not set presence when the match is not in the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.updateMatchPresences(
        "user-id",
        "group-id",
        "match-id",
        makeUpdateMatchPresenceInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(
        matchPresencesRepoMock.setUserPresence,
      ).not.toHaveBeenCalled();
    });
  });

  describe("checkIfUserWentToMatch", () => {
    it("should return the user's presence for a match that already happened", async () => {
      matchPresencesRepoMock.findByMatchAndUserWithMatchDate.mockResolvedValueOnce(
        {
          isPresent: true,
          matchDate: new Date(Date.now() - 60 * 60 * 1000),
        },
      );

      const response = await sut.checkIfUserWentToMatch({
        userId: "user-id",
        matchId: "match-id",
      });

      expect(response).toBe(true);
    });

    it("should throw NotFoundException when there is no presence for the user", async () => {
      matchPresencesRepoMock.findByMatchAndUserWithMatchDate.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.checkIfUserWentToMatch({
        userId: "user-id",
        matchId: "match-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when the match has not happened yet", async () => {
      matchPresencesRepoMock.findByMatchAndUserWithMatchDate.mockResolvedValueOnce(
        {
          isPresent: true,
          matchDate: new Date(Date.now() + 60 * 60 * 1000),
        },
      );

      const promiseResult = sut.checkIfUserWentToMatch({
        userId: "user-id",
        matchId: "match-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
