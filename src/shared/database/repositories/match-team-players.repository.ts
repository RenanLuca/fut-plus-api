import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  IMatchTeamPlayersRepository,
  MatchTeamPlayer,
  PlayerAssignment,
} from "../interfaces/match-team-players.repository.interface";

@Injectable()
export class MatchTeamsPlayersRepository implements IMatchTeamPlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByMatchAndPlayer(
    groupMatchId: string,
    {
      userId,
      guestUserId,
    }: { userId?: string; guestUserId?: string },
  ): Promise<MatchTeamPlayer | null> {
    return this.prisma.matchTeamPlayer.findFirst({
      where: {
        groupMatchId,
        ...(userId ? { userId } : { guestUserId }),
      },
    });
  }

  async addPlayers(
    players: PlayerAssignment[],
  ): Promise<MatchTeamPlayer[]> {
    await this.prisma.matchTeamPlayer.createMany({
      data: players,
    });
    return this.prisma.matchTeamPlayer.findMany({
      where: {
        OR: players.map((player) => ({
          matchTeamId: player.matchTeamId,
          userId: player.userId,
          guestUserId: player.guestUserId,
        })),
      },
    });
  }

  async replaceAllPlayersInTeams(
    teamIds: string[],
    players: PlayerAssignment[],
  ): Promise<MatchTeamPlayer[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.matchTeamPlayer.deleteMany({
        where: { matchTeamId: { in: teamIds } },
      });
      if (players.length === 0) {
        return [];
      }
      await tx.matchTeamPlayer.createMany({ data: players });
      return tx.matchTeamPlayer.findMany({
        where: { matchTeamId: { in: teamIds } },
      });
    });
  }
}
