import { mock } from "vitest-mock-extended";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { GroupMatchNotificationsService } from "@src/modules/group-matches/services/group-match-notifications.service";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { makeGroupMemberMock } from "../../utils/groups";
import {
  makeCreateGroupMatchInputMock,
  makeGroupMatchMock,
} from "../../utils/group-matches";

const groupMatchesRepoMock = mock<IGroupMatchesRepository>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();
const groupMatchNotificationsServiceMock =
  mock<GroupMatchNotificationsService>();

let sut: GroupMatchesService;
beforeEach(() => {
  sut = new GroupMatchesService(
    groupMatchesRepoMock,
    userBelongsToGroupServiceMock,
    groupMatchNotificationsServiceMock,
  );
  groupMatchesRepoMock.findByGroupIdAndDate.mockResolvedValue(
    null,
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
});

describe("GroupMatchesService", () => {
  describe("create", () => {
    it("should throw BadRequestException if the match date is in the past", async () => {
      const promiseResult = sut.create(
        "group-id",
        makeCreateGroupMatchInputMock({
          matchDate: new Date(
            Date.now() - 60_000,
          ).toISOString(),
        }),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(groupMatchesRepoMock.create).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if a match already exists on that date", async () => {
      groupMatchesRepoMock.findByGroupIdAndDate.mockResolvedValueOnce(
        makeGroupMatchMock(),
      );

      const promiseResult = sut.create(
        "group-id",
        makeCreateGroupMatchInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
      expect(groupMatchesRepoMock.create).not.toHaveBeenCalled();
    });

    it("should create the match and notify the group's members", async () => {
      const createGroupMatchDto = makeCreateGroupMatchInputMock();
      const match = makeGroupMatchMock({
        groupId: "group-id",
        matchDate: new Date(createGroupMatchDto.matchDate),
      });
      groupMatchesRepoMock.create.mockResolvedValueOnce(match);

      const response = await sut.create(
        "group-id",
        createGroupMatchDto,
      );

      expect(groupMatchesRepoMock.create).toHaveBeenCalledWith({
        groupId: "group-id",
        matchDate: new Date(createGroupMatchDto.matchDate),
      });
      expect(
        groupMatchNotificationsServiceMock.notifyMatchOpened,
      ).toHaveBeenCalledWith({
        groupId: "group-id",
        matchDate: match.matchDate,
      });
      expect(response).toEqual(match);
    });
  });

  describe("findAll", () => {
    it("should return every match in the group when the user is a member", async () => {
      const matches = [makeGroupMatchMock(), makeGroupMatchMock()];
      groupMatchesRepoMock.findAllByGroupId.mockResolvedValueOnce(
        matches,
      );

      const response = await sut.findAll("group-id", "user-id");

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId: "user-id",
        groupId: "group-id",
      });
      expect(response).toEqual(matches);
    });

    it("should throw ForbiddenException when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findAll(
        "group-id",
        "user-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("checkIfMatchBelongsToGroup", () => {
    it("should return the match when it belongs to the group", async () => {
      const match = makeGroupMatchMock();
      groupMatchesRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        match,
      );

      const response = await sut.checkIfMatchBelongsToGroup({
        groupId: match.groupId,
        matchId: match.id,
      });

      expect(response).toEqual(match);
    });

    it("should throw NotFoundException when the match does not belong to the group", async () => {
      groupMatchesRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.checkIfMatchBelongsToGroup({
        groupId: "group-id",
        matchId: "match-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findOne", () => {
    it("should return the match when the user is a member", async () => {
      const match = makeGroupMatchMock();
      groupMatchesRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        match,
      );

      const response = await sut.findOne({
        groupId: match.groupId,
        matchId: match.id,
        userId: "user-id",
      });

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId: "user-id",
        groupId: match.groupId,
      });
      expect(response).toEqual(match);
    });

    it("should throw ForbiddenException when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findOne({
        groupId: "group-id",
        matchId: "match-id",
        userId: "user-id",
      });

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("remove", () => {
    it("should delete the match", async () => {
      const match = makeGroupMatchMock();
      groupMatchesRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        match,
      );
      groupMatchesRepoMock.delete.mockResolvedValueOnce(match);

      const response = await sut.remove(
        match.groupId,
        match.id,
      );

      expect(groupMatchesRepoMock.delete).toHaveBeenCalledWith(
        match.id,
      );
      expect(response).toEqual(match);
    });

    it("should throw NotFoundException when the match does not belong to the group", async () => {
      groupMatchesRepoMock.findByIdAndGroupId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.remove(
        "group-id",
        "match-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(groupMatchesRepoMock.delete).not.toHaveBeenCalled();
    });
  });
});
