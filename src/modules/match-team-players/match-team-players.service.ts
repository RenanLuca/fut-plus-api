import { ConflictException, Injectable } from "@nestjs/common";
import { MatchTeamRosterDto } from "./dto/match-team-roster.dto";
import { MatchTeamsService } from "../match-teams/match-teams.service";
import { MatchTeamsPlayersRepository } from "@src/shared/database/repositories/match-team-players.repository";
import { MatchTeamPlayerDto } from "./dto/match-team-player.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { MatchGuestsService } from "../match-guests/match-guests.service";

@Injectable()
export class MatchTeamPlayersService {
  constructor(
    private readonly groupMatchesService: GroupMatchesService,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
    private readonly matchGuestsService: MatchGuestsService,
    private readonly matchTeamsService: MatchTeamsService,
    private readonly matchTeamPlayersRepository: MatchTeamsPlayersRepository,
  ) {}
  async replaceAll(
    groupId: string,
    matchId: string,
    teams: MatchTeamRosterDto[],
  ) {
    this.checkNoDuplicatePlayersInPayload(teams);
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    await Promise.all(
      teams.map(async (team) => {
        await this.matchTeamsService.checkIfMatchTeamBelongsToMatch(
          {
            matchId,
            matchTeamId: team.matchTeamId,
          },
        );
        await Promise.all(
          team.players.map((player) =>
            this.checkPlayerBelongsToMatch({
              player,
              groupId,
              matchId,
            }),
          ),
        );
      }),
    );
    const teamsId = teams.map((team) => team.matchTeamId);
    const createTeamPlayersDto = {
      data: teams.flatMap((team) =>
        team.players.map((player) => ({
          matchTeamId: team.matchTeamId,
          groupMatchId: matchId,
          userId: player.userId,
          guestUserId: player.guestUserId,
        })),
      ),
    };
    await this.matchTeamPlayersRepository.replaceAllPlayers(
      createTeamPlayersDto,
      teamsId,
    );
  }

  async addPlayers({
    groupId,
    matchId,
    matchTeamId,
    players,
  }: {
    groupId: string;
    matchId: string;
    matchTeamId: string;
    players: MatchTeamPlayerDto[];
  }) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    await this.matchTeamsService.checkIfMatchTeamBelongsToMatch({
      matchId,
      matchTeamId: matchTeamId,
    });
    await Promise.all(
      players.map(async (player) => {
        if (!player.userId && !player.guestUserId) return;
        await this.checkPlayerBelongsToMatch({
          player,
          groupId,
          matchId,
        });
        await this.checkPlayerNotAlreadyInMatch({
          matchId,
          userId: player.userId,
          guestUserId: player.guestUserId,
        });
      }),
    );
    return await this.matchTeamPlayersRepository.addPlayers({
      data: players.map((player) => ({
        matchTeamId,
        groupMatchId: matchId,
        userId: player.userId,
        guestUserId: player.guestUserId,
      })),
    });
  }

  private async checkPlayerBelongsToMatch({
    player,
    groupId,
    matchId,
  }: {
    player: MatchTeamPlayerDto;
    groupId: string;
    matchId: string;
  }) {
    if (player.userId) {
      await this.userBelongsToGroupService.check({
        memberId: player.userId,
        groupId,
      });
    } else if (player.guestUserId) {
      await this.matchGuestsService.checkIfGuestBelongsToMatch({
        guestUserId: player.guestUserId,
        matchId,
      });
    }
  }

  private checkNoDuplicatePlayersInPayload(
    teams: MatchTeamRosterDto[],
  ) {
    const allMemberIds = teams.flatMap((team) =>
      team.players.map(
        (player) => player.userId ?? player.guestUserId,
      ),
    );

    const uniqueMemberIds = new Set(allMemberIds);
    if (uniqueMemberIds.size !== allMemberIds.length) {
      throw new ConflictException(
        "The same player cannot be assigned to more than one team",
      );
    }
  }

  private async checkPlayerNotAlreadyInMatch({
    matchId,
    userId,
    guestUserId,
  }: {
    matchId: string;
    userId?: string;
    guestUserId?: string;
  }) {
    const existing =
      await this.matchTeamPlayersRepository.findFirst({
        where: {
          groupMatchId: matchId,
          ...(userId ? { userId } : { guestUserId }),
        },
      });
    if (existing) {
      throw new ConflictException(
        "Player is already assigned to a team in this match",
      );
    }
  }
}
