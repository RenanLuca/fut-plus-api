import { GuestUser } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { CreateMatchGuestDto } from "@src/modules/match-guests/dto/create-match-guest.dto";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { randomUUID } from "crypto";

export function makeGuestUserMock(
  overrides?: Partial<GuestUser>,
): GuestUser {
  return {
    id: randomUUID(),
    name: "Guest Name",
    position: PositionEnum.DEFENDER,
    rank: UserRank.BRASILEIRAO,
    groupMatchId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeCreateMatchGuestInputMock(
  overrides?: Partial<CreateMatchGuestDto>,
): CreateMatchGuestDto {
  return {
    name: "Guest Name",
    position: PositionEnum.DEFENDER,
    rank: UserRank.BRASILEIRAO,
    ...overrides,
  };
}
