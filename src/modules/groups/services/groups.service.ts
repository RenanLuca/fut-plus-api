import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateGroupDto } from "../dto/create-group.dto";
import { UpdateGroupDto } from "../dto/update-group.dto";
import { TransferOwnershipDto } from "../dto/transfer-ownership.dto";
import { GROUPS_REPOSITORY } from "@src/shared/database/interfaces/groups.repository.interface";
import type { IGroupsRepository } from "@src/shared/database/interfaces/groups.repository.interface";
import { UserBelongsToGroupService } from "./userBelongsToGroup.service";
import { FrequencyType } from "@src/shared/enum/FrequencyType";

@Injectable()
export class GroupsService {
  constructor(
    @Inject(GROUPS_REPOSITORY)
    private readonly groupsRepository: IGroupsRepository,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
  ) {}
  async create(createGroupDto: CreateGroupDto, ownerId: string) {
    const { rank, ...groupData } = createGroupDto;
    return this.groupsRepository.createWithOwner(
      { ...groupData, ownerId },
      rank,
    );
  }

  findAllGroupsPerUser(userId: string) {
    return this.groupsRepository.findAllByMember(userId);
  }

  findAllByFrequency(frequency: FrequencyType) {
    return this.groupsRepository.findAllByFrequency(frequency);
  }

  async findOne(userId: string, id: string) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId: id,
    });
    await this.checkIfGroupExists(id);
    return await this.groupsRepository.findById(id);
  }

  async update(
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ) {
    await this.checkIfUserIsOwner(groupId, userId);
    await this.checkIfGroupExists(groupId);
    return await this.groupsRepository.update(
      groupId,
      updateGroupDto,
    );
  }

  async remove(groupId: string, userId: string) {
    await this.checkIfUserIsOwner(groupId, userId);
    await this.checkIfGroupExists(groupId);
    return await this.groupsRepository.delete(groupId);
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
    });
    return this.groupsRepository.transferOwnership({
      groupId,
      currentOwnerId: userId,
      newOwnerId,
    });
  }

  async checkIfGroupExists(id: string) {
    const group = await this.groupsRepository.findById(id);
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
