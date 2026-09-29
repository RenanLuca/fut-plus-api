export const GROUP_MATCHES_REPOSITORY = Symbol(
  "GROUP_MATCHES_REPOSITORY",
);

export type GroupMatch = {
  id: string;
  groupId: string;
  matchDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UpcomingMatchForUser = GroupMatch & {
  group: { id: string; name: string; valuePerUser: number };
};

export interface IGroupMatchesRepository {
  create(data: {
    groupId: string;
    matchDate: Date;
  }): Promise<GroupMatch>;

  findById(id: string): Promise<GroupMatch | null>;

  findByIdAndGroupId(
    id: string,
    groupId: string,
  ): Promise<GroupMatch | null>;

  findByGroupIdAndDate(
    groupId: string,
    matchDate: Date,
  ): Promise<GroupMatch | null>;

  findAllByGroupId(groupId: string): Promise<GroupMatch[]>;

  /**
   * The next scheduled match (any group) that this user is a member of,
   * with the group's basic display info. Used for the "upcoming match"
   * card on the user's home screen.
   */
  findUpcomingByUserId(
    userId: string,
  ): Promise<UpcomingMatchForUser | null>;

  /**
   * Past matches in the group where the user was confirmed present but
   * has no `GroupPayment` yet — the dues still owed for daily members.
   */
  findUnpaidAttendedMatches(
    groupId: string,
    userId: string,
  ): Promise<GroupMatch[]>;

  delete(id: string): Promise<GroupMatch>;
}
