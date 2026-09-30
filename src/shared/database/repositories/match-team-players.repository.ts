import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  IMatchTeamPlayersRepository,
  MatchTeamPlayer,
  PlayerAssignment,
} from "../interfaces/match-team-players.repository.interface";

@Injectable()
export class MatchTeamPlayersRepository implements IMatchTeamPlayersRepository {
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
    // Individual creates inside a transaction (rather than createMany +
    // a refetch) so each created row is returned directly — createMany
    // doesn't return rows, and re-matching by {matchTeamId, userId,
    // guestUserId} could pick up an unrelated pre-existing row sharing
    // the same combination.
    return this.prisma.$transaction(async (tx) => {
      const created: MatchTeamPlayer[] = [];
      for (const player of players) {
        created.push(
          await tx.matchTeamPlayer.create({ data: player }),
        );
      }
      return created;
    });
  }

  async replaceAllPlayersInTeams(
    teamIds: string[],
    players: PlayerAssignment[],
  ): Promise<MatchTeamPlayer[]> {
    // Unlike addPlayers, re-matching by teamIds here is safe: teamIds was
    // just wiped by deleteMany above, so any row now found under those
    // teams is guaranteed to be one just created, not a pre-existing one.
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
