import type { VerificationTokenType } from "../../../../generated/prisma/client";

export const VERIFICATION_TOKENS_REPOSITORY = Symbol(
  "VERIFICATION_TOKENS_REPOSITORY",
);

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

  findByTokenHash(
    tokenHash: string,
  ): Promise<VerificationToken | null>;

  /**
   * Invalidates every unused token of this user and type. Used before
   * issuing a new one so only the most recent link stays valid.
   */
  invalidateActiveTokens(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void>;

  /**
   * Atomically marks the token as used only if it's still unused
   * (`usedAt: null`). Returns whether the claim succeeded, so two
   * concurrent requests for the same token can't both succeed.
   */
  markAsUsedIfUnused(id: string): Promise<{ claimed: boolean }>;
}
