import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { GROUP_PAYMENTS_REPOSITORY } from "@src/shared/database/interfaces/group-payments.repository.interface";
import type { IGroupPaymentsRepository } from "@src/shared/database/interfaces/group-payments.repository.interface";
import { GROUP_MATCHES_REPOSITORY } from "@src/shared/database/interfaces/group-matches.repository.interface";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import { MatchPresencesService } from "../match-presences/match-presences.service";
import { CreateGroupPaymentDto } from "./dto/create-group-payment.dto";
import { UpdateGroupPaymentDto } from "./dto/update-group-payment.dto";
import { UserBelongsToGroupService } from "../groups/services/userBelongsToGroup.service";
import { GroupMatchesService } from "../group-matches/services/group-matches.service";
import { getBrazilCurrentMonthStart } from "@src/shared/utils/brazil-date";
import { GroupMemberType } from "../../../generated/prisma/client";
import { PaymentFilterQueryDto } from "./dto/payment-filter-query.dto";
import {
  buildPaginationMeta,
  getSkip,
} from "@src/shared/utils/pagination";
import { getPeriodRange } from "./utils/period-range";
import { GroupsService } from "../groups/services/groups.service";

@Injectable()
export class GroupPaymentsService {
  constructor(
    @Inject(GROUP_PAYMENTS_REPOSITORY)
    private readonly groupPaymentsRepository: IGroupPaymentsRepository,
    @Inject(GROUP_MATCHES_REPOSITORY)
    private readonly groupMatchesRepository: IGroupMatchesRepository,
    private readonly userBelongsToGroupService: UserBelongsToGroupService,
    private readonly groupMatchesService: GroupMatchesService,
    private readonly matchPresencesService: MatchPresencesService,
    private readonly groupsService: GroupsService,
  ) {}
  async create({
    createGroupPaymentDto,
    userId,
    groupId,
  }: {
    createGroupPaymentDto: CreateGroupPaymentDto;
    userId: string;
    groupId: string;
  }) {
    const { receipt, matchId, amount } = createGroupPaymentDto;
    const { member } =
      await this.userBelongsToGroupService.check({
        memberId: userId,
        groupId,
      });
    const isDailyMember = member.type === GroupMemberType.DAILY;
    if (isDailyMember && !matchId) {
      throw new BadRequestException(
        "Daily members pay per match, not the monthly fee",
      );
    }
    if (!isDailyMember && matchId) {
      throw new BadRequestException(
        "Monthly members and the owner pay the monthly fee, not per match",
      );
    }
    let period: Date | string;

    if (matchId) {
      const match = await this.groupMatchesService.findOne({
        groupId,
        matchId,
        userId,
      });
      period = match.matchDate;
      const userWentToMatch =
        await this.matchPresencesService.checkIfUserWentToMatch({
          userId,
          matchId,
        });
      if (!userWentToMatch) {
        throw new BadRequestException(
          "User did not attend the match",
        );
      }
    } else {
      period = getBrazilCurrentMonthStart();
    }

    return this.groupPaymentsRepository.create({
      amount,
      receipt,
      groupId,
      userId,
      matchId,
      period,
    });
  }

  async findAllByGroup(
    groupId: string,
    { page, limit, month, year }: PaymentFilterQueryDto,
  ) {
    const skip = getSkip(page, limit);
    const { data, total } =
      await this.groupPaymentsRepository.findManyPaginated(
        {
          groupId,
          period: this.buildPeriodFilter({ month, year }),
        },
        { skip, take: limit },
      );
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findAllByUser(
    groupId: string,
    userId: string,
    { page, limit, month, year }: PaymentFilterQueryDto,
  ) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    const skip = getSkip(page, limit);
    const { data, total } =
      await this.groupPaymentsRepository.findManyPaginated(
        {
          groupId,
          userId,
          period: this.buildPeriodFilter({ month, year }),
        },
        { skip, take: limit },
      );
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findPendingMatches(groupId: string, userId: string) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    return this.groupMatchesRepository.findUnpaidAttendedMatches(
      groupId,
      userId,
    );
  }

  async findOne({
    paymentId,
    userId,
    groupId,
  }: {
    paymentId: string;
    userId: string;
    groupId: string;
  }) {
    await this.userBelongsToGroupService.check({
      memberId: userId,
      groupId,
    });
    const isOwner = await this.groupsService.isUserOwner(
      groupId,
      userId,
    );

    const payment =
      await this.groupPaymentsRepository.findByIdAndGroupId(
        paymentId,
        groupId,
      );
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    if (payment.userId !== userId && !isOwner) {
      throw new ForbiddenException(
        "User is not allowed to access this payment",
      );
    }
    return payment;
  }

  private buildPeriodFilter({
    month,
    year,
  }: {
    month?: number;
    year?: number;
  }): { gte: Date; lt: Date } | undefined {
    if (!year) {
      if (month) {
        throw new BadRequestException(
          "year is required when filtering by month",
        );
      }
      return undefined;
    }
    return getPeriodRange({ year, month });
  }
}
