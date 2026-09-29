export const MATCH_TEAM_PLAYERS_REPOSITORY = Symbol("MATCH_TEAM_PLAYERS_REPOSITORY");

export type MatchTeamPlayer = {
  id: string;
  matchTeamId: string;
  groupMatchId: string;
  userId: string | null;
  guestUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IMatchTeamPlayersRepository {
  create(data: {
    matchTeamId: string;
    groupMatchId: string;
    userId?: string;
    guestUserId?: string;
  }): Promise<MatchTeamPlayer>;

  findById(id: string): Promise<MatchTeamPlayer | null>;
  findAllByMatchTeamId(matchTeamId: string): Promise<MatchTeamPlayer[]>;
  delete(id: string): Promise<MatchTeamPlayer>;
}
