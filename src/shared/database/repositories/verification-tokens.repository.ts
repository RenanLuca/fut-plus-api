import { Injectable } from "@nestjs/common";
import { VerificationTokenType } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type {
  IVerificationTokensRepository,
  VerificationToken,
} from "../interfaces/verification-tokens.repository.interface";

@Injectable()
export class VerificationTokensRepository implements IVerificationTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    type: VerificationTokenType;
    tokenHash: string;
    newEmail?: string;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({ data });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async invalidateActiveTokens(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async markAsUsedIfUnused(
    id: string,
  ): Promise<{ claimed: boolean }> {
    const { count } =
      await this.prisma.verificationToken.updateMany({
        where: { id, usedAt: null },
        data: { usedAt: new Date() },
      });
    return { claimed: count > 0 };
  }
}
