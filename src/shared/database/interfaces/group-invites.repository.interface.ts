export const GROUP_INVITES_REPOSITORY = Symbol(
  "GROUP_INVITES_REPOSITORY",
);

export type GroupInvite = {
  id: string;
  groupId: string;
  createdAt: Date;
};

export type GroupInviteWithGroup = GroupInvite & {
  group: {
    id: string;
    name: string;
    weekday: string;
    hour: string;
    frequency: string;
    valuePerUser: number;
    owner: { name: string };
    _count: { groupMembers: number };
  };
};

export interface IGroupInvitesRepository {
  findByGroupId(groupId: string): Promise<GroupInvite | null>;

  findById(id: string): Promise<GroupInvite | null>;

  /**
   * The invite together with the group's display info, its owner's
   * name and its member count — everything the invite preview needs.
   */
  findByIdWithGroupDetails(
    id: string,
  ): Promise<GroupInviteWithGroup | null>;

  replaceForGroup(groupId: string): Promise<GroupInvite>;

  deleteByGroupId(groupId: string): Promise<{ count: number }>;
}
