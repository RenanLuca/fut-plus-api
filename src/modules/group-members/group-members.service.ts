import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { GroupsService } from "../groups/services/groups.service";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";

@Injectable()
export class GroupMembersService {
  constructor(
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository & {
      deleteLegacy: any;
      findMany: any;
    },
    private readonly groupsService: GroupsService,
    private readonly usersBelongToGroupService: UserBelongsToGroupService,
  ) {}

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
    await (this.groupMembersRepository as any).deleteLegacy({
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
