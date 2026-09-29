export const GROUP_PAYMENTS_REPOSITORY = Symbol(
  "GROUP_PAYMENTS_REPOSITORY",
);

export type GroupPayment = {
  id: string;
  groupId: string;
  userId: string;
  matchId: string | null;
  period: Date;
  amount: number;
  receipt: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupPaymentFilters = {
  groupId: string;
  userId?: string;
  period?: { gte: Date; lt: Date };
};

export type Pagination = { skip: number; take: number };

export interface IGroupPaymentsRepository {
  create(data: {
    groupId: string;
    userId: string;
    matchId?: string | null;
    period: Date | string;
    amount: number;
    receipt?: string;
  }): Promise<GroupPayment>;

  findByIdAndGroupId(
    id: string,
    groupId: string,
  ): Promise<GroupPayment | null>;

  findManyPaginated(
    filters: GroupPaymentFilters,
    pagination: Pagination,
  ): Promise<{ data: GroupPayment[]; total: number }>;
}
