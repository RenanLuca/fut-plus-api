import { mock } from "vitest-mock-extended";
import type { IGroupInvitesRepository } from "@src/shared/database/interfaces/group-invites.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupInvitesService } from "@src/modules/group-invites/group-invites.service";
import { GroupsService } from "@src/modules/groups/services/groups.service";
import {
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { makeGroupMock, makeGroupMemberMock } from "../../utils/groups";
import {
  makeAcceptInviteInputMock,
  makeGroupInviteMock,
  makeGroupInviteWithGroupMock,
} from "../../utils/group-invites";

const groupInvitesRepoMock = mock<IGroupInvitesRepository>();
const groupMembersRepoMock = mock<IGroupMembersRepository>();
const groupsServiceMock = mock<GroupsService>();

let sut: GroupInvitesService;
beforeEach(() => {
  sut = new GroupInvitesService(
    groupInvitesRepoMock,
    groupMembersRepoMock,
    groupsServiceMock,
  );
  groupMembersRepoMock.findByGroupIdAndUserId.mockResolvedValue(
    null,
  );
});

describe("GroupInvitesService", () => {
  describe("findByGroup", () => {
    it("should return the group's active invite", async () => {
      const invite = makeGroupInviteMock();
      groupInvitesRepoMock.findByGroupId.mockResolvedValueOnce(
        invite,
      );

      const response = await sut.findByGroup(invite.groupId);

      expect(response).toEqual(invite);
    });

    it("should throw NotFoundException when the group has no active invite", async () => {
      groupInvitesRepoMock.findByGroupId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.findByGroup("group-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("regenerate", () => {
    it("should check the group exists and replace its invite", async () => {
      const invite = makeGroupInviteMock();
      groupsServiceMock.checkIfGroupExists.mockResolvedValueOnce(
        makeGroupMock({ id: invite.groupId }),
      );
      groupInvitesRepoMock.replaceForGroup.mockResolvedValueOnce(
        invite,
      );

      const response = await sut.regenerate(invite.groupId);

      expect(
        groupsServiceMock.checkIfGroupExists,
      ).toHaveBeenCalledWith(invite.groupId);
      expect(
        groupInvitesRepoMock.replaceForGroup,
      ).toHaveBeenCalledWith(invite.groupId);
      expect(response).toEqual(invite);
    });

    it("should propagate the error if the group does not exist", async () => {
      groupsServiceMock.checkIfGroupExists.mockRejectedValueOnce(
        new NotFoundException("Group not found"),
      );

      const promiseResult = sut.regenerate("any-group-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(
        groupInvitesRepoMock.replaceForGroup,
      ).not.toHaveBeenCalled();
    });
  });

  describe("revoke", () => {
    it("should succeed when an invite was deleted", async () => {
      groupInvitesRepoMock.deleteByGroupId.mockResolvedValueOnce({
        count: 1,
      });

      await expect(
        sut.revoke("group-id"),
      ).resolves.toBeUndefined();
    });

    it("should throw NotFoundException when there was no invite to delete", async () => {
      groupInvitesRepoMock.deleteByGroupId.mockResolvedValueOnce({
        count: 0,
      });

      const promiseResult = sut.revoke("group-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("preview", () => {
    it("should return the invite preview with alreadyMember false when the user is not a member", async () => {
      const invite = makeGroupInviteWithGroupMock();
      groupInvitesRepoMock.findByIdWithGroupDetails.mockResolvedValueOnce(
        invite,
      );

      const response = await sut.preview(invite.id, "user-id");

      expect(response).toEqual({
        id: invite.id,
        alreadyMember: false,
        membersCount: invite.group._count.groupMembers,
        group: {
          id: invite.group.id,
          name: invite.group.name,
          weekday: invite.group.weekday,
          hour: invite.group.hour,
          frequency: invite.group.frequency,
          valuePerUser: invite.group.valuePerUser,
        },
        owner: { name: invite.group.owner.name },
      });
    });

    it("should return alreadyMember true when the user is already a member", async () => {
      const invite = makeGroupInviteWithGroupMock();
      groupInvitesRepoMock.findByIdWithGroupDetails.mockResolvedValueOnce(
        invite,
      );
      groupMembersRepoMock.findByGroupIdAndUserId.mockResolvedValueOnce(
        makeGroupMemberMock(),
      );

      const response = await sut.preview(invite.id, "user-id");

      expect(response.alreadyMember).toBe(true);
    });

    it("should throw NotFoundException when the invite does not exist", async () => {
      groupInvitesRepoMock.findByIdWithGroupDetails.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.preview("any-invite-id", "user-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("accept", () => {
    it("should add the user as a member of the group", async () => {
      const invite = makeGroupInviteMock();
      const acceptInviteDto = makeAcceptInviteInputMock();
      const member = makeGroupMemberMock();
      groupInvitesRepoMock.findById.mockResolvedValueOnce(invite);
      groupMembersRepoMock.create.mockResolvedValueOnce(member);

      const response = await sut.accept(
        invite.id,
        "user-id",
        acceptInviteDto,
      );

      expect(groupMembersRepoMock.create).toHaveBeenCalledWith({
        groupId: invite.groupId,
        userId: "user-id",
        type: acceptInviteDto.type,
        rank: acceptInviteDto.rank,
      });
      expect(response).toEqual(member);
    });

    it("should throw ConflictException if the user already belongs to the group", async () => {
      const invite = makeGroupInviteMock();
      groupInvitesRepoMock.findById.mockResolvedValueOnce(invite);
      groupMembersRepoMock.findByGroupIdAndUserId.mockResolvedValueOnce(
        makeGroupMemberMock(),
      );

      const promiseResult = sut.accept(
        invite.id,
        "user-id",
        makeAcceptInviteInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
      expect(groupMembersRepoMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the invite does not exist", async () => {
      groupInvitesRepoMock.findById.mockResolvedValueOnce(null);

      const promiseResult = sut.accept(
        "any-invite-id",
        "user-id",
        makeAcceptInviteInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
