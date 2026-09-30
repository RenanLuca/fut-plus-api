import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { MATCH_TEAMS_REPOSITORY } from "@src/shared/database/interfaces/match-teams.repository.interface";
import type { IMatchTeamsRepository } from "@src/shared/database/interfaces/match-teams.repository.interface";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { GUEST_USERS_REPOSITORY } from "@src/shared/database/interfaces/guest-users.repository.interface";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { CreateMatchTeamDto } from "./dto/create-match-team.dto";
import { UpdateMatchTeamDto } from "./dto/update-match-team.dto";
import { GenerateMatchTeamsDto } from "./dto/generate-match-teams.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { balanceMembersIntoTeams } from "./utils/match-teams-balancer";
import { TEAM_COLORS } from "./constants/teamColors";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { rankWeight } from "@src/shared/utils/rank-weight";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

@Injectable()
export class MatchTeamsService {
  constructor(
    @Inject(MATCH_TEAMS_REPOSITORY)
    private readonly matchTeamsRepository: IMatchTeamsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository,
    @Inject(GUEST_USERS_REPOSITORY)
    private readonly guestUsersRepository: IGuestUsersRepository,
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
      ...createMatchTeamDto,
      groupMatchId: matchId,
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

    const matchTeams =
      await this.matchTeamsRepository.findAllByGroupMatchIdWithPlayers(
        matchId,
        groupId,
      );

    return matchTeams.map((matchTeam) =>
      this.formatMatchTeam(matchTeam),
    );
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
    const matchTeam =
      await this.matchTeamsRepository.findByIdWithPlayers(
        matchTeamId,
        matchId,
        groupId,
      );
    if (!matchTeam) {
      throw new NotFoundException(
        "Match team not found in this match",
      );
    }
    return this.formatMatchTeam(matchTeam);
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

    return this.matchTeamsRepository.update(
      matchTeamId,
      updateMatchTeamDto,
    );
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

    const { playersPerTeam } = generateMatchTeamsDto;

    const [confirmedMembers, confirmedGuests] =
      await Promise.all([
        this.groupMembersRepository.findConfirmedMembersByGroupMatchId(
          groupId,
          matchId,
        ),
        this.guestUsersRepository.findConfirmedGuestsByGroupMatchId(
          matchId,
        ),
      ]);

    const confirmed = [
      ...confirmedMembers.map((member) => ({
        userId: member.userId,
        guestUserId: null,
        rank: member.rank,
        position: member.position,
      })),
      ...confirmedGuests.map((guest) => ({
        userId: null,
        guestUserId: guest.id,
        rank: guest.rank,
        position: guest.position,
      })),
    ];

    // Every team needs at least 2 teams to make sense, so the requested
    // size can be at most half of the confirmed players.
    const maxPlayersPerTeam = Math.floor(confirmed.length / 2);
    if (playersPerTeam > maxPlayersPerTeam) {
      throw new BadRequestException(
        `playersPerTeam must be between 1 and ${maxPlayersPerTeam} (half of the ${confirmed.length} confirmed players, rounded down) so at least 2 teams fit`,
      );
    }

    const teamCount = Math.floor(
      confirmed.length / playersPerTeam,
    );
    const assignments = balanceMembersIntoTeams(
      confirmed,
      teamCount,
    );

    const teams = assignments.map((players, index) => ({
      name: `Time ${index + 1}`,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
      players,
    }));

    return this.matchTeamsRepository.regenerateTeams(
      matchId,
      teams,
    );
  }

  private formatMatchTeam<
    T extends {
      matchTeamPlayers: {
        user: {
          id: string;
          name: string;
          position: PositionEnum;
          profilePicture: string | null;
          groupMembers: { rank: UserRank | null }[];
        } | null;
        guestUser: { rank: UserRank } | null;
      }[];
    },
  >(matchTeam: T) {
    const matchTeamPlayers = matchTeam.matchTeamPlayers
      .map((player) => ({
        ...player,
        user: player.user
          ? {
              id: player.user.id,
              name: player.user.name,
              position: player.user.position,
              profilePicture: player.user.profilePicture,
              rank: player.user.groupMembers[0]?.rank ?? null,
            }
          : null,
      }))
      .sort(
        (a, b) =>
          rankWeight(b.user?.rank ?? b.guestUser?.rank ?? null) -
          rankWeight(a.user?.rank ?? a.guestUser?.rank ?? null),
      );

    return { ...matchTeam, matchTeamPlayers };
  }

  async checkIfMatchTeamBelongsToMatch({
    matchTeamId,
    matchId,
  }: {
    matchTeamId: string;
    matchId: string;
  }) {
    const matchTeam =
      await this.matchTeamsRepository.findByIdAndGroupMatchId(
        matchTeamId,
        matchId,
      );
    if (!matchTeam) {
      throw new NotFoundException(
        "Match team not found in this match",
      );
    }
    return matchTeam;
  }
}
