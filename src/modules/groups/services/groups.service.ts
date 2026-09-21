import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateGroupDto } from "../dto/create-group.dto";
import { UpdateGroupDto } from "../dto/update-group.dto";
import { TransferOwnershipDto } from "../dto/transfer-ownership.dto";
import { GroupsRepository } from "@src/shared/database/repositories/groups.repository";
import { UserBelongsToGroupService } from "./userBelongsToGroup.service";
import { FrequencyType } from "@src/shared/enum/FrequencyType";

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
  ) {}
  async create(createGroupDto: CreateGroupDto, ownerId: string) {
    return this.groupsRepository.createWithOwner(
      { ...createGroupDto, ownerId },
      ownerId,
    );
  }

  findAllGroupsPerUser(userId: string) {
    return this.groupsRepository.findMany({
      where: {
        groupMembers: {
          some: { userId },
        },
      },
    });
  }

  findAllByFrequency(frequency: FrequencyType) {
    return this.groupsRepository.findMany({
      where: { frequency },
    });
  }

  async findOne(userId: string, id: string) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId: id,
    });
    await this.checkIfGroupExists(id);
    return await this.groupsRepository.findUnique({
      where: { id },
    });
  }

  async update(
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ) {
    await this.checkIfUserIsOwner(groupId, userId);
    await this.checkIfGroupExists(groupId);
    return await this.groupsRepository.update({
      where: { id: groupId },
      data: updateGroupDto,
    });
  }

  async remove(groupId: string, userId: string) {
    await this.checkIfUserIsOwner(groupId, userId);
    await this.checkIfGroupExists(groupId);
    return await this.groupsRepository.delete({
      where: { id: groupId },
    });
  }

  async transferOwnership(
    groupId: string,
    userId: string,
    { newOwnerId }: TransferOwnershipDto,
  ) {
    await this.checkIfUserIsOwner(groupId, userId);
    if (newOwnerId === userId) {
      throw new BadRequestException(
        "The new owner must be a different member",
      );
    }
    await this.userBelongsToGroupService.check({
      memberId: newOwnerId,
      groupId,
      type: "user",
    });
    return this.groupsRepository.transferOwnership({
      groupId,
      currentOwnerId: userId,
      newOwnerId,
    });
  }

  async checkIfGroupExists(id: string) {
    const group = await this.groupsRepository.findUnique({
      where: { id },
    });
    if (!group) {
      throw new NotFoundException(`Group not found`);
    }
    return group;
  }

  async checkIfUserIsOwner(groupId: string, userId: string) {
    const isOwner = await this.isUserOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenException(
        `User is not the owner of the group`,
      );
    }
    return isOwner;
  }

  async isUserOwner(
    groupId: string,
    userId: string,
  ): Promise<boolean> {
    const group = await this.checkIfGroupExists(groupId);
    return group.ownerId === userId;
  }
}
