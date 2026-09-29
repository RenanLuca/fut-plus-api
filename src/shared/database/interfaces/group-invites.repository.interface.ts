export const GROUP_INVITES_REPOSITORY = Symbol(
  "GROUP_INVITES_REPOSITORY",
);

export type GroupInvite = {
  id: string;
  groupId: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
};

export interface IGroupInvitesRepository {
  findByGroupId(
    groupId: string,
  ): Promise<GroupInvite | null>;

  findById(
    id: string,
    options?: {
      includeGroupWithDetails?: boolean;
    },
  ): Promise<
    | (GroupInvite & {
        group?: {
          id: string;
          name: string;
          weekday: string;
          hour: string;
          frequency: string;
          valuePerUser: number;
          owner: { name: string };
          _count: { groupMembers: number };
        };
      })
    | null
  >;

  replaceForGroup(groupId: string): Promise<GroupInvite>;

  deleteByGroupId(groupId: string): Promise<{ count: number }>;
}
