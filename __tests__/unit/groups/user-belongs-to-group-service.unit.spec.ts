import { mock } from "vitest-mock-extended";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { ForbiddenException } from "@nestjs/common";
import { makeGroupMemberMock } from "../../utils/groups";

const groupMembersRepoMock = mock<IGroupMembersRepository>();

let sut: UserBelongsToGroupService;
beforeEach(() => {
  sut = new UserBelongsToGroupService(groupMembersRepoMock);
});

describe("UserBelongsToGroupService", () => {
  describe("check", () => {
    it("should return the member when the user belongs to the group", async () => {
      const member = makeGroupMemberMock();
      groupMembersRepoMock.findByGroupIdAndUserId.mockResolvedValueOnce(
        member,
      );

      const response = await sut.check({
        memberId: member.userId,
        groupId: member.groupId,
      });

      expect(
        groupMembersRepoMock.findByGroupIdAndUserId,
      ).toHaveBeenCalledWith(member.groupId, member.userId);
      expect(response).toEqual({ isMember: true, member });
    });

    it("should throw ForbiddenException when the user does not belong to the group", async () => {
      groupMembersRepoMock.findByGroupIdAndUserId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.check({
        memberId: "any-user-id",
        groupId: "any-group-id",
      });

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
