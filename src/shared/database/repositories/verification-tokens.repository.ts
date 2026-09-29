import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IVerificationTokensRepository } from "../interfaces/verification-tokens.repository.interface";
import type { VerificationToken } from "../interfaces/verification-tokens.repository.interface";
import { VerificationTokenType } from "../interfaces/verification-tokens.repository.interface";

@Injectable()
export class VerificationTokensRepository implements IVerificationTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; type: VerificationTokenType; tokenHash: string; newEmail?: string; expiresAt: Date }): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({ data }) as Promise<VerificationToken>;
  }
  async findById(id: string): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findUnique({ where: { id } }) as Promise<VerificationToken | null>;
  }
  async findByTokenHash(tokenHash: string): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findUnique({ where: { tokenHash } }) as Promise<VerificationToken | null>;
  }
  async update(id: string, data: Partial<{ usedAt: Date }>): Promise<VerificationToken> {
    return this.prisma.verificationToken.update({ where: { id }, data }) as Promise<VerificationToken>;
  }
  async delete(id: string): Promise<VerificationToken> {
    return this.prisma.verificationToken.delete({ where: { id } }) as Promise<VerificationToken>;
  }
  async deleteByUserId(userId: string): Promise<{ count: number }> {
    return this.prisma.verificationToken.deleteMany({ where: { userId } });
  }
  async updateMany<T extends Prisma.VerificationTokenUpdateManyArgs>(args: Prisma.SelectSubset<T, Prisma.VerificationTokenUpdateManyArgs>) {
    return this.prisma.verificationToken.updateMany(args);
  }
  async findUnique<T extends Prisma.VerificationTokenFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.VerificationTokenFindUniqueArgs>) {
    return this.prisma.verificationToken.findUnique(args);
  }
  async findMany<T extends Prisma.VerificationTokenFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.VerificationTokenFindManyArgs>) {
    return this.prisma.verificationToken.findMany(args);
  }
}
