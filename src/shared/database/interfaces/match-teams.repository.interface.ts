export const MATCH_TEAMS_REPOSITORY = Symbol("MATCH_TEAMS_REPOSITORY");

export type MatchTeam = {
  id: string;
  groupMatchId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IMatchTeamsRepository {
  create(data: {
    groupMatchId: string;
    name: string;
    color: string;
  }): Promise<MatchTeam>;

  findById(id: string): Promise<MatchTeam | null>;
  findAllByGroupMatchId(groupMatchId: string): Promise<MatchTeam[]>;
  update(id: string, data: Partial<{ name: string; color: string }>): Promise<MatchTeam>;
  delete(id: string): Promise<MatchTeam>;
}
