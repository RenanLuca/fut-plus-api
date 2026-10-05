import { mock } from "vitest-mock-extended";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupMembersService } from "@src/modules/group-members/group-members.service";
import { GroupsService } from "@src/modules/groups/services/groups.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  makeGroupMemberMock,
  makeGroupMemberWithUserMock,
  makeGroupMock,
} from "../../utils/groups";

const groupMembersRepoMock = mock<IGroupMembersRepository>();
const groupsServiceMock = mock<GroupsService>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();

const ownerId = randomUUID();

let sut: GroupMembersService;
beforeEach(() => {
  sut = new GroupMembersService(
    groupMembersRepoMock,
    groupsServiceMock,
    userBelongsToGroupServiceMock,
  );
  groupsServiceMock.checkIfGroupExists.mockResolvedValue(
    makeGroupMock({ ownerId }),
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
});

describe("GroupMembersService", () => {
  describe("removeGroupMember", () => {
    it("should remove the member from the group", async () => {
      const memberId = randomUUID();

      await sut.removeGroupMember("group-id", memberId);

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId,
        groupId: "group-id",
      });
      expect(
        groupMembersRepoMock.removeByGroupIdAndUserId,
      ).toHaveBeenCalledWith("group-id", memberId);
    });

    it("should throw BadRequestException when the user is the group owner", async () => {
      const promiseResult = sut.removeGroupMember(
        "group-id",
        ownerId,
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(
        groupMembersRepoMock.removeByGroupIdAndUserId,
      ).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.removeGroupMember(
        "group-id",
        randomUUID(),
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        groupMembersRepoMock.removeByGroupIdAndUserId,
      ).not.toHaveBeenCalled();
    });

    it("should propagate NotFoundException when the group does not exist", async () => {
      groupsServiceMock.checkIfGroupExists.mockRejectedValueOnce(
        new NotFoundException("Group not found"),
      );

      const promiseResult = sut.removeGroupMember(
        "group-id",
        randomUUID(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findMembersByGroupId", () => {
    it("should return the group's members with their user info when the requester is a member", async () => {
      const members = [makeGroupMemberWithUserMock()];
      groupMembersRepoMock.findAllByGroupIdWithUser.mockResolvedValueOnce(
        members,
      );

      const response = await sut.findMembersByGroupId(
        "user-id",
        "group-id",
      );

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId: "user-id",
        groupId: "group-id",
      });
      expect(response).toEqual(members);
    });

    it("should throw ForbiddenException when the requester is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findMembersByGroupId(
        "user-id",
        "group-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        groupMembersRepoMock.findAllByGroupIdWithUser,
      ).not.toHaveBeenCalled();
    });
  });
});
