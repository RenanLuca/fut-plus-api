import {
  ForbiddenException,
  Injectable,
  Inject,
} from "@nestjs/common";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";

@Injectable()
export class UserBelongsToGroupService {
  constructor(
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository,
  ) {}
  async check({
    memberId,
    groupId,
  }: {
    memberId: string;
    groupId: string;
  }) {
    const groupMember =
      await this.groupMembersRepository.findByGroupIdAndUserId(
        groupId,
        memberId,
      );
    if (!groupMember) {
      throw new ForbiddenException(
        `Member does not belong to the group`,
      );
    }

    return { isMember: !!groupMember, member: groupMember };
  }
}
