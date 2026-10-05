import { mock } from "vitest-mock-extended";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { MatchGuestsService } from "@src/modules/match-guests/match-guests.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  makeCreateMatchGuestInputMock,
  makeGuestUserMock,
} from "../../utils/match-guests";
import { makeGroupMatchMock } from "../../utils/group-matches";

const guestUsersRepoMock = mock<IGuestUsersRepository>();
const groupMatchesServiceMock = mock<GroupMatchesService>();

let sut: MatchGuestsService;
beforeEach(() => {
  sut = new MatchGuestsService(
    guestUsersRepoMock,
    groupMatchesServiceMock,
  );
  groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockResolvedValue(
    makeGroupMatchMock(),
  );
});

describe("MatchGuestsService", () => {
  describe("create", () => {
    it("should create the guest attached to the match", async () => {
      const groupId = randomUUID();
      const matchId = randomUUID();
      const createMatchGuestDto = makeCreateMatchGuestInputMock();
      const guest = makeGuestUserMock({ groupMatchId: matchId });
      guestUsersRepoMock.create.mockResolvedValueOnce(guest);

      const response = await sut.create(
        groupId,
        matchId,
        createMatchGuestDto,
      );

      expect(
        groupMatchesServiceMock.checkIfMatchBelongsToGroup,
      ).toHaveBeenCalledWith({ groupId, matchId });
      expect(guestUsersRepoMock.create).toHaveBeenCalledWith({
        groupMatchId: matchId,
        ...createMatchGuestDto,
      });
      expect(response).toEqual(guest);
    });

    it("should not create the guest when the match does not belong to the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.create(
        "group-id",
        "match-id",
        makeCreateMatchGuestInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(guestUsersRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe("checkIfGuestBelongsToMatch", () => {
    it("should return the guest when they belong to the match", async () => {
      const guest = makeGuestUserMock();
      guestUsersRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        guest,
      );

      const response = await sut.checkIfGuestBelongsToMatch({
        guestUserId: guest.id,
        matchId: guest.groupMatchId,
      });

      expect(response).toEqual(guest);
    });

    it("should throw NotFoundException when the guest does not belong to the match", async () => {
      guestUsersRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.checkIfGuestBelongsToMatch({
        guestUserId: "guest-id",
        matchId: "match-id",
      });

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete the guest when they belong to the match", async () => {
      const guest = makeGuestUserMock();
      guestUsersRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        guest,
      );

      await sut.remove("group-id", guest.groupMatchId, guest.id);

      expect(guestUsersRepoMock.delete).toHaveBeenCalledWith(guest.id);
    });

    it("should throw NotFoundException and not delete when the guest is not in the match", async () => {
      guestUsersRepoMock.findByIdAndGroupMatchId.mockResolvedValueOnce(
        null,
      );

      const promiseResult = sut.remove(
        "group-id",
        "match-id",
        "guest-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(guestUsersRepoMock.delete).not.toHaveBeenCalled();
    });

    it("should not check the guest when the match does not belong to the group", async () => {
      groupMatchesServiceMock.checkIfMatchBelongsToGroup.mockRejectedValueOnce(
        new NotFoundException("Match not found in this group"),
      );

      const promiseResult = sut.remove(
        "group-id",
        "match-id",
        "guest-id",
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(
        guestUsersRepoMock.findByIdAndGroupMatchId,
      ).not.toHaveBeenCalled();
      expect(guestUsersRepoMock.delete).not.toHaveBeenCalled();
    });
  });
});
