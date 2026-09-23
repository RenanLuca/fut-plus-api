import { Injectable } from "@nestjs/common";
import {
  GroupMemberType,
  Prisma,
  Rank,
} from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(createGroupDto: Prisma.GroupCreateArgs) {
    return this.prisma.group.create(createGroupDto);
  }
  async createWithOwner(
    createGroupDto: Prisma.GroupUncheckedCreateInput,
    ownerId: string,
    rank: Rank,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: createGroupDto,
      });
      await tx.groupMember.create({
        data: {
          userId: ownerId,
          groupId: group.id,
          type: GroupMemberType.OWNER,
          rank,
        },
      });
      return group;
    });
  }
  async transferOwnership({
    groupId,
    currentOwnerId,
    newOwnerId,
  }: {
    groupId: string;
    currentOwnerId: string;
    newOwnerId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
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
  }
  async findUnique(
    findUniqueGroupDto: Prisma.GroupFindUniqueArgs,
  ) {
    return this.prisma.group.findUnique(findUniqueGroupDto);
  }
  async findFirst(findFirstGroupDto: Prisma.GroupFindFirstArgs) {
    return this.prisma.group.findFirst(findFirstGroupDto);
  }
  async findMany(findManyGroupDto: Prisma.GroupFindManyArgs) {
    return this.prisma.group.findMany(findManyGroupDto);
  }

  async update(updateGroupDto: Prisma.GroupUpdateArgs) {
    return this.prisma.group.update(updateGroupDto);
  }

  async delete(deleteGroupDto: Prisma.GroupDeleteArgs) {
    return this.prisma.group.delete(deleteGroupDto);
  }
}
