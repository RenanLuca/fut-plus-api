import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  GroupMatch,
  IGroupMatchesRepository,
  UpcomingMatchForUser,
} from "../interfaces/group-matches.repository.interface";

@Injectable()
export class GroupMatchesRepository implements IGroupMatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    groupId: string;
    matchDate: Date;
  }): Promise<GroupMatch> {
    return this.prisma.groupMatch.create({ data });
  }

  async findById(id: string): Promise<GroupMatch | null> {
    return this.prisma.groupMatch.findUnique({ where: { id } });
  }

  async findByIdAndGroupId(
    id: string,
    groupId: string,
  ): Promise<GroupMatch | null> {
    return this.prisma.groupMatch.findFirst({
      where: { id, groupId },
    });
  }

  async findByGroupIdAndDate(
    groupId: string,
    matchDate: Date,
  ): Promise<GroupMatch | null> {
    return this.prisma.groupMatch.findUnique({
      where: { groupId_matchDate: { groupId, matchDate } },
    });
  }

  async findAllByGroupId(
    groupId: string,
  ): Promise<GroupMatch[]> {
    return this.prisma.groupMatch.findMany({
      where: { groupId },
    });
  }

  async findUpcomingByUserId(
    userId: string,
  ): Promise<UpcomingMatchForUser | null> {
    return this.prisma.groupMatch.findFirst({
      where: {
        matchDate: { gte: new Date() },
        group: { groupMembers: { some: { userId } } },
      },
      orderBy: { matchDate: "asc" },
      include: {
        group: {
          select: { id: true, name: true, valuePerUser: true },
        },
      },
    });
  }

  async findUnpaidAttendedMatches(
    groupId: string,
    userId: string,
  ): Promise<GroupMatch[]> {
    return this.prisma.groupMatch.findMany({
      where: {
        groupId,
        matchDate: { lt: new Date() },
        groupMatchPresences: {
          some: { userId, isPresent: true },
        },
        groupPayments: { none: { userId } },
      },
      orderBy: { matchDate: "desc" },
    });
  }

  async delete(id: string): Promise<GroupMatch> {
    return this.prisma.groupMatch.delete({ where: { id } });
  }
}
