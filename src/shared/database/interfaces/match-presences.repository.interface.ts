export const MATCH_PRESENCES_REPOSITORY = Symbol("MATCH_PRESENCES_REPOSITORY");

export type GroupMatchPresence = {
  id: string;
  groupMatchId: string;
  isPresent: boolean;
  userId: string | null;
  guestUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IMatchPresencesRepository {
  create(data: {
    groupMatchId: string;
    isPresent: boolean;
    userId?: string;
    guestUserId?: string;
  }): Promise<GroupMatchPresence>;

  findById(id: string): Promise<GroupMatchPresence | null>;
  findAllByGroupMatchId(groupMatchId: string): Promise<GroupMatchPresence[]>;
  update(id: string, data: Partial<{ isPresent: boolean }>): Promise<GroupMatchPresence>;
  delete(id: string): Promise<GroupMatchPresence>;
}
