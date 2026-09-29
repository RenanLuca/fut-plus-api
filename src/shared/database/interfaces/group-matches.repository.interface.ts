export const GROUP_MATCHES_REPOSITORY = Symbol("GROUP_MATCHES_REPOSITORY");

export type GroupMatch = {
  id: string;
  groupId: string;
  matchDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface IGroupMatchesRepository {
  create(data: {
    groupId: string;
    matchDate: Date;
  }): Promise<GroupMatch>;

  findById(id: string): Promise<GroupMatch | null>;
  findByGroupIdAndDate(groupId: string, matchDate: Date): Promise<GroupMatch | null>;
  findAllByGroupId(groupId: string): Promise<GroupMatch[]>;
  update(id: string, data: Partial<{ matchDate: Date }>): Promise<GroupMatch>;
  delete(id: string): Promise<GroupMatch>;
}
