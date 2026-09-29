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

export type CreateGroupData = {
  name: string;
  ownerId: string;
  weekday: Weekday;
  hour: string;
  frequency: FrequencyType;
  valuePerUser: number;
};

export type UpdateGroupData = Partial<
  Omit<CreateGroupData, "ownerId">
>;

export interface IGroupsRepository {
  createWithOwner(
    data: CreateGroupData,
    ownerRank: UserRank,
  ): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findNameById(id: string): Promise<{ name: string } | null>;
  findAllByMember(userId: string): Promise<Group[]>;
  findAllByFrequency(frequency: FrequencyType): Promise<Group[]>;
  update(id: string, data: UpdateGroupData): Promise<Group>;
  delete(id: string): Promise<Group>;
  transferOwnership(params: {
    groupId: string;
    currentOwnerId: string;
    newOwnerId: string;
  }): Promise<Group>;
}
