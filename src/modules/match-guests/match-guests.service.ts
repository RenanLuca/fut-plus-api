import { Injectable, NotFoundException } from "@nestjs/common";
import { GuestUsersRepository } from "@src/shared/database/repositories/guest-users.repository";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { CreateMatchGuestDto } from "./dto/create-match-guest.dto";

@Injectable()
export class MatchGuestsService {
  constructor(
    private readonly guestUsersRepository: GuestUsersRepository,
    private readonly groupMatchesService: GroupMatchesService,
  ) {}

  async create(
    groupId: string,
    matchId: string,
    createMatchGuestDto: CreateMatchGuestDto,
  ) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    return this.guestUsersRepository.createConfirmedForMatch({
      groupMatchId: matchId,
      ...createMatchGuestDto,
    });
  }

  async remove(
    groupId: string,
    matchId: string,
    guestUserId: string,
  ) {
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    await this.checkIfGuestBelongsToMatch({ guestUserId, matchId });
    await this.guestUsersRepository.delete({
      where: { id: guestUserId },
    });
  }

  async checkIfGuestBelongsToMatch({
    guestUserId,
    matchId,
  }: {
    guestUserId: string;
    matchId: string;
  }) {
    const guestUser = await this.guestUsersRepository.findFirst({
      where: { id: guestUserId, groupMatchId: matchId },
    });
    if (!guestUser) {
      throw new NotFoundException("Guest not found in this match");
    }
    return guestUser;
  }
}
