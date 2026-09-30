import {
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { MATCH_PRESENCES_REPOSITORY } from "@src/shared/database/interfaces/match-presences.repository.interface";
import type { IMatchPresencesRepository } from "@src/shared/database/interfaces/match-presences.repository.interface";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { GUEST_USERS_REPOSITORY } from "@src/shared/database/interfaces/guest-users.repository.interface";
import type { IGuestUsersRepository } from "@src/shared/database/interfaces/guest-users.repository.interface";
import { UpdateMatchPresenceDto } from "./dto/updateMatchPresence.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { rankWeight } from "@src/shared/utils/rank-weight";

type MatchPresenceMember = {
  id: string;
  name: string;
  position: PositionEnum;
  profilePicture: string | null;
  rank: UserRank | null;
  isGuest: boolean;
};

@Injectable()
export class MatchPresencesService {
  constructor(
    @Inject(MATCH_PRESENCES_REPOSITORY)
    private readonly matchPresencesRepository: IMatchPresencesRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository,
    @Inject(GUEST_USERS_REPOSITORY)
    private readonly guestUsersRepository: IGuestUsersRepository,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
    private readonly groupMatchesService: GroupMatchesService,
  ) {}

  async findMatchPresences(
    groupId: string,
    matchId: string,
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

    const [members, guests, presences] = await Promise.all([
      this.groupMembersRepository.findAllByGroupIdWithUser(
        groupId,
      ),
      this.guestUsersRepository.findAllByGroupMatchId(matchId),
      this.matchPresencesRepository.findAllByGroupMatchId(
        matchId,
      ),
    ]);

    const presenceByMember = new Map<string, boolean>();
    for (const presence of presences) {
      const memberId = presence.userId ?? presence.guestUserId;
      if (memberId) {
        presenceByMember.set(memberId, presence.isPresent);
      }
    }

    const confirmed: MatchPresenceMember[] = [];
    const declined: MatchPresenceMember[] = [];
    const pending: MatchPresenceMember[] = [];

    const classify = (entry: MatchPresenceMember) => {
      const isPresent = presenceByMember.get(entry.id);
      if (isPresent === true) confirmed.push(entry);
      else if (isPresent === false) declined.push(entry);
      else pending.push(entry);
    };

    for (const member of members) {
      classify({
        id: member.userId,
        name: member.user.name,
        position: member.user.position,
        profilePicture: member.user.profilePicture,
        rank: member.rank,
        isGuest: false,
      });
    }

    for (const guest of guests) {
      classify({
        id: guest.id,
        name: guest.name,
        position: guest.position,
        profilePicture: null,
        rank: guest.rank,
        isGuest: true,
      });
    }

    const byRankDesc = (
      a: MatchPresenceMember,
      b: MatchPresenceMember,
    ) => rankWeight(b.rank) - rankWeight(a.rank);
    confirmed.sort(byRankDesc);
    declined.sort(byRankDesc);
    pending.sort(byRankDesc);

    return { confirmed, declined, pending };
  }

  async updateMatchPresences(
    userId: string,
    groupId: string,
    matchId: string,
    updateMatchPresenceDto: UpdateMatchPresenceDto,
  ) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    await this.groupMatchesService.checkIfMatchBelongsToGroup({
      groupId,
      matchId,
    });
    await this.matchPresencesRepository.setUserPresence(
      matchId,
      userId,
      updateMatchPresenceDto.isPresent,
    );
    return {
      message: "Match presence updated successfully",
    };
  }

  async checkIfUserWentToMatch({
    userId,
    matchId,
  }: {
    userId: string;
    matchId: string;
  }) {
    const matchPresence =
      await this.matchPresencesRepository.findByMatchAndUserWithMatchDate(
        matchId,
        userId,
      );
    if (!matchPresence) {
      throw new NotFoundException("Presence not found");
    }
    if (matchPresence.matchDate > new Date()) {
      throw new NotFoundException("Match has not happened yet");
    }
    return matchPresence.isPresent;
  }
}
