import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  CreateMatchTeamDTO,
  IMatchTeamsRepository,
  MatchTeam,
  MatchTeamWithPlayers,
  TeamToCreate,
  UpdateMatchTeamDTO,
} from "../interfaces/match-teams.repository.interface";
import {
  toPositionEnum,
  toUserRank,
} from "@src/shared/utils/enum-casters";

@Injectable()
export class MatchTeamsRepository implements IMatchTeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMatchTeamDTO): Promise<MatchTeam> {
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
      include: this.playersInclude(groupId),
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
      include: this.playersInclude(groupId),
    });
    return team ? this.toDomain(team) : null;
  }

  /**
   * Shared `include` shape for both finder methods above, so the
   * "team with players" view can't silently drift between "list teams"
   * and "get one team" if a field is added/removed in only one place.
   */
  private playersInclude(groupId: string) {
    return {
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
    } as const;
  }

  async update(
    id: string,
    data: UpdateMatchTeamDTO,
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
              position: toPositionEnum(player.user.position),
              groupMembers: player.user.groupMembers.map(
                (gm) => ({
                  rank: toUserRank(gm.rank),
                }),
              ),
            }
          : null,
        guestUser: player.guestUser
          ? {
              ...player.guestUser,
              rank: toUserRank(player.guestUser.rank),
              position: toPositionEnum(
                player.guestUser.position,
              ),
            }
          : null,
      })),
    };
  }
}
