import { mock } from "vitest-mock-extended";
import type {
  IMatchTeamsRepository,
  MatchTeamPlayerWithDetails,
} from "@src/shared/database/interfaces/match-teams.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { MatchTeamsService } from "@src/modules/match-teams/match-teams.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { TEAM_COLORS } from "@src/modules/match-teams/constants/teamColors";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { randomUUID } from "crypto";
import { makeGroupMemberMock } from "../../utils/groups";
import { makeGroupMatchMock } from "../../utils/group-matches";
import { makeGuestUserMock } from "../../utils/match-guests";
import {
  makeCreateMatchTeamInputMock,
  makeMatchTeamMock,
  makeMatchTeamWithPlayersMock,
  makeUpdateMatchTeamInputMock,
  makeConfirmedMemberForBalancingMock,
} from "../../utils/match-teams";

const matchTeamsRepoMock = mock<IMatchTeamsRepository>();
const groupMembersRepoMock = mock<IGroupMembersRepository>();
const guestUsersRepoMock = mock<IGuestUsersRepository>();
const groupMatchesServiceMock = mock<GroupMatchesService>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();

let sut: MatchTeamsService;
beforeEach(() => {
  sut = new MatchTeamsService(
    matchTeamsRepoMock,
    groupMembersRepoMock,
    guestUsersRepoMock,
    groupMatchesServiceMock,
    userBelongsToGroupServiceMock,
  );
  groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockResolvedValue(
    makeGroupMatchMock(),
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
  matchTeamsRepoMock.findByIdAndGroupMatchId.mockResolvedValue(
    makeMatchTeamMock(),
  );
  groupMembersRepoMock.findConfirmedMembersByGroupMatchId.mockResolvedValue(
    [],
  );
  guestUsersRepoMock.findConfirmedGuestsByGroupMatchId.mockResolvedValue(
    [],
  );
});

describe("MatchTeamsService", () => {
  describe("create", () => {
    it("should create the team in the match", async () => {
      const createMatchTeamDto = makeCreateMatchTeamInputMock();
      const team = makeMatchTeamMock();
      matchTeamsRepoMock.create.mockResolvedValueOnce(team);

      const response = await sut.create(
        createMatchTeamDto,
        "match-id",
        "group-id",
      );

      expect(
        groupMatchesServiceMock.checkIfMatchBelongsToGroup,
      ).toHaveBeenCalledWith({
        groupId: "group-id",
        matchId: "match-id",
      });
      expect(matchTeamsRepoMock.create).toHaveBeenCalledWith({
        ...createMatchTeamDto,
        groupMatchId: "match-id",
      });
      expect(response).toEqual(team);
    });

    it("should not create the team when the match does not belong to the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.create(
        makeCreateMatchTeamInputMock(),
        "match-id",
        "group-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(matchTeamsRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return the teams with players sorted by rank, highest first", async () => {
      const lowRankPlayer: MatchTeamPlayerWithDetails = {
        user: {
          id: "low",
          name: "Low",
          position: PositionEnum.DEFENDER,
          profilePicture: null,
          groupMembers: [{ rank: UserRank.BRASILEIRAO }],
        },
        guestUser: null,
      };
      const highRankPlayer: MatchTeamPlayerWithDetails = {
        user: {
          id: "high",
          name: "High",
          position: PositionEnum.STRIKER,
          profilePicture: null,
          groupMembers: [{ rank: UserRank.BALLON_DOR }],
        },
        guestUser: null,
      };
      matchTeamsRepoMock.findAllByGroupMatchIdWithPlayers.mockResolvedValueOnce(
        [
          makeMatchTeamWithPlayersMock({
            matchTeamPlayers: [lowRankPlayer, highRankPlayer],
          }),
        ],
      );

      const response = await sut.findAll(
        "match-id",
        "group-id",
        "user-id",
      );

      expect(
        response[0].matchTeamPlayers.map((p) => p.user?.id),
      ).toEqual(["high", "low"]);
      expect(response[0].matchTeamPlayers[0].user?.rank).toBe(
        UserRank.BALLON_DOR,
      );
    });

    it("should throw ForbiddenException when the requester is not a member", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.findAll(
        "match-id",
        "group-id",
        "user-id",
      );

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        matchTeamsRepoMock.findAllByGroupMatchIdWithPlayers,
      ).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return the team when it exists in the match", async () => {
      const team = makeMatchTeamWithPlayersMock();
      matchTeamsRepoMock.findByIdWithPlayers.mockResolvedValueOnce(
        team,
      );

      const response = await sut.findOne(
        team.id,
        "match-id",
        "group-id",
        "user-id",
      );

      expect(response).toEqual({ ...team, matchTeamPlayers: [] });
    });

    it("should throw NotFoundException when the team is not in the match", async () => {
      matchTeamsRepoMock.findByIdWithPlayers.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.findOne(
        "team-id",
        "match-id",
        "group-id",
        "user-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update the team", async () => {
      const team = makeMatchTeamMock();
      const dto = makeUpdateMatchTeamInputMock();
      matchTeamsRepoMock.update.mockResolvedValueOnce(team);

      const response = await sut.update(
        team.id,
        "match-id",
        "group-id",
        dto,
      );

      expect(matchTeamsRepoMock.update).toHaveBeenCalledWith(
        team.id,
        dto,
      );
      expect(response).toEqual(team);
    });

    it("should not update when the team is not in the match", async () => {
      matchTeamsRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.update(
        "team-id",
        "match-id",
        "group-id",
        makeUpdateMatchTeamInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(matchTeamsRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("generate", () => {
    const confirmedFour = () => [
      makeConfirmedMemberForBalancingMock({ userId: randomUUID() }),
      makeConfirmedMemberForBalancingMock({ userId: randomUUID() }),
      makeConfirmedMemberForBalancingMock({ userId: randomUUID() }),
      makeConfirmedMemberForBalancingMock({ userId: randomUUID() }),
    ];

    it("should regenerate the teams with the requested players per team", async () => {
      const members = confirmedFour();
      groupMembersRepoMock.findConfirmedMembersByGroupMatchId.mockResolvedValueOnce(
        members.map((m) => ({
          userId: m.userId as string,
          rank: m.rank,
          position: m.position,
        })),
      );

      await sut.generate("group-id", "match-id", {
        playersPerTeam: 2,
      });

      expect(
        matchTeamsRepoMock.regenerateTeams,
      ).toHaveBeenCalledWith(
        "match-id",
        expect.arrayContaining([
          expect.objectContaining({
            name: "Time 1",
            color: TEAM_COLORS[0],
          }),
          expect.objectContaining({
            name: "Time 2",
            color: TEAM_COLORS[1],
          }),
        ]),
      );
      const [, teams] = matchTeamsRepoMock.regenerateTeams.mock.calls[0];
      expect(teams).toHaveLength(2);
      expect(teams.map((t) => t.players.length)).toEqual([2, 2]);
    });

    it("should count confirmed guests alongside confirmed members", async () => {
      groupMembersRepoMock.findConfirmedMembersByGroupMatchId.mockResolvedValueOnce(
        [
          {
            userId: randomUUID(),
            rank: UserRank.BRASILEIRAO,
            position: PositionEnum.DEFENDER,
          },
        ],
      );
      guestUsersRepoMock.findConfirmedGuestsByGroupMatchId.mockResolvedValueOnce(
        [makeGuestUserMock()],
      );

      await sut.generate("group-id", "match-id", {
        playersPerTeam: 1,
      });

      const [, teams] = matchTeamsRepoMock.regenerateTeams.mock.calls[0];
      expect(teams).toHaveLength(2);
      expect(
        teams.flatMap((t) => t.players).length,
      ).toBe(2);
    });

    it("should throw BadRequestException when the requested team size would leave fewer than 2 teams", async () => {
      groupMembersRepoMock.findConfirmedMembersByGroupMatchId.mockResolvedValueOnce(
        [
          {
            userId: randomUUID(),
            rank: UserRank.BRASILEIRAO,
            position: PositionEnum.DEFENDER,
          },
          {
            userId: randomUUID(),
            rank: UserRank.BRASILEIRAO,
            position: PositionEnum.DEFENDER,
          },
        ],
      );

      const promiseResult = sut.generate("group-id", "match-id", {
        playersPerTeam: 2,
      });

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(matchTeamsRepoMock.regenerateTeams).not.toHaveBeenCalled();
    });
  });

  describe("checkIfMatchTeamBelongsToMatch", () => {
    it("should return the team when it belongs to the match", async () => {
      const team = makeMatchTeamMock();
      matchTeamsRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        team,
      );

      const response = await sut.checkIfMatchTeamBelongsToMatch({
        matchTeamId: team.id,
        matchId: team.groupMatchId,
      });

      expect(response).toEqual(team);
    });

    it("should throw NotFoundException when the team does not belong to the match", async () => {
      matchTeamsRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.checkIfMatchTeamBelongsToMatch({
        matchTeamId: "team-id",
        matchId: "match-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
