import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IGroupPaymentsRepository } from "../interfaces/group-payments.repository.interface";
import type { GroupPayment } from "../interfaces/group-payments.repository.interface";

@Injectable()
export class GroupPaymentsRepository implements IGroupPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { groupId: string; userId: string; matchId?: string; period: Date; amount: number; receipt?: string }): Promise<GroupPayment> {
    return this.prisma.groupPayment.create({ data }) as Promise<GroupPayment>;
  }
  async findById(id: string): Promise<GroupPayment | null> {
    return this.prisma.groupPayment.findUnique({ where: { id } }) as Promise<GroupPayment | null>;
  }
  async findAllByGroupId(groupId: string): Promise<GroupPayment[]> {
    return this.prisma.groupPayment.findMany({ where: { groupId } }) as Promise<GroupPayment[]>;
  }
  async update(id: string, data: Partial<Omit<GroupPayment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<GroupPayment> {
    return this.prisma.groupPayment.update({ where: { id }, data }) as Promise<GroupPayment>;
  }
  async delete(id: string): Promise<GroupPayment> {
    return this.prisma.groupPayment.delete({ where: { id } }) as Promise<GroupPayment>;
  }
  async count<T extends Prisma.GroupPaymentCountArgs>(args?: Prisma.SelectSubset<T, Prisma.GroupPaymentCountArgs>) {
    return this.prisma.groupPayment.count(args);
  }
  async findUnique<T extends Prisma.GroupPaymentFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.GroupPaymentFindUniqueArgs>) {
    return this.prisma.groupPayment.findUnique(args);
  }
  async findMany<T extends Prisma.GroupPaymentFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.GroupPaymentFindManyArgs>) {
    return this.prisma.groupPayment.findMany(args);
  }
}
