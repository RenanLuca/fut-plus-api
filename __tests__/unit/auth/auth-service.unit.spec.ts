import { mock } from "vitest-mock-extended";
import type { IUsersRepository } from "@src/shared/database/interfaces/users.repository.interface";
import type { JwtService } from "@nestjs/jwt";
import type { Mock } from "vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import { VerificationTokensService } from "@src/modules/auth/services/verification-tokens.service";
import {
  makeSignupInputAfterHashMock,
  makeSignupInputMock,
  makeSignupOutputMock,
  makeSigninInputMock,
  makeVerifyEmailInputMock,
  makeResendVerificationInputMock,
  makeForgotPasswordInputMock,
  makeResetPasswordInputMock,
  makeVerificationTokenMock,
  verificationEmailSentResponse,
  emailVerifiedResponse,
  resendVerificationResponse,
  forgotPasswordResponse,
  passwordResetResponse,
} from "../../utils/auth";
import { AuthService } from "@src/modules/auth/services/auth.service";
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { compare } from "bcryptjs";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";

const usersRepoMock = mock<IUsersRepository>();
const jwtServiceMock = mock<JwtService>();
const mailServiceMock = mock<IMailService>();

const { mockedHashedPassword } = vi.hoisted(() => ({
  mockedHashedPassword: "hashedPassword",
}));
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue(mockedHashedPassword),
  compare: vi.fn().mockResolvedValue(true),
}));
const verificationTokensServiceMock =
  mock<VerificationTokensService>();

const compareMock = compare as unknown as Mock<
  (password: string, hash: string) => Promise<boolean>
>;

let sut: AuthService;
beforeEach(async () => {
  sut = new AuthService(
    usersRepoMock,
    jwtServiceMock,
    mailServiceMock,
    verificationTokensServiceMock,
  );
  usersRepoMock.findByEmail.mockResolvedValue(null);
  usersRepoMock.create.mockResolvedValue(makeSignupOutputMock());
  jwtServiceMock.signAsync.mockResolvedValue("access-token");
});

