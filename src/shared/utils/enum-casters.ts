import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

/**
 * Prisma's generated enums and this project's domain enums (in
 * src/shared/enum/) share the same string values but are distinct
 * nominal types, so a repository's `toDomain` step needs an explicit
 * cast at the Prisma boundary. These helpers centralize that cast so a
 * future change to how it's done (e.g. adding a runtime check) touches
 * one place instead of every repository that maps a position or rank.
 */

export function toPositionEnum(position: string): PositionEnum {
  return position as PositionEnum;
}

export function toUserRank(rank: string): UserRank;
export function toUserRank(rank: string | null): UserRank | null;
export function toUserRank(
  rank: string | null,
): UserRank | null {
  return rank as UserRank | null;
}
