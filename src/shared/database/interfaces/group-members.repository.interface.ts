import { GroupMemberType } from "@src/shared/enum/groupMemberType";
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

export interface IGroupMembersRepository {
  create(data: {
    groupId: string;
    userId: string;
    type: GroupMemberType;
    rank?: UserRank;
  }): Promise<GroupMember>;

  findById(id: string): Promise<GroupMember | null>;

  findByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null>;

  findAllByGroupId(
    groupId: string,
    options?: {
      includeUser?: boolean;
    },
  ): Promise<(GroupMember & {
    user?: { name: string; email: string; emailNotifications: boolean; emailVerifiedAt: Date | null } | null;
  })[]>;

  findAllByGroupIdWithNotificationFilters(
    groupId: string,
  ): Promise<(GroupMember & {
    user?: { name: string; email: string } | null;
  })[]>;

  delete(id: string): Promise<GroupMember>;
}
