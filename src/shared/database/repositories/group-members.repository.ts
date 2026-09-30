import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  ConfirmedMember,
  CreateGroupMemberDTO,
  GroupMember,
  GroupMemberWithUser,
  IGroupMembersRepository,
  MemberWithNotificationEmail,
} from "../interfaces/group-members.repository.interface";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import {
  toPositionEnum,
  toUserRank,
} from "@src/shared/utils/enum-casters";
import type { GroupMember as PrismaGroupMember } from "../../../../generated/prisma/client";

@Injectable()
export class GroupMembersRepository implements IGroupMembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateGroupMemberDTO,
  ): Promise<GroupMember> {
    const member = await this.prisma.groupMember.create({
      data,
    });
    return this.toDomain(member);
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

  async findAllByGroupIdWithUser(
    groupId: string,
  ): Promise<GroupMemberWithUser[]> {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            profilePicture: true,
          },
        },
      },
    });
    return members.map((member) => ({
      ...this.toDomain(member),
      user: {
        ...member.user,
        position: toPositionEnum(member.user.position),
      },
    }));
  }

  async findAllByGroupIdWithNotificationFilters(
    groupId: string,
  ): Promise<MemberWithNotificationEmail[]> {
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
    return members.map((member) => ({
      ...this.toDomain(member),
      user: member.user,
    }));
  }

  async findConfirmedMembersByGroupMatchId(
    groupId: string,
    groupMatchId: string,
  ): Promise<ConfirmedMember[]> {
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        user: {
          groupMatchPresences: {
            some: { groupMatchId, isPresent: true },
          },
        },
      },
      select: {
        userId: true,
        rank: true,
        user: { select: { position: true } },
      },
    });
    return members.map((member) => ({
      userId: member.userId,
      rank: toUserRank(member.rank),
      position: toPositionEnum(member.user.position),
    }));
  }

  async removeByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  private toDomain(member: PrismaGroupMember): GroupMember {
    return {
      ...member,
      type: member.type as GroupMemberType,
      rank: toUserRank(member.rank),
    };
  }
}
