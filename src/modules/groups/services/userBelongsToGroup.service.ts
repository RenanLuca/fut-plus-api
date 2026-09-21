import { ForbiddenException, Injectable } from "@nestjs/common";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";

@Injectable()
export class UserBelongsToGroupService {
  constructor(
    private readonly groupMembersRepository: GroupMembersRepository,
  ) {}
  async check({
    memberId,
    groupId,
  }: {
    memberId: string;
    groupId: string;
  }) {
    const groupMember =
      await this.groupMembersRepository.findUnique({
        where: { groupId_userId: { groupId, userId: memberId } },
      });
    if (!groupMember) {
      throw new ForbiddenException(
        `Member does not belong to the group`,
      );
    }

    return { isMember: !!groupMember, member: groupMember };
  }
}