describe("AuthService", () => {
  describe("signup", () => {
    it("should create a new user", async () => {
      const response = await sut.signup(makeSignupInputMock());

      expect(usersRepoMock.create).toHaveBeenCalled();
      expect(mailServiceMock.send).toHaveBeenCalled();
      expect(usersRepoMock.create).toHaveBeenCalledWith(
        makeSignupInputAfterHashMock(),
      );
      expect(response).toEqual(verificationEmailSentResponse);
    });
    it("should throw an error if the email is already in use", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock(),
      );
      const promiseResult = sut.signup(makeSignupInputMock());
      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("signin", () => {
    it("should throw UnauthorizedException if the user is not found", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(null);

      const promiseResult = sut.signin(makeSigninInputMock());

      await expect(promiseResult).rejects.toThrow(
        UnauthorizedException,
      );
      expect(compareMock).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the password is invalid", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock(),
      );
      compareMock.mockResolvedValueOnce(false);

      const promiseResult = sut.signin(makeSigninInputMock());

      await expect(promiseResult).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw ForbiddenException if the email is not verified", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock({ emailVerifiedAt: null }),
      );
      compareMock.mockResolvedValueOnce(true);

      const promiseResult = sut.signin(makeSigninInputMock());

      await expect(promiseResult).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should return an access token on success", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findByEmail.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(true);

      const response = await sut.signin(makeSigninInputMock());

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
      });
      expect(response).toEqual({ accessToken: "access-token" });
    });
  });

  describe("verifyEmail", () => {
    it("should return early without updating if the user is not found", async () => {
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        makeVerificationTokenMock(),
      );
      usersRepoMock.findById.mockResolvedValueOnce(null);

      const response = await sut.verifyEmail(
        makeVerifyEmailInputMock(),
      );

      expect(usersRepoMock.update).not.toHaveBeenCalled();
      expect(mailServiceMock.send).not.toHaveBeenCalled();
      expect(response).toEqual(emailVerifiedResponse);
    });

    it("should return early without updating if the email is already verified", async () => {
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        makeVerificationTokenMock(),
      );
      usersRepoMock.findById.mockResolvedValueOnce(
        makeSignupOutputMock(),
      );

      await sut.verifyEmail(makeVerifyEmailInputMock());

      expect(usersRepoMock.update).not.toHaveBeenCalled();
      expect(mailServiceMock.send).not.toHaveBeenCalled();
    });

    it("should mark the email as verified and send the welcome email", async () => {
      const token = makeVerificationTokenMock();
      const user = makeSignupOutputMock({
        id: token.userId,
        emailVerifiedAt: null,
      });
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        token,
      );
      usersRepoMock.findById.mockResolvedValueOnce(user);

      const response = await sut.verifyEmail(
        makeVerifyEmailInputMock(),
      );

      expect(usersRepoMock.update).toHaveBeenCalledWith(
        token.userId,
        { emailVerifiedAt: expect.any(Date) },
      );
      expect(mailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email }),
      );
      expect(response).toEqual(emailVerifiedResponse);
    });

    it("should propagate the error if the token is invalid, expired or already used", async () => {
      verificationTokensServiceMock.consume.mockRejectedValueOnce(
        new BadRequestException("Invalid or expired token"),
      );

      const promiseResult = sut.verifyEmail(
        makeVerifyEmailInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepoMock.findById).not.toHaveBeenCalled();
      expect(usersRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("resendVerification", () => {
    it("should resend the verification email if the user exists and is unverified", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock({ emailVerifiedAt: null }),
      );

      const response = await sut.resendVerification(
        makeResendVerificationInputMock(),
      );

      expect(
        verificationTokensServiceMock.issue,
      ).toHaveBeenCalled();
      expect(mailServiceMock.send).toHaveBeenCalled();
      expect(response).toEqual(resendVerificationResponse);
    });

    it("should not send anything if the user does not exist", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(null);

      const response = await sut.resendVerification(
        makeResendVerificationInputMock(),
      );

      expect(
        verificationTokensServiceMock.issue,
      ).not.toHaveBeenCalled();
      expect(mailServiceMock.send).not.toHaveBeenCalled();
      expect(response).toEqual(resendVerificationResponse);
    });

    it("should not send anything if the user is already verified", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock(),
      );

      await sut.resendVerification(
        makeResendVerificationInputMock(),
      );

      expect(
        verificationTokensServiceMock.issue,
      ).not.toHaveBeenCalled();
      expect(mailServiceMock.send).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("should issue a reset token and send the email if the user exists", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock(),
      );
      verificationTokensServiceMock.issue.mockResolvedValueOnce(
        "reset-token",
      );

      const response = await sut.forgotPassword(
        makeForgotPasswordInputMock(),
      );

      expect(
        verificationTokensServiceMock.issue,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VerificationTokenType.PASSWORD_RESET,
        }),
      );
      expect(mailServiceMock.send).toHaveBeenCalled();
      expect(response).toEqual(forgotPasswordResponse);
    });

    it("should not send anything if the user does not exist", async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(null);

      const response = await sut.forgotPassword(
        makeForgotPasswordInputMock(),
      );

      expect(
        verificationTokensServiceMock.issue,
      ).not.toHaveBeenCalled();
      expect(mailServiceMock.send).not.toHaveBeenCalled();
      expect(response).toEqual(forgotPasswordResponse);
    });
  });

  describe("resetPassword", () => {
    it("should update the password and send the confirmation email", async () => {
      const token = makeVerificationTokenMock();
      const user = makeSignupOutputMock();
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        token,
      );
      usersRepoMock.update.mockResolvedValueOnce(user);

      const response = await sut.resetPassword(
        makeResetPasswordInputMock(),
      );

      expect(usersRepoMock.update).toHaveBeenCalledWith(
        token.userId,
        {
          hashedPassword: mockedHashedPassword,
          passwordChangedAt: expect.any(Date),
        },
      );
      expect(mailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email }),
      );
      expect(response).toEqual(passwordResetResponse);
    });

    it("should propagate the error if the token is invalid, expired or already used", async () => {
      verificationTokensServiceMock.consume.mockRejectedValueOnce(
        new BadRequestException("Invalid or expired token"),
      );

      const promiseResult = sut.resetPassword(
        makeResetPasswordInputMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepoMock.update).not.toHaveBeenCalled();
    });
  });
});
