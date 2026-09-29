import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import {
  GroupMember,
  IGroupMembersRepository,
} from "../interfaces/group-members.repository.interface";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { UserRank } from "@src/shared/enum/userRank";

@Injectable()
export class GroupMembersRepository implements IGroupMembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    groupId: string;
    userId: string;
    type: GroupMemberType;
    rank?: UserRank;
  }): Promise<GroupMember> {
    const member = await this.prisma.groupMember.create({
      data,
    });
    return this.toDomain(member);
  }

  async findById(id: string): Promise<GroupMember | null> {
    const member = await this.prisma.groupMember.findUnique({
      where: { id },
    });
    return member ? this.toDomain(member) : null;
  }

  async findByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null> {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    return member ? this.toDomain(member) : null;
  }

  async findAllByGroupId(
    groupId: string,
    options?: {
      includeUser?: boolean;
    },
  ): Promise<(GroupMember & {
    user?: { name: string; email: string; emailNotifications: boolean; emailVerifiedAt: Date | null } | null;
  })[]> {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: options?.includeUser
          ? { select: { name: true, email: true, emailNotifications: true, emailVerifiedAt: true } }
          : false,
      },
    });
    return members.map((m) => ({
      ...this.toDomain(m),
      user: m.user || undefined,
    })) as any;
  }

  async findAllByGroupIdWithNotificationFilters(
    groupId: string,
  ): Promise<(GroupMember & {
    user?: { name: string; email: string } | null;
  })[]> {
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        user: {
          emailNotifications: true,
          emailVerifiedAt: { not: null },
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
    return members.map((m) => ({
      ...this.toDomain(m),
      user: m.user || undefined,
    })) as any;
  }

  async delete(id: string): Promise<GroupMember> {
    const member = await this.prisma.groupMember.delete({
      where: { id },
    });
    return this.toDomain(member);
  }

  // Métodos legados para compatibilidade com serviços não migrados
  async findUnique(
    findUniqueGroupMemberDto: Prisma.GroupMemberFindUniqueArgs,
  ) {
    return this.prisma.groupMember.findUnique(
      findUniqueGroupMemberDto,
    );
  }

  async findFirst(
    findFirstGroupMemberDto: Prisma.GroupMemberFindFirstArgs,
  ) {
    return this.prisma.groupMember.findFirst(
      findFirstGroupMemberDto,
    );
  }

  async findMany<T extends Prisma.GroupMemberFindManyArgs>(
    findManyGroupMemberDto: Prisma.SelectSubset<
      T,
      Prisma.GroupMemberFindManyArgs
    >,
  ) {
    return this.prisma.groupMember.findMany(findManyGroupMemberDto);
  }

  async deleteLegacy(
    deleteGroupMemberDto: Prisma.GroupMemberDeleteArgs,
  ) {
    return this.prisma.groupMember.delete(deleteGroupMemberDto);
  }

  private toDomain(member: any): GroupMember {
    return {
      ...member,
      type: member.type as GroupMemberType,
      rank: member.rank as UserRank | null,
    };
  }
}
