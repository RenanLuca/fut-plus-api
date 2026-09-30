import {
  CreateUserDTO,
  User,
} from "@src/shared/database/interfaces/users.repository.interface";
import { VerificationToken } from "@src/shared/database/interfaces/verification-tokens.repository.interface";
import { randomUUID } from "crypto";
import { SignupDto } from "@src/modules/auth/dto/signup.dto";
import { SigninDto } from "@src/modules/auth/dto/signin.dto";
import { VerifyEmailDto } from "@src/modules/auth/dto/verifyEmail.dto";
import { ResendVerificationDto } from "@src/modules/auth/dto/resendVerification.dto";
import { ForgotPasswordDto } from "@src/modules/auth/dto/forgotPassword.dto";
import { ResetPasswordDto } from "@src/modules/auth/dto/resetPassword.dto";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";

export function makeSignupOutputMock(overrides?: Partial<User>): User {
  return {
    id: randomUUID(),
    email: "test@example.com",
    createdAt: new Date(),
    emailNotifications: true,
    emailVerifiedAt: new Date(),
    hashedPassword: "hashedPassword",
    name: "Test User",
    updatedAt: new Date(),
    passwordChangedAt: new Date(),
    profilePicture: "profilePictureUrl",
    telefone: "123-456-7890",
    position: PositionEnum.DEFENDER,
    ...overrides,
  };
}

export function makeSignupInputMock(): SignupDto {
  return {
    email: "test@example.com",
    password: "hashedPassword",
    name: "Test User",
    position: PositionEnum.DEFENDER,
  };
}

export function makeSignupInputAfterHashMock(): CreateUserDTO {
  return {
    email: "test@example.com",
    hashedPassword: "hashedPassword",
    name: "Test User",
    position: PositionEnum.DEFENDER,
  };
}

export function makeSigninInputMock(): SigninDto {
  return {
    email: "test@example.com",
    password: "plainPassword",
  };
}

export function makeVerifyEmailInputMock(): VerifyEmailDto {
  return {
    token: "some-token",
  };
}

export function makeResendVerificationInputMock(): ResendVerificationDto {
  return {
    email: "test@example.com",
  };
}

export function makeForgotPasswordInputMock(): ForgotPasswordDto {
  return {
    email: "test@example.com",
  };
}

export function makeResetPasswordInputMock(): ResetPasswordDto {
  return {
    token: "some-token",
    password: "newPassword",
  };
}

export function makeVerificationTokenMock(
  overrides?: Partial<VerificationToken>,
): VerificationToken {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    type: VerificationTokenType.EMAIL_VERIFICATION,
    tokenHash: "tokenHash",
    newEmail: null,
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}
