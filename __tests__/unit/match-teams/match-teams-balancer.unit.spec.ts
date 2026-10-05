import { describe, it, expect } from "vitest";
import { balanceMembersIntoTeams } from "@src/modules/match-teams/utils/match-teams-balancer";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { makeConfirmedMemberForBalancingMock } from "../../utils/match-teams";

function flatIds(teams: { userId?: string; guestUserId?: string }[][]) {
  return teams.flat().map((p) => p.userId ?? p.guestUserId);
}

describe("balanceMembersIntoTeams", () => {
  it("should return exactly teamCount teams and place every member once", () => {
    const members = [1, 2, 3, 4, 5].map((i) =>
      makeConfirmedMemberForBalancingMock({ userId: `user-${i}` }),
    );

    const teams = balanceMembersIntoTeams(members, 2);

    expect(teams).toHaveLength(2);
    expect(flatIds(teams).sort()).toEqual(
      members.map((m) => m.userId).sort(),
    );
  });

  it("should keep team sizes within one player of each other", () => {
    const members = [1, 2, 3, 4, 5].map((i) =>
      makeConfirmedMemberForBalancingMock({ userId: `user-${i}` }),
    );

    const teams = balanceMembersIntoTeams(members, 2);
    const sizes = teams.map((t) => t.length);

    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(
      1,
    );
  });

  it("should not stack the best-ranked players on the same team", () => {
    const best1 = makeConfirmedMemberForBalancingMock({
      userId: "best-1",
      rank: UserRank.BALLON_DOR,
    });
    const best2 = makeConfirmedMemberForBalancingMock({
      userId: "best-2",
      rank: UserRank.BALLON_DOR,
    });
    const weak1 = makeConfirmedMemberForBalancingMock({
      userId: "weak-1",
      rank: UserRank.BRASILEIRAO,
    });
    const weak2 = makeConfirmedMemberForBalancingMock({
      userId: "weak-2",
      rank: UserRank.BRASILEIRAO,
    });

    const teams = balanceMembersIntoTeams(
      [best1, best2, weak1, weak2],
      2,
    );

    const bestPerTeam = teams.map(
      (team) =>
        team.filter((p) => p.userId?.startsWith("best")).length,
    );
    expect(bestPerTeam).toEqual([1, 1]);
  });

  it("should give each team at most one goalkeeper, best-ranked first", () => {
    const gkBest = makeConfirmedMemberForBalancingMock({
      userId: "gk-best",
      position: PositionEnum.GOALKEEPER,
      rank: UserRank.BALLON_DOR,
    });
    const gkWeak = makeConfirmedMemberForBalancingMock({
      userId: "gk-weak",
      position: PositionEnum.GOALKEEPER,
      rank: UserRank.BRASILEIRAO,
    });
    const outfield = [1, 2].map((i) =>
      makeConfirmedMemberForBalancingMock({ userId: `field-${i}` }),
    );

    const teams = balanceMembersIntoTeams(
      [gkWeak, gkBest, ...outfield],
      2,
    );

    const goalkeepersPerTeam = teams.map(
      (team) =>
        team.filter((p) => p.userId?.startsWith("gk")).length,
    );
    expect(goalkeepersPerTeam).toEqual([1, 1]);
    expect(teams[0][0].userId).toBe("gk-best");
    expect(teams[1][0].userId).toBe("gk-weak");
  });

  it("should leave some teams without a goalkeeper when there are fewer goalkeepers than teams", () => {
    const gk = makeConfirmedMemberForBalancingMock({
      userId: "gk",
      position: PositionEnum.GOALKEEPER,
    });
    const outfield = [1, 2, 3].map((i) =>
      makeConfirmedMemberForBalancingMock({ userId: `field-${i}` }),
    );

    const teams = balanceMembersIntoTeams([gk, ...outfield], 2);

    const goalkeepersPerTeam = teams.map(
      (team) => team.filter((p) => p.userId === "gk").length,
    );
    expect(goalkeepersPerTeam.sort()).toEqual([0, 1]);
  });

  it("should treat goalkeepers beyond the team count as outfield players", () => {
    const goalkeepers = [1, 2, 3].map((i) =>
      makeConfirmedMemberForBalancingMock({
        userId: `gk-${i}`,
        position: PositionEnum.GOALKEEPER,
      }),
    );

    const teams = balanceMembersIntoTeams(goalkeepers, 2);

    const sizes = teams.map((t) => t.length).sort();
    expect(sizes).toEqual([1, 2]);
  });

  it("should break size ties by the lowest total rank so far", () => {
    const strong = makeConfirmedMemberForBalancingMock({
      userId: "strong",
      rank: UserRank.BALLON_DOR,
    });
    const medium = makeConfirmedMemberForBalancingMock({
      userId: "medium",
      rank: UserRank.CHAMPIONS_LEAGUE,
    });
    const weak = makeConfirmedMemberForBalancingMock({
      userId: "weak",
      rank: UserRank.BRASILEIRAO,
    });

    const teams = balanceMembersIntoTeams([strong, medium, weak], 2);

    const teamOf = (id: string) =>
      teams.find((t) => t.some((p) => p.userId === id));
    expect(teamOf("weak")).toBe(teamOf("medium"));
    expect(teamOf("weak")).not.toBe(teamOf("strong"));
  });

  it("should map a guest into its player entry without a userId", () => {
    const guest = makeConfirmedMemberForBalancingMock({
      userId: null,
      guestUserId: "guest-id",
    });

    const teams = balanceMembersIntoTeams([guest], 1);

    expect(teams).toEqual([
      [{ userId: undefined, guestUserId: "guest-id" }],
    ]);
  });
});
