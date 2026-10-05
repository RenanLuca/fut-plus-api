import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

export const GUEST_USERS_REPOSITORY = Symbol(
  "GUEST_USERS_REPOSITORY",
);

export type GuestUser = {
  id: string;
  name: string;
  position: PositionEnum;
  rank: UserRank;
  groupMatchId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConfirmedGuest = {
  id: string;
  rank: UserRank;
  position: PositionEnum;
};

export type CreateGuestUserDTO = {
  name: string;
  position: PositionEnum;
  rank: UserRank;
  groupMatchId: string;
};

export interface IGuestUsersRepository {
  create(data: CreateGuestUserDTO): Promise<GuestUser>;

  findByIdAndGroupMatchId(
    id: string,
    groupMatchId: string,
  ): Promise<GuestUser | null>;

  findAllByGroupMatchId(
    groupMatchId: string,
  ): Promise<GuestUser[]>;

  /**
   * Guests confirmed present (`isPresent: true`) for the match, with just
   * the fields the team balancer needs. Registered members are a
   * separate model (IGroupMembersRepository.findConfirmedMembersByGroupMatchId)
   * — a caller that needs everyone confirmed for a match must call both.
   */
  findConfirmedGuestsByGroupMatchId(
    groupMatchId: string,
  ): Promise<ConfirmedGuest[]>;

  delete(id: string): Promise<GuestUser>;
}
