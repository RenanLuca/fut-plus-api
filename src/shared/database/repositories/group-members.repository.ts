import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  ConfirmedMember,
  GroupMember,
  GroupMemberWithUser,
  IGroupMembersRepository,
  MemberWithNotificationEmail,
} from "../interfaces/group-members.repository.interface";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import type { GroupMember as PrismaGroupMember } from "../../../../generated/prisma/client";

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
        position: member.user.position as PositionEnum,
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

  async findConfirmedByGroupMatchId(
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
      rank: member.rank as UserRank | null,
      position: member.user.position as PositionEnum,
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
      rank: member.rank as UserRank | null,
    };
  }
}
