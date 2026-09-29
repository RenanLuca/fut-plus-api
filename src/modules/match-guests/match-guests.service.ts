import {
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { GUEST_USERS_REPOSITORY } from "@src/shared/database/interfaces/guest-users.repository.interface";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { CreateMatchGuestDto } from "./dto/create-match-guest.dto";

@Injectable()
export class MatchGuestsService {
  constructor(
    @Inject(GUEST_USERS_REPOSITORY)
    private readonly guestUsersRepository: IGuestUsersRepository,
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
    return this.guestUsersRepository.create({
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
    await this.checkIfGuestBelongsToMatch({
      guestUserId,
      matchId,
    });
    await this.guestUsersRepository.delete(guestUserId);
  }

  async checkIfGuestBelongsToMatch({
    guestUserId,
    matchId,
  }: {
    guestUserId: string;
    matchId: string;
  }) {
    const guestUser =
      await this.guestUsersRepository.findByIdAndGroupMatchId(
        guestUserId,
        matchId,
      );
    if (!guestUser) {
      throw new NotFoundException(
        "Guest not found in this match",
      );
    }
    return guestUser;
  }
}
