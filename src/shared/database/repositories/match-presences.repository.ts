import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  IMatchPresencesRepository,
  PresenceSummary,
} from "../interfaces/match-presences.repository.interface";

@Injectable()
export class MatchPresencesRepository implements IMatchPresencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByGroupMatchId(
    groupMatchId: string,
  ): Promise<PresenceSummary[]> {
    return this.prisma.groupMatchPresence.findMany({
      where: { groupMatchId },
      select: {
        userId: true,
        guestUserId: true,
        isPresent: true,
      },
    });
  }

  async setUserPresence(
    groupMatchId: string,
    userId: string,
    isPresent: boolean,
  ): Promise<void> {
    await this.prisma.groupMatchPresence.upsert({
      where: { groupMatchId_userId: { groupMatchId, userId } },
      create: { groupMatchId, userId, isPresent },
      update: { isPresent },
    });
  }

  async findByMatchAndUserWithMatchDate(
    groupMatchId: string,
    userId: string,
  ): Promise<{ isPresent: boolean; matchDate: Date } | null> {
    const presence =
      await this.prisma.groupMatchPresence.findUnique({
        where: { groupMatchId_userId: { groupMatchId, userId } },
        select: {
          isPresent: true,
          groupMatch: { select: { matchDate: true } },
        },
      });
    if (!presence) {
      return null;
    }
    return {
      isPresent: presence.isPresent,
      matchDate: presence.groupMatch.matchDate,
    };
  }
}
