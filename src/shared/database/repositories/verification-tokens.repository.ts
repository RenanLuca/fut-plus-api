import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class VerificationTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createVerificationTokenDto: Prisma.VerificationTokenCreateArgs,
  ) {
    return this.prisma.verificationToken.create(
      createVerificationTokenDto,
    );
  }

  async findUnique(
    findUniqueVerificationTokenDto: Prisma.VerificationTokenFindUniqueArgs,
  ) {
    return this.prisma.verificationToken.findUnique(
      findUniqueVerificationTokenDto,
    );
  }

  async updateMany(
    updateManyVerificationTokenDto: Prisma.VerificationTokenUpdateManyArgs,
  ) {
    return this.prisma.verificationToken.updateMany(
      updateManyVerificationTokenDto,
    );
  }
}
