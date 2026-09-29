import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IMatchTeamPlayersRepository } from "../interfaces/match-team-players.repository.interface";
import type { MatchTeamPlayer } from "../interfaces/match-team-players.repository.interface";

@Injectable()
export class MatchTeamsPlayersRepository implements IMatchTeamPlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { matchTeamId: string; groupMatchId: string; userId?: string; guestUserId?: string }): Promise<MatchTeamPlayer> {
    return this.prisma.matchTeamPlayer.create({ data }) as Promise<MatchTeamPlayer>;
  }
  async findById(id: string): Promise<MatchTeamPlayer | null> {
    return this.prisma.matchTeamPlayer.findUnique({ where: { id } }) as Promise<MatchTeamPlayer | null>;
  }
  async findAllByMatchTeamId(matchTeamId: string): Promise<MatchTeamPlayer[]> {
    return this.prisma.matchTeamPlayer.findMany({ where: { matchTeamId } }) as Promise<MatchTeamPlayer[]>;
  }
  async delete(id: string): Promise<MatchTeamPlayer> {
    return this.prisma.matchTeamPlayer.delete({ where: { id } }) as Promise<MatchTeamPlayer>;
  }
  async replaceAllPlayers(matchTeamId: string, playerIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.matchTeamPlayer.deleteMany({ where: { matchTeamId } });
      return Promise.all(playerIds.map((userId) => tx.matchTeamPlayer.create({ data: { matchTeamId, groupMatchId: "", userId } })));
    });
  }
  async findUnique<T extends Prisma.MatchTeamPlayerFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.MatchTeamPlayerFindUniqueArgs>) {
    return this.prisma.matchTeamPlayer.findUnique(args);
  }
  async findMany<T extends Prisma.MatchTeamPlayerFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.MatchTeamPlayerFindManyArgs>) {
    return this.prisma.matchTeamPlayer.findMany(args);
  }
}
