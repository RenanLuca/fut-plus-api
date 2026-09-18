import { Injectable } from "@nestjs/common";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";
import { GuestUsersRepository } from "@src/shared/database/repositories/guest-users.repository";
import { UsersService } from "../users/users.service";
import { GroupsService } from "../groups/services/groups.service";
import { CreateGroupMemberDto } from "./dto/create-group-member.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";

@Injectable()
export class GroupMembersService {
  constructor(
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly guestUsersRepository: GuestUsersRepository,
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
    const { type, rank, name, position } = createGroupMemberDto;

    if (type === "MONTHLY" || type === "DAILY") {
      return await this.groupMembersRepository.create({
        data: {
          groupId,
          userId,
          type: type,
          rank: rank,
        },
      });
    }

    return await this.guestUsersRepository.createAndConnectToGroup(
      { name, position },
      groupId,
      rank,
    );
  }

  async removeGroupMember(
    groupId: string,
    identifier: { userId?: string; guestUserId?: string },
  ) {
    await this.groupsService.checkIfGroupExists(groupId);

    if (identifier.userId) {
      await this.usersBelongToGroupService.check({
        memberId: identifier.userId,
        groupId,
        type: "user",
      });
      await this.groupMembersRepository.delete({
        where: {
          groupId_userId: { groupId, userId: identifier.userId },
        },
      });
      return;
    }

    await this.usersBelongToGroupService.check({
      memberId: identifier.guestUserId!,
      groupId,
      type: "guest",
    });
    await this.guestUsersRepository.delete({
      where: { id: identifier.guestUserId! },
    });
  }

  async findMembersByGroupId(userId: string, groupId: string) {
    await this.groupsService.checkIfGroupExists(groupId);
    await this.usersBelongToGroupService.check({
      memberId: userId,
      groupId,
      type: "user",
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
        guestUser: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });
  }
}
