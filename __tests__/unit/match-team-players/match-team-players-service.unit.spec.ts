import { mock } from "vitest-mock-extended";
import type { IMatchTeamPlayersRepository } from "@src/shared/database/interfaces/match-team-players.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { MatchTeamPlayersService } from "@src/modules/match-team-players/match-team-players.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { MatchGuestsService } from "@src/modules/match-guests/match-guests.service";
import { MatchTeamsService } from "@src/modules/match-teams/match-teams.service";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { makeGroupMemberMock } from "../../utils/groups";
import { makeGroupMatchMock } from "../../utils/group-matches";
import { makeGuestUserMock } from "../../utils/match-guests";
import {
  makeMatchTeamPlayerMock,
  makeMatchTeamPlayerInputMock,
  makeMatchTeamRosterInputMock,
} from "../../utils/match-team-players";
import { makeMatchTeamMock } from "../../utils/match-teams";

const matchTeamPlayersRepoMock = mock<IMatchTeamPlayersRepository>();
const groupMatchesServiceMock = mock<GroupMatchesService>();
const userBelongsToGroupServiceMock =
  mock<UserBelongsToGroupService>();
const matchGuestsServiceMock = mock<MatchGuestsService>();
const matchTeamsServiceMock = mock<MatchTeamsService>();

let sut: MatchTeamPlayersService;
beforeEach(() => {
  sut = new MatchTeamPlayersService(
    groupMatchesServiceMock,
    userBelongsToGroupServiceMock,
    matchGuestsServiceMock,
    matchTeamsServiceMock,
    matchTeamPlayersRepoMock,
  );
  groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockResolvedValue(
    makeGroupMatchMock(),
  );
  userBelongsToGroupServiceMock.check.mockResolvedValue({
    isMember: true,
    member: makeGroupMemberMock(),
  });
  matchGuestsServiceMock.checkIfGuestBelongsToMatch.mockResolvedValue(
    makeGuestUserMock(),
  );
  matchTeamsServiceMock.checkIfMatchTeamBelongsToMatch.mockResolvedValue(
    makeMatchTeamMock(),
  );
  matchTeamPlayersRepoMock.findByMatchAndPlayer.mockResolvedValue(null);
});

describe("MatchTeamPlayersService", () => {
  describe("replaceAll", () => {
    it("should replace the rosters of every team with the given players", async () => {
      const teamA = makeMatchTeamRosterInputMock();
      const teamB = makeMatchTeamRosterInputMock();

      await sut.replaceAll("group-id", "match-id", [teamA, teamB]);

      expect(
        matchTeamPlayersRepoMock.replaceAllPlayersInTeams,
      ).toHaveBeenCalledWith(
        [teamA.matchTeamId, teamB.matchTeamId],
        [
          {
            matchTeamId: teamA.matchTeamId,
            groupMatchId: "match-id",
            userId: teamA.players[0].userId,
          },
          {
            matchTeamId: teamB.matchTeamId,
            groupMatchId: "match-id",
            userId: teamB.players[0].userId,
          },
        ],
      );
    });

    it("should throw ConflictException when the same player appears in two teams", async () => {
      const sharedPlayer = makeMatchTeamPlayerInputMock();
      const teamA = makeMatchTeamRosterInputMock({
        players: [sharedPlayer],
      });
      const teamB = makeMatchTeamRosterInputMock({
        players: [sharedPlayer],
      });

      const promiseResult = sut.replaceAll("group-id", "match-id", [
        teamA,
        teamB,
      ]);

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
      expect(
        matchTeamPlayersRepoMock.replaceAllPlayersInTeams,
      ).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the match does not belong to the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.replaceAll("group-id", "match-id", [
        makeMatchTeamRosterInputMock(),
      ]);

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(
        matchTeamPlayersRepoMock.replaceAllPlayersInTeams,
      ).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when a registered player is not in the group", async () => {
      userBelongsToGroupServiceMock.check.mockRejectedValueOnce(
        new ForbiddenException(
          "Member does not belong to the group",
        ),
      );

      const promiseResult = sut.replaceAll("group-id", "match-id", [
        makeMatchTeamRosterInputMock(),
      ]);

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        matchTeamPlayersRepoMock.replaceAllPlayersInTeams,
      ).not.toHaveBeenCalled();
    });

    it("should check guests against the match instead of the group", async () => {
      const guestId = randomUUID();
      const roster = makeMatchTeamRosterInputMock({
        players: [{ guestUserId: guestId }],
      });

      await sut.replaceAll("group-id", "match-id", [roster]);

      expect(
        matchGuestsServiceMock.checkIfGuestBelongsToMatch,
      ).toHaveBeenCalledWith({
        guestUserId: guestId,
        matchId: "match-id",
      });
      expect(
        userBelongsToGroupServiceMock.check,
      ).not.toHaveBeenCalled();
    });
  });

  describe("addPlayers", () => {
    it("should add the players to the team", async () => {
      const player = makeMatchTeamPlayerInputMock();
      const added = [makeMatchTeamPlayerMock()];
      matchTeamPlayersRepoMock.addPlayers.mockResolvedValueOnce(added);

      const response = await sut.addPlayers({
        groupId: "group-id",
        matchId: "match-id",
        matchTeamId: "team-id",
        players: [player],
      });

      expect(matchTeamPlayersRepoMock.addPlayers).toHaveBeenCalledWith([
        {
          matchTeamId: "team-id",
          groupMatchId: "match-id",
          userId: player.userId,
        },
      ]);
      expect(response).toEqual(added);
    });

    it("should drop players that have neither a userId nor a guestUserId", async () => {
      const validPlayer = makeMatchTeamPlayerInputMock();

      await sut.addPlayers({
        groupId: "group-id",
        matchId: "match-id",
        matchTeamId: "team-id",
        players: [validPlayer, {}],
      });

      expect(matchTeamPlayersRepoMock.addPlayers).toHaveBeenCalledWith([
        expect.objectContaining({ userId: validPlayer.userId }),
      ]);
      expect(
        matchTeamPlayersRepoMock.addPlayers.mock.calls[0][0],
      ).toHaveLength(1);
    });

    it("should throw ConflictException when the player is already in the match", async () => {
      matchTeamPlayersRepoMock.findByMatchAndPlayer.mockResolvedValueOnce(
        makeMatchTeamPlayerMock(),
      );

      const promiseResult = sut.addPlayers({
        groupId: "group-id",
        matchId: "match-id",
        matchTeamId: "team-id",
        players: [makeMatchTeamPlayerInputMock()],
      });

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
      expect(matchTeamPlayersRepoMock.addPlayers).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the team does not belong to the match", async () => {
      matchTeamsServiceMock.checkIfMatchTeamBelongsToMatch.mockRejectedValueOnce(
        new NotFoundException("Team not found in this match"),
      );

      const promiseResult = sut.addPlayers({
        groupId: "group-id",
        matchId: "match-id",
        matchTeamId: "team-id",
        players: [makeMatchTeamPlayerInputMock()],
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(matchTeamPlayersRepoMock.addPlayers).not.toHaveBeenCalled();
    });
  });
});
