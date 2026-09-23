import {
  Position,
  Rank,
} from "../../../../generated/prisma/client";
import { rankWeight } from "@src/shared/utils/rank-weight";

export type ConfirmedMemberForBalancing = {
  userId: string | null;
  guestUserId: string | null;
  rank: Rank | null;
  position: Position;
};

export type TeamPlayerAssignment = {
  userId?: string;
  guestUserId?: string;
};

type TeamDraft = {
  players: TeamPlayerAssignment[];
  rankWeightSum: number;
};

function byRankDesc(
  a: ConfirmedMemberForBalancing,
  b: ConfirmedMemberForBalancing,
) {
  return rankWeight(b.rank) - rankWeight(a.rank);
}

function addToTeam(
  team: TeamDraft,
  member: ConfirmedMemberForBalancing,
) {
  team.players.push({
    userId: member.userId ?? undefined,
    guestUserId: member.guestUserId ?? undefined,
  });
  team.rankWeightSum += rankWeight(member.rank);
}

/**
 * Distributes every confirmed player (goalkeepers included) into
 * `teamCount` teams.
 *
 * 1. Goalkeepers first: the best-ranked ones get one team each. If there
 *    are fewer goalkeepers than teams, some teams have none; goalkeepers
 *    beyond `teamCount` are treated as regular players.
 * 2. Everyone else, best rank first, goes to the team with the fewest
 *    players; ties go to the team with the lowest total rank so far
 *    (then the lowest index). Team sizes end up differing by at most one,
 *    and no team stacks the best players.
 *
 * Position is not a grouping criterion beyond the goalkeeper rule: equal
 * team size takes priority over an even spread of field positions.
 */
export function balanceMembersIntoTeams(
  members: ConfirmedMemberForBalancing[],
  teamCount: number,
): TeamPlayerAssignment[][] {
  const teams: TeamDraft[] = Array.from(
    { length: teamCount },
    () => ({ players: [], rankWeightSum: 0 }),
  );

  const sortedMembers = [...members].sort(byRankDesc);
  const goalkeepers = sortedMembers.filter(
    (member) => member.position === Position.GOALKEEPER,
  );
  const outfieldPlayers = sortedMembers.filter(
    (member) => member.position !== Position.GOALKEEPER,
  );

  goalkeepers
    .slice(0, teamCount)
    .forEach((goalkeeper, index) => {
      addToTeam(teams[index], goalkeeper);
    });

  const remainingMembers = [
    ...outfieldPlayers,
    ...goalkeepers.slice(teamCount),
  ].sort(byRankDesc);

  for (const member of remainingMembers) {
    const target = teams.reduce((best, team) => {
      if (team.players.length !== best.players.length) {
        return team.players.length < best.players.length
          ? team
          : best;
      }
      return team.rankWeightSum < best.rankWeightSum
        ? team
        : best;
    });
    addToTeam(target, member);
  }

  return teams.map((team) => team.players);
}
