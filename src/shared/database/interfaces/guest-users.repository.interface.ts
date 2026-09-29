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

export interface IGuestUsersRepository {
  create(data: {
    name: string;
    position: PositionEnum;
    rank: UserRank;
    groupMatchId: string;
  }): Promise<GuestUser>;

  findByIdAndGroupMatchId(
    id: string,
    groupMatchId: string,
  ): Promise<GuestUser | null>;

  findAllByGroupMatchId(
    groupMatchId: string,
  ): Promise<GuestUser[]>;

  /**
   * Guests confirmed present (`isPresent: true`) for the match, with just
   * the fields the team balancer needs.
   */
  findConfirmedByGroupMatchId(
    groupMatchId: string,
  ): Promise<ConfirmedGuest[]>;

  delete(id: string): Promise<GuestUser>;
}
