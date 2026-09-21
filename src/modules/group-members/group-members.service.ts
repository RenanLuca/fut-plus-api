import { BadRequestException, Injectable } from "@nestjs/common";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";
import { UsersService } from "../users/users.service";
import { GroupsService } from "../groups/services/groups.service";
import { CreateGroupMemberDto } from "./dto/create-group-member.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";

@Injectable()
export class GroupMembersService {
  constructor(
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
    private readonly usersBelongToGroupService: UserBelongsToGroupService,
  ) {}

  async addGroupMember(
    groupId: string,
    createGroupMemberDto: CreateGroupMemberDto,
    userId: string,
  ) {
    await this.groupsService.checkIfGroupExists(groupId);
    await this.usersService.checkIfUserExists(userId);
    const { type, rank } = createGroupMemberDto;

    return await this.groupMembersRepository.create({
      data: { groupId, userId, type, rank },
    });
  }

  async removeGroupMember(groupId: string, userId: string) {
    const group =
      await this.groupsService.checkIfGroupExists(groupId);

    if (group.ownerId === userId) {
      throw new BadRequestException(
        "The group owner cannot leave or be removed; transfer ownership first",
      );
    }
    await this.usersBelongToGroupService.check({
      memberId: userId,
      groupId,
    });
    await this.groupMembersRepository.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async findMembersByGroupId(userId: string, groupId: string) {
    await this.groupsService.checkIfGroupExists(groupId);
    await this.usersBelongToGroupService.check({
      memberId: userId,
      groupId,
    });
    return this.groupMembersRepository.findMany({
      where: {
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            position: true,
          },
        },
      },
    });
  }
}
