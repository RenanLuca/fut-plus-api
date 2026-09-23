import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { VerificationTokensRepository } from "@src/shared/database/repositories/verification-tokens.repository";
import { VerificationTokenType } from "../../../../generated/prisma/client";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class VerificationTokensService {
  constructor(
    private readonly verificationTokensRepository: VerificationTokensRepository,
  ) {}

  /**
   * Creates a single-use token and returns the raw value (the one that
   * goes in the email link). Only its sha256 hash is stored, so a
   * database leak doesn't expose usable links. Any earlier unused token
   * of the same user and type is invalidated.
   */
  async issue({
    userId,
    type,
    ttlMs,
    newEmail,
  }: {
    userId: string;
    type: VerificationTokenType;
    ttlMs: number;
    newEmail?: string;
  }): Promise<string> {
    await this.verificationTokensRepository.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    await this.verificationTokensRepository.create({
      data: {
        userId,
        type,
        newEmail,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return token;
  }

  /**
   * Validates the token and marks it as used. Unknown, wrong-type,
   * expired and already-used tokens all fail with the same error so
   * the response doesn't reveal which case it was.
   */
  async consume(token: string, type: VerificationTokenType) {
    const record =
      await this.verificationTokensRepository.findUnique({
        where: { tokenHash: hashToken(token) },
      });

    if (
      !record ||
      record.type !== type ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException("Invalid or expired token");
    }

    // The `usedAt: null` filter makes the claim atomic: if two requests
    // race with the same token, only one of them updates a row.
    const { count } =
      await this.verificationTokensRepository.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
    if (count === 0) {
      throw new BadRequestException("Invalid or expired token");
    }

    return record;
  }
}
