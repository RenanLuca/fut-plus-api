import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateMatchPresenceDto } from "./dto/updateMatchPresence.dto";
import { MatchPresencesRepository } from "@src/shared/database/repositories/match-presences.repository";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";
import { GuestUsersRepository } from "@src/shared/database/repositories/guest-users.repository";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { Position } from "../../../generated/prisma/client";

type MatchPresenceMember = {
  id: string;
  name: string;
  position: Position;
  profilePicture: string | null;
  isGuest: boolean;
};

@Injectable()
export class MatchPresencesService {
  constructor(
    private readonly matchPresencesRepository: MatchPresencesRepository,
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly guestUsersRepository: GuestUsersRepository,
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
      this.groupMembersRepository.findMany({
        where: { groupId },
        select: {
          userId: true,
          user: {
            select: {
              name: true,
              position: true,
              profilePicture: true,
            },
          },
        },
      }),
      this.guestUsersRepository.findMany({
        where: { groupMatchId: matchId },
        select: { id: true, name: true, position: true },
      }),
      this.matchPresencesRepository.findMany({
        where: { groupMatchId: matchId },
        select: {
          userId: true,
          guestUserId: true,
          isPresent: true,
        },
      }),
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
        isGuest: false,
      });
    }

    for (const guest of guests) {
      classify({
        id: guest.id,
        name: guest.name,
        position: guest.position,
        profilePicture: null,
        isGuest: true,
      });
    }

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
    await this.matchPresencesRepository.upsert({
      where: {
        groupMatchId_userId: { groupMatchId: matchId, userId },
      },
      create: {
        groupMatchId: matchId,
        userId,
        isPresent: updateMatchPresenceDto.isPresent,
      },
      update: {
        isPresent: updateMatchPresenceDto.isPresent,
      },
    });
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
      await this.matchPresencesRepository.findOne({
        where: {
          groupMatchId_userId: { groupMatchId: matchId, userId },
        },
        select: {
          groupMatch: {
            select: { matchDate: true },
          },
          isPresent: true,
          groupMatchId: true,
        },
      });
    if (!matchPresence?.groupMatch.matchDate) {
      throw new NotFoundException("Presence not found");
    }
    if (matchPresence.groupMatch.matchDate > new Date()) {
      throw new NotFoundException("Match has not happened yet");
    }
    return matchPresence.isPresent;
  }
}
