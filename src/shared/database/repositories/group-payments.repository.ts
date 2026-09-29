import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  GroupPayment,
  GroupPaymentFilters,
  IGroupPaymentsRepository,
  Pagination,
} from "../interfaces/group-payments.repository.interface";

@Injectable()
export class GroupPaymentsRepository implements IGroupPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    groupId: string;
    userId: string;
    matchId?: string | null;
    period: Date | string;
    amount: number;
    receipt?: string;
  }): Promise<GroupPayment> {
    return this.prisma.groupPayment.create({ data });
  }

  async findByIdAndGroupId(
    id: string,
    groupId: string,
  ): Promise<GroupPayment | null> {
    return this.prisma.groupPayment.findFirst({
      where: { id, groupId },
    });
  }

  async findManyPaginated(
    { groupId, userId, period }: GroupPaymentFilters,
    { skip, take }: Pagination,
  ): Promise<{ data: GroupPayment[]; total: number }> {
    const where = { groupId, userId, period };
    const [data, total] = await Promise.all([
      this.prisma.groupPayment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.groupPayment.count({ where }),
    ]);
    return { data, total };
  }
}
