import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

export const MATCH_TEAMS_REPOSITORY = Symbol(
  "MATCH_TEAMS_REPOSITORY",
);

export type MatchTeam = {
  id: string;
  groupMatchId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchTeamPlayerWithDetails = {
  user: {
    id: string;
    name: string;
    position: PositionEnum;
    profilePicture: string | null;
    groupMembers: { rank: UserRank | null }[];
  } | null;
  guestUser: {
    id: string;
    name: string;
    rank: UserRank;
    position: PositionEnum;
  } | null;
};

export type MatchTeamWithPlayers = MatchTeam & {
  matchTeamPlayers: MatchTeamPlayerWithDetails[];
};

export type TeamToCreate = {
  name: string;
  color: string;
  players: { userId?: string; guestUserId?: string }[];
};

export interface IMatchTeamsRepository {
  create(data: {
    groupMatchId: string;
    name: string;
    color: string;
  }): Promise<MatchTeam>;

  findByIdAndGroupMatchId(
    id: string,
    groupMatchId: string,
  ): Promise<MatchTeam | null>;

  /**
   * Every team of the match, with each player's user or guest info
   * (including the player's rank within this group) for display.
   */
  findAllByGroupMatchIdWithPlayers(
    groupMatchId: string,
    groupId: string,
  ): Promise<MatchTeamWithPlayers[]>;

  findByIdWithPlayers(
    id: string,
    groupMatchId: string,
    groupId: string,
  ): Promise<MatchTeamWithPlayers | null>;

  update(
    id: string,
    data: Partial<{ name: string; color: string }>,
  ): Promise<MatchTeam>;

  /**
   * Replaces every team of the match with a freshly balanced set, in a
   * single transaction (used by the auto-balancer).
   */
  regenerateTeams(
    groupMatchId: string,
    teams: TeamToCreate[],
  ): Promise<MatchTeam[]>;
}
