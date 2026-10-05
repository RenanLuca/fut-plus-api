export const MATCH_TEAM_PLAYERS_REPOSITORY = Symbol(
  "MATCH_TEAM_PLAYERS_REPOSITORY",
);

export type MatchTeamPlayer = {
  id: string;
  matchTeamId: string;
  groupMatchId: string;
  userId: string | null;
  guestUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlayerAssignment = {
  matchTeamId: string;
  groupMatchId: string;
  userId?: string;
  guestUserId?: string;
};

export type MatchPlayerIdentifierDTO = {
  userId?: string;
  guestUserId?: string;
};

export interface IMatchTeamPlayersRepository {
  /**
   * Finds the roster entry for this player in the match, whichever id
   * (`userId` XOR `guestUserId`) they have.
   */
  findByMatchAndPlayer(
    groupMatchId: string,
    player: MatchPlayerIdentifierDTO,
  ): Promise<MatchTeamPlayer | null>;

  addPlayers(
    players: PlayerAssignment[],
  ): Promise<MatchTeamPlayer[]>;

  /**
   * Clears the roster of every team in `teamIds` and inserts `players`
   * in their place, in a single transaction.
   */
  replaceAllPlayersInTeams(
    teamIds: string[],
    players: PlayerAssignment[],
  ): Promise<MatchTeamPlayer[]>;
}
