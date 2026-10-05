import { describe, it, expect } from "vitest";
import { rankWeight } from "@src/shared/utils/rank-weight";
import { UserRank } from "@src/shared/enum/userRank";

describe("rankWeight", () => {
  it("should weigh ranks in ascending order", () => {
    expect(rankWeight(UserRank.BRASILEIRAO)).toBeLessThan(
      rankWeight(UserRank.CHAMPIONS_LEAGUE),
    );
    expect(rankWeight(UserRank.CHAMPIONS_LEAGUE)).toBeLessThan(
      rankWeight(UserRank.BALLON_DOR),
    );
  });

  it("should weigh a missing rank as zero", () => {
    expect(rankWeight(null)).toBe(0);
  });
});
