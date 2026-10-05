import { GroupPayment } from "@src/shared/database/interfaces/group-payments.repository.interface";
import { CreateGroupPaymentDto } from "@src/modules/group-payments/dto/create-group-payment.dto";
import { PaymentFilterQueryDto } from "@src/modules/group-payments/dto/payment-filter-query.dto";
import { randomUUID } from "crypto";

export function makeGroupPaymentMock(
  overrides?: Partial<GroupPayment>,
): GroupPayment {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    userId: randomUUID(),
    matchId: null,
    period: new Date("2026-01-01T00:00:00.000Z"),
    amount: 20,
    receipt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeCreateGroupPaymentInputMock(
  overrides?: Partial<CreateGroupPaymentDto>,
): CreateGroupPaymentDto {
  return {
    amount: 20,
    ...overrides,
  };
}

export function makePaymentFilterQueryMock(
  overrides?: Partial<PaymentFilterQueryDto>,
): PaymentFilterQueryDto {
  return {
    page: 1,
    limit: 10,
    ...overrides,
  };
}
