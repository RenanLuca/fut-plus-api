import { Injectable } from "@nestjs/common";
import {
  GroupMemberType,
  Group as PrismaGroup,
} from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import {
  CreateGroupData,
  Group,
  IGroupsRepository,
  UpdateGroupData,
} from "../interfaces/groups.repository.interface";
import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { UserRank } from "@src/shared/enum/userRank";
import { Weekday } from "@src/shared/enum/weekday";

@Injectable()
export class GroupsRepository implements IGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    data: CreateGroupData,
    ownerRank: UserRank,
  ): Promise<Group> {
    const group = await this.prisma.$transaction(async (tx) => {
      const created = await tx.group.create({ data });
      await tx.groupMember.create({
        data: {
          userId: data.ownerId,
          groupId: created.id,
          type: GroupMemberType.OWNER,
          rank: ownerRank,
        },
      });
      return created;
    });
    return this.toDomain(group);
  }

  async findById(id: string): Promise<Group | null> {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });
    return group ? this.toDomain(group) : null;
  }

  findNameById(id: string): Promise<{ name: string } | null> {
    return this.prisma.group.findUnique({
      where: { id },
      select: { name: true },
    });
  }

  async findAllByMember(userId: string): Promise<Group[]> {
    const groups = await this.prisma.group.findMany({
      where: { groupMembers: { some: { userId } } },
    });
    return groups.map((group) => this.toDomain(group));
  }

  async findAllByFrequency(
    frequency: FrequencyType,
  ): Promise<Group[]> {
    const groups = await this.prisma.group.findMany({
      where: { frequency },
    });
    return groups.map((group) => this.toDomain(group));
  }

  async update(
    id: string,
    data: UpdateGroupData,
  ): Promise<Group> {
    const group = await this.prisma.group.update({
      where: { id },
      data,
    });
    return this.toDomain(group);
  }

  async delete(id: string): Promise<Group> {
    const group = await this.prisma.group.delete({
      where: { id },
    });
    return this.toDomain(group);
  }

  async transferOwnership({
    groupId,
    currentOwnerId,
    newOwnerId,
  }: {
    groupId: string;
    currentOwnerId: string;
    newOwnerId: string;
  }): Promise<Group> {
    const group = await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: {
          groupId_userId: { groupId, userId: currentOwnerId },
        },
        data: { type: GroupMemberType.MONTHLY },
      });
      await tx.groupMember.update({
        where: {
          groupId_userId: { groupId, userId: newOwnerId },
        },
        data: { type: GroupMemberType.OWNER },
      });
      return tx.group.update({
        where: { id: groupId },
        data: { ownerId: newOwnerId },
      });
    });
    return this.toDomain(group);
  }

  private toDomain(group: PrismaGroup): Group {
    return {
      ...group,
      weekday: group.weekday as Weekday,
      frequency: group.frequency as FrequencyType,
    };
  }
}
