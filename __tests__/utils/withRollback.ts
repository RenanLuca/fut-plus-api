import { PrismaService } from "@src/shared/database/prisma.service";
import { Prisma } from "../../generated/prisma/client";

class RollbackTransaction extends Error {}

export async function withRollback(
  prismaService: PrismaService,
  run: (tx: Prisma.TransactionClient) => Promise<void>,
): Promise<void> {
  try {
    await prismaService.$transaction(async (tx) => {
      await run(tx);
      throw new RollbackTransaction();
    });
  } catch (error) {
    if (!(error instanceof RollbackTransaction)) {
      throw error;
    }
  }
}
