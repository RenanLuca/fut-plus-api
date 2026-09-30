import { mock } from "vitest-mock-extended";
import type { IGroupsRepository } from "@src/shared/database/interfaces/groups.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupsService } from "@src/modules/groups/services/groups.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { randomUUID } from "crypto";
import {
  makeCreateGroupInputMock,
  makeGroupMemberMock,
  makeGroupMock,
  makeTransferOwnershipInputMock,
  makeUpdateGroupInputMock,
} from "../../utils/groups";

const groupsRepoMock = mock<IGroupsRepository>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();

const ownerId = randomUUID();

let sut: GroupsService;
beforeEach(() => {
  sut = new GroupsService(
    groupsRepoMock,
    userBelongsToGroupServiceMock,
  );
  groupsRepoMock.findById.mockResolvedValue(
    makeGroupMock({ ownerId }),
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
});

describe("GroupsService", () => {
  describe("create", () => {
    it("should create the group with the owner and rank split from the dto", async () => {
      const createGroupDto = makeCreateGroupInputMock();
      const group = makeGroupMock({ ownerId });
      groupsRepoMock.createWithOwner.mockResolvedValueOnce(group);

      const response = await sut.create(createGroupDto, ownerId);

      const { rank, ...groupData } = createGroupDto;
      expect(groupsRepoMock.createWithOwner).toHaveBeenCalledWith(
        { ...groupData, ownerId },
        rank,
      );
      expect(response).toEqual(group);
    });
  });

  describe("findAllGroupsPerUser", () => {
    it("should return every group the user is a member of", async () => {
      const groups = [makeGroupMock(), makeGroupMock()];
      groupsRepoMock.findAllByMember.mockResolvedValueOnce(groups);

      const response = await sut.findAllGroupsPerUser("user-id");

      expect(groupsRepoMock.findAllByMember).toHaveBeenCalledWith(
        "user-id",
      );
      expect(response).toEqual(groups);
    });
  });

  describe("findAllByFrequency", () => {
    it("should return every group with the given frequency", async () => {
      const groups = [
        makeGroupMock({ frequency: FrequencyType.MONTHLY }),
      ];
      groupsRepoMock.findAllByFrequency.mockResolvedValueOnce(
        groups,
      );

      const response = await sut.findAllByFrequency(
        FrequencyType.MONTHLY,
      );

      expect(
        groupsRepoMock.findAllByFrequency,
      ).toHaveBeenCalledWith(FrequencyType.MONTHLY);
      expect(response).toEqual(groups);
    });
  });

  describe("checkIfGroupExists", () => {
    it("should return the group when found", async () => {
      const group = makeGroupMock();
      groupsRepoMock.findById.mockResolvedValueOnce(group);

      const response = await sut.checkIfGroupExists(group.id);

      expect(response).toEqual(group);
    });

    it("should throw NotFoundException when the group does not exist", async () => {
      groupsRepoMock.findById.mockResolvedValueOnce(null);

      const promiseResult = sut.checkIfGroupExists("any-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("checkIfUserIsOwner", () => {
    it("should return true when the user owns the group", async () => {
      groupsRepoMock.findById.mockResolvedValueOnce(
        makeGroupMock({ ownerId }),
      );

      const response = await sut.checkIfUserIsOwner(
        "group-id",
        ownerId,
      );

      expect(response).toBe(true);
    });

    it("should throw ForbiddenException when the user does not own the group", async () => {
      groupsRepoMock.findById.mockResolvedValueOnce(
        makeGroupMock({ ownerId }),
      );

      const promiseResult = sut.checkIfUserIsOwner(
        "group-id",
        "someone-else-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("findOne", () => {
    it("should return the group when the user is a member", async () => {
      const group = makeGroupMock();
      // findOne() calls findById twice under the hood (once via
      // checkIfGroupExists, once directly for the return value), so a
      // persistent mock is needed here instead of mockResolvedValueOnce.
      groupsRepoMock.findById.mockResolvedValue(group);

      const response = await sut.findOne("user-id", group.id);

      expect(userBelongsToGroupServiceMock.check).toHaveBeenCalledWith(
        { memberId: "user-id", groupId: group.id },
      );
      expect(response).toEqual(group);
    });

    it("should throw ForbiddenException when the user is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findOne(
        "user-id",
        "any-group-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("update", () => {
    it("should update the group when the user is the owner", async () => {
      const updateGroupDto = makeUpdateGroupInputMock();
      const updatedGroup = makeGroupMock({ ownerId });
      groupsRepoMock.update.mockResolvedValueOnce(updatedGroup);

      const response = await sut.update(
        "group-id",
        updateGroupDto,
        ownerId,
      );

      expect(groupsRepoMock.update).toHaveBeenCalledWith(
        "group-id",
        updateGroupDto,
      );
      expect(response).toEqual(updatedGroup);
    });

    it("should throw ForbiddenException when the user is not the owner", async () => {
      const promiseResult = sut.update(
        "group-id",
        makeUpdateGroupInputMock(),
        "someone-else-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(groupsRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should delete the group when the user is the owner", async () => {
      const group = makeGroupMock({ ownerId });
      groupsRepoMock.delete.mockResolvedValueOnce(group);

      const response = await sut.remove("group-id", ownerId);

      expect(groupsRepoMock.delete).toHaveBeenCalledWith(
        "group-id",
      );
      expect(response).toEqual(group);
    });
  });

  describe("transferOwnership", () => {
    it("should transfer ownership to a member of the group", async () => {
      const transferOwnershipDto = makeTransferOwnershipInputMock();
      const group = makeGroupMock({
        ownerId: transferOwnershipDto.newOwnerId,
      });
      groupsRepoMock.transferOwnership.mockResolvedValueOnce(
        group,
      );

      const response = await sut.transferOwnership(
        "group-id",
        ownerId,
        transferOwnershipDto,
      );

      expect(
        userBelongsToGroupServiceMock.check,
      ).toHaveBeenCalledWith({
        memberId: transferOwnershipDto.newOwnerId,
        groupId: "group-id",
      });
      expect(
        groupsRepoMock.transferOwnership,
      ).toHaveBeenCalledWith({
        groupId: "group-id",
        currentOwnerId: ownerId,
        newOwnerId: transferOwnershipDto.newOwnerId,
      });
      expect(response).toEqual(group);
    });

    it("should throw BadRequestException when the new owner is the current owner", async () => {
      const promiseResult = sut.transferOwnership(
        "group-id",
        ownerId,
        makeTransferOwnershipInputMock({ newOwnerId: ownerId }),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(
        groupsRepoMock.transferOwnership,
      ).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when the new owner is not a member of the group", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.transferOwnership(
        "group-id",
        ownerId,
        makeTransferOwnershipInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        groupsRepoMock.transferOwnership,
      ).not.toHaveBeenCalled();
    });
  });
});
