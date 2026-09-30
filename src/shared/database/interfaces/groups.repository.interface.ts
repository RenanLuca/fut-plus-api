import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { UserRank } from "@src/shared/enum/userRank";
import { Weekday } from "@src/shared/enum/weekday";

export const GROUPS_REPOSITORY = Symbol("GROUPS_REPOSITORY");

export type Group = {
  id: string;
  name: string;
  ownerId: string;
  weekday: Weekday;
  hour: string;
  frequency: FrequencyType;
  valuePerUser: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGroupDTO = {
  name: string;
  ownerId: string;
  weekday: Weekday;
  hour: string;
  frequency: FrequencyType;
  valuePerUser: number;
};

export type UpdateGroupDTO = Partial<
  Omit<CreateGroupDTO, "ownerId">
>;

export type TransferGroupOwnershipDTO = {
  groupId: string;
  currentOwnerId: string;
  newOwnerId: string;
};

export interface IGroupsRepository {
  createWithOwner(
    data: CreateGroupDTO,
    ownerRank: UserRank,
  ): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findNameById(id: string): Promise<{ name: string } | null>;
  findAllByMember(userId: string): Promise<Group[]>;
  findAllByFrequency(frequency: FrequencyType): Promise<Group[]>;
  update(id: string, data: UpdateGroupDTO): Promise<Group>;
  delete(id: string): Promise<Group>;
  transferOwnership(
    params: TransferGroupOwnershipDTO,
  ): Promise<Group>;
}
