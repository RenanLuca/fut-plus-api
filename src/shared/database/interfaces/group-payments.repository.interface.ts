export const GROUP_PAYMENTS_REPOSITORY = Symbol("GROUP_PAYMENTS_REPOSITORY");

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

export interface IGroupPaymentsRepository {
  create(data: {
    groupId: string;
    userId: string;
    matchId?: string;
    period: Date;
    amount: number;
    receipt?: string;
  }): Promise<GroupPayment>;

  findById(id: string): Promise<GroupPayment | null>;
  findAllByGroupId(groupId: string): Promise<GroupPayment[]>;
  update(id: string, data: Partial<Omit<GroupPayment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<GroupPayment>;
  delete(id: string): Promise<GroupPayment>;
}
