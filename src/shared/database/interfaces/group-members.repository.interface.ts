import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

export const GROUP_MEMBERS_REPOSITORY = Symbol(
  "GROUP_MEMBERS_REPOSITORY",
);

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  type: GroupMemberType;
  rank: UserRank | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupMemberWithUser = GroupMember & {
  user: {
    id: string;
    name: string;
    position: PositionEnum;
    profilePicture: string | null;
  };
};

export type MemberWithNotificationEmail = GroupMember & {
  user: { name: string; email: string };
};

export type ConfirmedMember = {
  userId: string;
  rank: UserRank | null;
  position: PositionEnum;
};

export interface IGroupMembersRepository {
  create(data: {
    groupId: string;
    userId: string;
    type: GroupMemberType;
    rank?: UserRank;
  }): Promise<GroupMember>;

  findByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null>;

  findAllByGroupIdWithUser(
    groupId: string,
  ): Promise<GroupMemberWithUser[]>;

  /**
   * Members with a verified, notification-enabled email — the audience
   * for "match opened" emails.
   */
  findAllByGroupIdWithNotificationFilters(
    groupId: string,
  ): Promise<MemberWithNotificationEmail[]>;

  /**
   * Registered members (not guests) confirmed present (`isPresent: true`)
   * for the match, with just the fields the team balancer needs. Guests
   * are a separate model (IGuestUsersRepository.findConfirmedGuestsByGroupMatchId)
   * — a caller that needs everyone confirmed for a match must call both.
   */
  findConfirmedMembersByGroupMatchId(
    groupId: string,
    groupMatchId: string,
  ): Promise<ConfirmedMember[]>;

  removeByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<void>;
}
