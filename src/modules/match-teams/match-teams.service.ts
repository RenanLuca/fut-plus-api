import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateMatchTeamDto } from "./dto/create-match-team.dto";
import { UpdateMatchTeamDto } from "./dto/update-match-team.dto";
import { GenerateMatchTeamsDto } from "./dto/generate-match-teams.dto";
import { MatchTeamsRepository } from "@src/shared/database/repositories/match-teams.repository";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";
import { GuestUsersRepository } from "@src/shared/database/repositories/guest-users.repository";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { balanceMembersIntoTeams } from "./utils/match-teams-balancer";
import { TEAM_COLORS } from "./constants/teamColors";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";

@Injectable()
export class MatchTeamsService {
  constructor(
    private readonly matchTeamsRepository: MatchTeamsRepository,
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly guestUsersRepository: GuestUsersRepository,
    private readonly groupMatchesService: GroupMatchesService,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
  ) {}
  async create(
    createMatchTeamDto: CreateMatchTeamDto,
    matchId: string,
    groupId: string,
  ) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    return await this.matchTeamsRepository.create({
      data: {
        ...createMatchTeamDto,
        groupMatchId: matchId,
      },
    });
  }

  async findAll(
    matchId: string,
    groupId: string,
    userId: string,
  ) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });

    return await this.matchTeamsRepository.findAll({
      where: {
        groupMatchId: matchId,
      },
      include: {
        matchTeamPlayers: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                profilePicture: true,
              },
            },
            guestUser: true,
          },
        },
      },
    });
  }

  async findOne(
    matchTeamId: string,
    matchId: string,
    groupId: string,
    userId: string,
  ) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    const matchTeam = await this.matchTeamsRepository.findOne({
      where: {
        id: matchTeamId,
        groupMatchId: matchId,
      },
      include: {
        matchTeamPlayers: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                profilePicture: true,
              },
            },
            guestUser: true,
          },
        },
      },
    });
    if (!matchTeam) {
      throw new NotFoundException(
        "Match team not found in this match",
      );
    }
    return matchTeam;
  }

  async update(
    matchTeamId: string,
    matchId: string,
    groupId: string,
    updateMatchTeamDto: UpdateMatchTeamDto,
  ) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    await this.checkIfMatchTeamBelongsToMatch({
      matchTeamId,
      matchId,
    });

    return this.matchTeamsRepository.update({
      where: {
        id: matchTeamId,
      },
      data: {
        ...updateMatchTeamDto,
      },
    });
  }

  async generate(
    groupId: string,
    matchId: string,
    generateMatchTeamsDto: GenerateMatchTeamsDto,
  ) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });

    const { teamCount } = generateMatchTeamsDto;

    const [confirmedMembers, confirmedGuests] =
      await Promise.all([
        this.groupMembersRepository.findMany({
          where: {
            groupId,
            user: {
              groupMatchPresences: {
                some: { groupMatchId: matchId, isPresent: true },
              },
            },
          },
          select: {
            userId: true,
            rank: true,
            user: { select: { position: true } },
          },
        }),
        this.guestUsersRepository.findMany({
          where: {
            groupMatchId: matchId,
            groupMatchPresences: { some: { isPresent: true } },
          },
          select: { id: true, rank: true, position: true },
        }),
      ]);

    const membersForBalancing = [
      ...confirmedMembers.map((member) => ({
        userId: member.userId,
        guestUserId: null,
        rank: member.rank,
        position: member.user.position,
      })),
      ...confirmedGuests.map((guest) => ({
        userId: null,
        guestUserId: guest.id,
        rank: guest.rank,
        position: guest.position,
      })),
    ];

    const teamsAssignments = balanceMembersIntoTeams(
      membersForBalancing,
      teamCount,
    );

    const teams = teamsAssignments.map((players, index) => ({
      name: `Time ${index + 1}`,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
      players,
    }));

    return this.matchTeamsRepository.regenerateTeams({
      groupMatchId: matchId,
      teams,
    });
  }

  async checkIfMatchTeamBelongsToMatch({
    matchTeamId,
    matchId,
  }: {
    matchTeamId: string;
    matchId: string;
  }) {
    const matchTeam = await this.matchTeamsRepository.findFirst({
      where: {
        id: matchTeamId,
        groupMatchId: matchId,
      },
    });
    if (!matchTeam) {
      throw new NotFoundException(
        "Match team not found in this match",
      );
    }
    return matchTeam;
  }
}
