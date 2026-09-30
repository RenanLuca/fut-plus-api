import { JwtService } from "@nestjs/jwt";
import { AuthService } from "@src/modules/auth/services/auth.service";
import { VerificationTokensService } from "@src/modules/auth/services/verification-tokens.service";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "@src/modules/auth/constants/tokenTtl";
import { MailService } from "@src/modules/mail/mail.service";
import { PrismaService } from "@src/shared/database/prisma.service";
import { UsersRepository } from "@src/shared/database/repositories/users.repository";
import { VerificationTokensRepository } from "@src/shared/database/repositories/verification-tokens.repository";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mock } from "vitest-mock-extended";
import {
  makeCreateUserDTOWithRealHashMock,
  makeForgotPasswordInputMock,
  makeResendVerificationInputMock,
  makeResetPasswordInputMock,
  makeSigninInputMock,
  makeSignupInputMock,
  verificationEmailSentResponse,
  emailVerifiedResponse,
  resendVerificationResponse,
  forgotPasswordResponse,
  passwordResetResponse,
} from "../../utils/auth";
import { Prisma } from "../../../generated/prisma/client";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";
import { withRollback } from "../../utils/withRollback";
import { env } from "@src/shared/config/env";
import { compare } from "bcryptjs";
import { BadRequestException } from "@nestjs/common";

let prismaService: PrismaService;

beforeAll(() => {
  prismaService = new PrismaService();
});

afterAll(async () => {
  await prismaService.$disconnect();
});

function makeSut(tx: Prisma.TransactionClient): {
  sut: AuthService;
  usersRepo: UsersRepository;
  verificationTokenService: VerificationTokensService;
} {
  const usersRepo = new UsersRepository(
    tx as unknown as PrismaService,
  );
  const verificationTokensRepo =
    new VerificationTokensRepository(
      tx as unknown as PrismaService,
    );
  const verificationTokenService = new VerificationTokensService(
    verificationTokensRepo,
  );
  const jwtService = new JwtService({
    secret: env.jwtSecret,
  });
  const mailServiceMock = mock<MailService>();

  const sut = new AuthService(
    usersRepo,
    jwtService,
    mailServiceMock,
    verificationTokenService,
  );

  return { sut, usersRepo, verificationTokenService };
}

describe("auth", () => {
  describe("signup", () => {
    it("should create a new user correctly", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo } = makeSut(tx);
        const createSpy = vi.spyOn(usersRepo, "create");

        const response = await sut.signup(makeSignupInputMock());

        expect(response).toEqual(verificationEmailSentResponse);
        expect(createSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe("signin", () => {
    it("should signin correctly", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo } = makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        const user = await usersRepo.create(createUserData);
        await usersRepo.update(user.id, {
          emailVerifiedAt: new Date(),
        });
        const response = await sut.signin(makeSigninInputMock());

        expect(response).toHaveProperty("accessToken");
      });
    });
  });

  describe("verifyEmail", () => {
    it("should mark the email as verified", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo, verificationTokenService } =
          makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        const user = await usersRepo.create(createUserData);
        const token = await verificationTokenService.issue({
          userId: user.id,
          type: VerificationTokenType.EMAIL_VERIFICATION,
          ttlMs: EMAIL_VERIFICATION_TOKEN_TTL_MS,
        });

        const response = await sut.verifyEmail({ token });

        const updatedUser = await usersRepo.findById(user.id);
        expect(updatedUser?.emailVerifiedAt).not.toBeNull();
        expect(response).toEqual(emailVerifiedResponse);
      });
    });

    it("should reject an expired token", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo, verificationTokenService } =
          makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        const user = await usersRepo.create(createUserData);
        const token = await verificationTokenService.issue({
          userId: user.id,
          type: VerificationTokenType.EMAIL_VERIFICATION,
          ttlMs: -1,
        });

        const promiseResult = sut.verifyEmail({ token });

        await expect(promiseResult).rejects.toThrow(
          BadRequestException,
        );
        const updatedUser = await usersRepo.findById(user.id);
        expect(updatedUser?.emailVerifiedAt).toBeNull();
      });
    });

    it("should reject a token that was already used", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo, verificationTokenService } =
          makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        const user = await usersRepo.create(createUserData);
        const token = await verificationTokenService.issue({
          userId: user.id,
          type: VerificationTokenType.EMAIL_VERIFICATION,
          ttlMs: EMAIL_VERIFICATION_TOKEN_TTL_MS,
        });

        await sut.verifyEmail({ token });
        const promiseResult = sut.verifyEmail({ token });

        await expect(promiseResult).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe("resendVerification", () => {
    it("should return the generic success message for an unverified user", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo } = makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        await usersRepo.create(createUserData);

        const response = await sut.resendVerification(
          makeResendVerificationInputMock(),
        );

        expect(response).toEqual(resendVerificationResponse);
      });
    });
  });

  describe("forgotPassword", () => {
    it("should return the generic success message", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo } = makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        await usersRepo.create(createUserData);

        const response = await sut.forgotPassword(
          makeForgotPasswordInputMock(),
        );

        expect(response).toEqual(forgotPasswordResponse);
      });
    });
  });

  describe("resetPassword", () => {
    it("should update the password", async () => {
      await withRollback(prismaService, async (tx) => {
        const { sut, usersRepo, verificationTokenService } =
          makeSut(tx);
        const createUserData =
          await makeCreateUserDTOWithRealHashMock();
        const user = await usersRepo.create(createUserData);
        const token = await verificationTokenService.issue({
          userId: user.id,
          type: VerificationTokenType.PASSWORD_RESET,
          ttlMs: PASSWORD_RESET_TOKEN_TTL_MS,
        });

        const resetPasswordInput = makeResetPasswordInputMock({
          token,
        });
        const response = await sut.resetPassword(
          resetPasswordInput,
        );

        const updatedUser = await usersRepo.findById(user.id);
        const passwordMatches = await compare(
          resetPasswordInput.password,
          updatedUser!.hashedPassword,
        );
        expect(passwordMatches).toBe(true);
        expect(response).toEqual(passwordResetResponse);
      });
    });
  });
});
