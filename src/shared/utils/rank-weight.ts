import { Rank } from "../../../generated/prisma/client";

export const RANK_WEIGHT: Record<Rank, number> = {
  BRASILEIRAO: 1,
  CHAMPIONS_LEAGUE: 2,
  BALLON_DOR: 3,
};

export function rankWeight(rank: Rank | null): number {
  return rank ? RANK_WEIGHT[rank] : 0;
}
