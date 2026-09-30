import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GROUP_INVITES_REPOSITORY } from "@src/shared/database/interfaces/group-invites.repository.interface";
import type { IGroupInvitesRepository } from "@src/shared/database/interfaces/group-invites.repository.interface";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { GroupsService } from "../groups/services/groups.service";
import { AcceptInviteDto } from "./dto/accept-invite.dto";

@Injectable()
export class GroupInvitesService {
  constructor(
    @Inject(GROUP_INVITES_REPOSITORY)
    private readonly groupInvitesRepository: IGroupInvitesRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository,
    private readonly groupsService: GroupsService,
  ) {}

  async findByGroup(groupId: string) {
    const invite =
      await this.groupInvitesRepository.findByGroupId(groupId);
    if (!invite) {
      throw new NotFoundException("Group has no active invite");
    }
    return invite;
  }

  async regenerate(groupId: string) {
    await this.groupsService.checkIfGroupExists(groupId);
    return this.groupInvitesRepository.replaceForGroup(groupId);
  }

  async revoke(groupId: string) {
    const { count } =
      await this.groupInvitesRepository.deleteByGroupId(groupId);
    if (count === 0) {
      throw new NotFoundException("Group has no active invite");
    }
  }

  async preview(inviteId: string, userId: string) {
    const invite =
      await this.checkIfInviteExistsWithGroupDetails(inviteId);
    const { group } = invite;
    const member =
      await this.groupMembersRepository.findByGroupIdAndUserId(
        group.id,
        userId,
      );

    return {
      id: invite.id,
      alreadyMember: !!member,
      membersCount: group._count.groupMembers,
      group: {
        id: group.id,
        name: group.name,
        weekday: group.weekday,
        hour: group.hour,
        frequency: group.frequency,
        valuePerUser: group.valuePerUser,
      },
      owner: { name: group.owner.name },
    };
  }

  async accept(
    inviteId: string,
    userId: string,
    { type, rank }: AcceptInviteDto,
  ) {
    const { groupId } = await this.checkIfInviteExists(inviteId);
    const member =
      await this.groupMembersRepository.findByGroupIdAndUserId(
        groupId,
        userId,
      );
    if (member) {
      throw new ConflictException(
        "User already belongs to the group",
      );
    }

    return this.groupMembersRepository.create({
      groupId,
      userId,
      type,
      rank: rank,
    });
  }

  private async checkIfInviteExists(inviteId: string) {
    const invite =
      await this.groupInvitesRepository.findById(inviteId);
    if (!invite) {
      throw new NotFoundException("Invite not found or revoked");
    }
    return invite;
  }

  private async checkIfInviteExistsWithGroupDetails(
    inviteId: string,
  ) {
    const invite =
      await this.groupInvitesRepository.findByIdWithGroupDetails(
        inviteId,
      );
    if (!invite) {
      throw new NotFoundException("Invite not found or revoked");
    }
    return invite;
  }
}
