import { Rank } from "../../../../generated/prisma/client";
import { rankWeight } from "@src/shared/utils/rank-weight";

export type ConfirmedMemberForBalancing = {
  userId: string | null;
  guestUserId: string | null;
  rank: Rank | null;
};

export type TeamPlayerAssignment = {
  userId?: string;
  guestUserId?: string;
};

/**
 * Distributes players into `teamCount` teams, sorted by rank (best
 * first) and snake-drafted (1,2,3 | 3,2,1 | 1,2,3 | ...) so team sizes
 * stay equal and no team stacks the best-ranked players. Position is
 * not a grouping criterion here — equal team size takes priority over
 * an even spread of positions across teams.
 */
export function balanceMembersIntoTeams(
  members: ConfirmedMemberForBalancing[],
  teamCount: number,
): TeamPlayerAssignment[][] {
  const teams: TeamPlayerAssignment[][] = Array.from(
    { length: teamCount },
    () => [],
  );

  const sortedMembers = [...members].sort(
    (a, b) => rankWeight(b.rank) - rankWeight(a.rank),
  );

  let index = 0;
  let round = 0;
  while (index < sortedMembers.length) {
    const teamOrder = Array.from(
      { length: teamCount },
      (_, i) => i,
    );
    if (round % 2 === 1) {
      teamOrder.reverse();
    }
    for (const teamIndex of teamOrder) {
      if (index >= sortedMembers.length) break;
      const member = sortedMembers[index];
      teams[teamIndex].push({
        userId: member.userId ?? undefined,
        guestUserId: member.guestUserId ?? undefined,
      });
      index++;
    }
    round++;
  }

  return teams;
}

/**
 * Distributes goalkeepers round-robin across `teamCount` teams.
 * Goalkeepers don't count toward playersPerTeam and aren't balanced by
 * rank — some teams may end up with no goalkeeper, others with more
 * than one.
 */
export function distributeGoalkeepers(
  goalkeepers: ConfirmedMemberForBalancing[],
  teamCount: number,
): TeamPlayerAssignment[][] {
  const teams: TeamPlayerAssignment[][] = Array.from(
    { length: teamCount },
    () => [],
  );

  goalkeepers.forEach((goalkeeper, index) => {
    teams[index % teamCount].push({
      userId: goalkeeper.userId ?? undefined,
      guestUserId: goalkeeper.guestUserId ?? undefined,
    });
  });

  return teams;
}
