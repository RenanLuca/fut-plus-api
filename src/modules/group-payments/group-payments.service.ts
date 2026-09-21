import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MatchPresencesService } from "../match-presences/match-presences.service";
import { CreateGroupPaymentDto } from "./dto/create-group-payment.dto";
import { UpdateGroupPaymentDto } from "./dto/update-group-payment.dto";
import { GroupPaymentsRepository } from "@src/shared/database/repositories/group-payments.repository";
import { GroupMatchesRepository } from "@src/shared/database/repositories/group-matches.repository";
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
    private readonly groupPaymentsRepository: GroupPaymentsRepository,
    private readonly groupMatchesRepository: GroupMatchesRepository,
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
      data: {
        amount,
        receipt,
        groupId,
        userId,
        matchId,
        period,
      },
    });
  }

  async findAllByGroup(
    groupId: string,
    { page, limit, month, year }: PaymentFilterQueryDto,
  ) {
    const where = {
      groupId,
      ...this.buildPeriodFilter({ month, year }),
    };
    const skip = getSkip(page, limit);
    const [data, total] = await Promise.all([
      this.groupPaymentsRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.groupPaymentsRepository.count({ where }),
    ]);
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
    const where = {
      groupId,
      userId,
      ...this.buildPeriodFilter({ month, year }),
    };
    const skip = getSkip(page, limit);
    const [data, total] = await Promise.all([
      this.groupPaymentsRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.groupPaymentsRepository.count({ where }),
    ]);
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
    return this.groupMatchesRepository.findMany({
      where: {
        groupId,
        matchDate: { lt: new Date() },
        groupMatchPresences: {
          some: { userId, isPresent: true },
        },
        groupPayments: { none: { userId } },
      },
      orderBy: { matchDate: "desc" },
    });
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
      await this.groupPaymentsRepository.findUnique({
        where: {
          id: paymentId,
          groupId,
        },
      });
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
  }) {
    if (!year) {
      if (month) {
        throw new BadRequestException(
          "year is required when filtering by month",
        );
      }
      return {};
    }
    const { gte, lt } = getPeriodRange({ year, month });
    return { period: { gte, lt } };
  }
}
