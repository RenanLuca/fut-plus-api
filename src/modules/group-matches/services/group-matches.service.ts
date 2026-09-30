import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { GROUP_MATCHES_REPOSITORY } from "@src/shared/database/interfaces/group-matches.repository.interface";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import { UserBelongsToGroupService } from "@src/modules/groups/services/userBelongsToGroup.service";
import { CreateGroupMatchDto } from "../dto/create-group-match.dto";
import { GroupMatchNotificationsService } from "./group-match-notifications.service";

@Injectable()
export class GroupMatchesService {
  constructor(
    @Inject(GROUP_MATCHES_REPOSITORY)
    private readonly groupMatchesRepository: IGroupMatchesRepository,
    private readonly usersBelongToGroupService: UserBelongsToGroupService,
    private readonly groupMatchNotificationsService: GroupMatchNotificationsService,
  ) {}
  async create(
    groupId: string,
    createGroupMatchDto: CreateGroupMatchDto,
  ) {
    const { matchDate } = createGroupMatchDto;
    const dateIsInThePast = new Date(matchDate) < new Date();
    if (dateIsInThePast) {
      throw new BadRequestException(
        "Match date cannot be in the past",
      );
    }
    const existingMatchInThisDate =
      await this.groupMatchesRepository.findByGroupIdAndDate(
        groupId,
        new Date(matchDate),
      );
    if (existingMatchInThisDate) {
      throw new ConflictException(
        "There's already a match scheduled for this date in this group",
      );
    }
    const match = await this.groupMatchesRepository.create({
      groupId,
      matchDate: new Date(matchDate),
    });

    // Runs for both manual creation and the scheduler, since both go
    // through this method. Not awaited: emailing must not delay the response.
    void this.groupMatchNotificationsService.notifyMatchOpened({
      groupId,
      matchDate: match.matchDate,
    });

    return match;
  }

  async findAll(groupId: string, userId: string) {
    await this.usersBelongToGroupService.check({
      memberId: userId,
      groupId,
    });
    return this.groupMatchesRepository.findAllByGroupId(groupId);
  }

  async findOne({
    groupId,
    matchId,
    userId,
  }: {
    groupId: string;
    matchId: string;
    userId: string;
  }) {
    await this.usersBelongToGroupService.check({
      memberId: userId,
      groupId,
    });
    return this.checkIfMatchBelongsToGroup({ groupId, matchId });
  }

  async remove(groupId: string, matchId: string) {
    await this.checkIfMatchBelongsToGroup({ groupId, matchId });
    return this.groupMatchesRepository.delete(matchId);
  }

  async checkIfMatchBelongsToGroup({
    groupId,
    matchId,
  }: {
    groupId: string;
    matchId: string;
  }) {
    const match =
      await this.groupMatchesRepository.findByIdAndGroupId(
        matchId,
        groupId,
      );
    if (!match) {
      throw new NotFoundException(
        "Match not found in this group",
      );
    }
    return match;
  }
}
