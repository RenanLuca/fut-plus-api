import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IMatchTeamsRepository } from "../interfaces/match-teams.repository.interface";
import type { MatchTeam } from "../interfaces/match-teams.repository.interface";

@Injectable()
export class MatchTeamsRepository implements IMatchTeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { groupMatchId: string; name: string; color: string }): Promise<MatchTeam> {
    return this.prisma.matchTeam.create({ data }) as Promise<MatchTeam>;
  }

  async findById(id: string): Promise<MatchTeam | null> {
    return this.prisma.matchTeam.findUnique({ where: { id } }) as Promise<MatchTeam | null>;
  }

  async findAllByGroupMatchId(groupMatchId: string): Promise<MatchTeam[]> {
    return this.prisma.matchTeam.findMany({ where: { groupMatchId } }) as Promise<MatchTeam[]>;
  }

  async update(id: string, data: Partial<{ name: string; color: string }>): Promise<MatchTeam> {
    return this.prisma.matchTeam.update({ where: { id }, data }) as Promise<MatchTeam>;
  }

  async delete(id: string): Promise<MatchTeam> {
    return this.prisma.matchTeam.delete({ where: { id } }) as Promise<MatchTeam>;
  }

  // Métodos legados
  async findUnique<T extends Prisma.MatchTeamFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.MatchTeamFindUniqueArgs>,
  ) {
    return this.prisma.matchTeam.findUnique(args);
  }

  async findMany<T extends Prisma.MatchTeamFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.MatchTeamFindManyArgs>,
  ) {
    return this.prisma.matchTeam.findMany(args);
  }
}
