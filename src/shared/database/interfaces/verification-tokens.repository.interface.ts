export const VERIFICATION_TOKENS_REPOSITORY = Symbol(
  "VERIFICATION_TOKENS_REPOSITORY",
);

export enum VerificationTokenType {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_CHANGE = "EMAIL_CHANGE",
}

export type VerificationToken = {
  id: string;
  userId: string;
  type: VerificationTokenType;
  tokenHash: string;
  newEmail: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export interface IVerificationTokensRepository {
  create(data: {
    userId: string;
    type: VerificationTokenType;
    tokenHash: string;
    newEmail?: string;
    expiresAt: Date;
  }): Promise<VerificationToken>;

  findById(id: string): Promise<VerificationToken | null>;

  findByTokenHash(tokenHash: string): Promise<VerificationToken | null>;

  update(
    id: string,
    data: Partial<{ usedAt: Date }>,
  ): Promise<VerificationToken>;

  delete(id: string): Promise<VerificationToken>;

  deleteByUserId(userId: string): Promise<{ count: number }>;
}
