import { UserRank } from "@src/shared/enum/userRank";

export const RANK_WEIGHT: Record<UserRank, number> = {
  BRASILEIRAO: 1,
  CHAMPIONS_LEAGUE: 2,
  BALLON_DOR: 3,
};

export function rankWeight(rank: UserRank | null): number {
  return rank ? RANK_WEIGHT[rank] : 0;
}
