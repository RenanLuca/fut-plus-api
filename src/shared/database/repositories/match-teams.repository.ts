import { Injectable } from "@nestjs/common";
import {
  MatchTeam,
  Prisma,
} from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class MatchTeamsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(createMatchTeamDto: Prisma.MatchTeamCreateArgs) {
    return this.prisma.matchTeam.create(createMatchTeamDto);
  }
  async findAll<T extends Prisma.MatchTeamFindManyArgs>(
    findAllMatchTeamsDto: Prisma.SelectSubset<
      T,
      Prisma.MatchTeamFindManyArgs
    >,
  ) {
    return this.prisma.matchTeam.findMany(findAllMatchTeamsDto);
  }
  async findOne<T extends Prisma.MatchTeamFindUniqueArgs>(
    findOneMatchTeamDto: Prisma.SelectSubset<
      T,
      Prisma.MatchTeamFindUniqueArgs
    >,
  ) {
    return this.prisma.matchTeam.findUnique(findOneMatchTeamDto);
  }
  async findFirst(
    findFirstMatchTeamDto: Prisma.MatchTeamFindFirstArgs,
  ) {
    return this.prisma.matchTeam.findFirst(
      findFirstMatchTeamDto,
    );
  }
  async update(updateMatchTeamDto: Prisma.MatchTeamUpdateArgs) {
    return this.prisma.matchTeam.update(updateMatchTeamDto);
  }

  async regenerateTeams({
    groupMatchId,
    teams,
  }: {
    groupMatchId: string;
    teams: {
      name: string;
      color: string;
      players: { userId?: string; guestUserId?: string }[];
    }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.matchTeam.deleteMany({ where: { groupMatchId } });

      const createdTeams: MatchTeam[] = [];
      for (const team of teams) {
        const createdTeam = await tx.matchTeam.create({
          data: {
            groupMatchId,
            name: team.name,
            color: team.color,
          },
        });
        if (team.players.length > 0) {
          await tx.matchTeamPlayer.createMany({
            data: team.players.map((player) => ({
              matchTeamId: createdTeam.id,
              groupMatchId,
              userId: player.userId,
              guestUserId: player.guestUserId,
            })),
          });
        }
        createdTeams.push(createdTeam);
      }
      return createdTeams;
    });
  }
}
