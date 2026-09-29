import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  IMatchTeamsRepository,
  MatchTeam,
  MatchTeamWithPlayers,
  TeamToCreate,
} from "../interfaces/match-teams.repository.interface";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

@Injectable()
export class MatchTeamsRepository implements IMatchTeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    groupMatchId: string;
    name: string;
    color: string;
  }): Promise<MatchTeam> {
    return this.prisma.matchTeam.create({ data });
  }

  async findByIdAndGroupMatchId(
    id: string,
    groupMatchId: string,
  ): Promise<MatchTeam | null> {
    return this.prisma.matchTeam.findFirst({
      where: { id, groupMatchId },
    });
  }

  async findAllByGroupMatchIdWithPlayers(
    groupMatchId: string,
    groupId: string,
  ): Promise<MatchTeamWithPlayers[]> {
    const teams = await this.prisma.matchTeam.findMany({
      where: { groupMatchId },
      include: {
        matchTeamPlayers: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                profilePicture: true,
                groupMembers: {
                  where: { groupId },
                  select: { rank: true },
                },
              },
            },
            guestUser: true,
          },
        },
      },
    });
    return teams.map((team) => this.toDomain(team));
  }

  async findByIdWithPlayers(
    id: string,
    groupMatchId: string,
    groupId: string,
  ): Promise<MatchTeamWithPlayers | null> {
    const team = await this.prisma.matchTeam.findFirst({
      where: { id, groupMatchId },
      include: {
        matchTeamPlayers: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                profilePicture: true,
                groupMembers: {
                  where: { groupId },
                  select: { rank: true },
                },
              },
            },
            guestUser: true,
          },
        },
      },
    });
    return team ? this.toDomain(team) : null;
  }

  async update(
    id: string,
    data: Partial<{ name: string; color: string }>,
  ): Promise<MatchTeam> {
    return this.prisma.matchTeam.update({ where: { id }, data });
  }

  async regenerateTeams(
    groupMatchId: string,
    teams: TeamToCreate[],
  ): Promise<MatchTeam[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.matchTeam.deleteMany({ where: { groupMatchId } });
      const created: MatchTeam[] = [];
      for (const team of teams) {
        const matchTeam = await tx.matchTeam.create({
          data: {
            groupMatchId,
            name: team.name,
            color: team.color,
          },
        });
        if (team.players.length > 0) {
          await tx.matchTeamPlayer.createMany({
            data: team.players.map((player) => ({
              matchTeamId: matchTeam.id,
              groupMatchId,
              userId: player.userId,
              guestUserId: player.guestUserId,
            })),
          });
        }
        created.push(matchTeam);
      }
      return created;
    });
  }

  private toDomain(team: {
    id: string;
    groupMatchId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    matchTeamPlayers: {
      user: {
        id: string;
        name: string;
        position: string;
        profilePicture: string | null;
        groupMembers: { rank: string | null }[];
      } | null;
      guestUser: {
        id: string;
        name: string;
        rank: string;
        position: string;
      } | null;
    }[];
  }): MatchTeamWithPlayers {
    return {
      ...team,
      matchTeamPlayers: team.matchTeamPlayers.map((player) => ({
        user: player.user
          ? {
              ...player.user,
              position: player.user.position as PositionEnum,
              groupMembers: player.user.groupMembers.map(
                (gm) => ({
                  rank: gm.rank as UserRank | null,
                }),
              ),
            }
          : null,
        guestUser: player.guestUser
          ? {
              ...player.guestUser,
              rank: player.guestUser.rank as UserRank,
              position: player.guestUser
                .position as PositionEnum,
            }
          : null,
      })),
    };
  }
}
