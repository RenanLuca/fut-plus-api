import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  CreateVerificationTokenDTO,
  IVerificationTokensRepository,
  VerificationToken,
} from "../interfaces/verification-tokens.repository.interface";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";
import type { VerificationToken as PrismaVerificationToken } from "../../../../generated/prisma/client";

@Injectable()
export class VerificationTokensRepository implements IVerificationTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateVerificationTokenDTO,
  ): Promise<VerificationToken> {
    const token = await this.prisma.verificationToken.create({
      data,
    });
    return this.toDomain(token);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<VerificationToken | null> {
    const token = await this.prisma.verificationToken.findUnique(
      {
        where: { tokenHash },
      },
    );
    return token ? this.toDomain(token) : null;
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

  private toDomain(
    token: PrismaVerificationToken,
  ): VerificationToken {
    return {
      ...token,
      type: token.type as VerificationTokenType,
    };
  }
}
