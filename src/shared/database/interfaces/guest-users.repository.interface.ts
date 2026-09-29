import { Position } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

export const GUEST_USERS_REPOSITORY = Symbol("GUEST_USERS_REPOSITORY");

export type GuestUser = {
  id: string;
  name: string;
  position: Position;
  rank: UserRank;
  groupMatchId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IGuestUsersRepository {
  create(data: {
    name: string;
    position: Position;
    rank: UserRank;
    groupMatchId: string;
  }): Promise<GuestUser>;

  findById(id: string): Promise<GuestUser | null>;
  findAllByGroupMatchId(groupMatchId: string): Promise<GuestUser[]>;
  delete(id: string): Promise<GuestUser>;
}
