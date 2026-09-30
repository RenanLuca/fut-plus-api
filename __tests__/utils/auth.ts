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
import { hash } from "bcryptjs";

const email = "test@example.com";
const password = "hashedPassword";
const newPassword = "newPassword123";
const name = "Test User";
const token = "some-token";

export function makeSignupOutputMock(
  overrides?: Partial<User>,
): User {
  return {
    id: randomUUID(),
    email,
    createdAt: new Date(),
    emailNotifications: true,
    emailVerifiedAt: new Date(),
    hashedPassword: password,
    name,
    updatedAt: new Date(),
    passwordChangedAt: new Date(),
    profilePicture: "profilePictureUrl",
    telefone: "123-456-7890",
    position: PositionEnum.DEFENDER,
    ...overrides,
  };
}

export function makeSignupInputMock(
  overrides?: Partial<SignupDto>,
): SignupDto {
  return {
    email,
    password,
    name,
    position: PositionEnum.DEFENDER,
    ...overrides,
  };
}

export function makeSignupInputAfterHashMock(
  overrides?: Partial<CreateUserDTO>,
): CreateUserDTO {
  return {
    email,
    hashedPassword: password,
    name,
    position: PositionEnum.DEFENDER,
    ...overrides,
  };
}

export function makeSigninInputMock(
  overrides?: Partial<SigninDto>,
): SigninDto {
  return {
    email,
    password,
    ...overrides,
  };
}

export function makeVerifyEmailInputMock(
  overrides?: Partial<VerifyEmailDto>,
): VerifyEmailDto {
  return {
    token,
    ...overrides,
  };
}

export function makeResendVerificationInputMock(
  overrides?: Partial<ResendVerificationDto>,
): ResendVerificationDto {
  return {
    email,
    ...overrides,
  };
}

export function makeForgotPasswordInputMock(
  overrides?: Partial<ForgotPasswordDto>,
): ForgotPasswordDto {
  return {
    email,
    ...overrides,
  };
}

export function makeResetPasswordInputMock(
  overrides?: Partial<ResetPasswordDto>,
): ResetPasswordDto {
  return {
    token,
    password: newPassword,
    ...overrides,
  };
}

export async function makeCreateUserDTOWithRealHashMock(
  overrides?: Partial<CreateUserDTO>,
): Promise<CreateUserDTO> {
  const hashedPassword = await hash(password, 10);
  return {
    email,
    name,
    position: PositionEnum.DEFENDER,
    hashedPassword,
    ...overrides,
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

// Canonical copies of what AuthService responds with on success. Tests
// assert against these instead of duplicating the literal string, so a
// copy change in the service only needs updating here.
export const verificationEmailSentResponse = {
  message: "Verification email sent",
};
export const emailVerifiedResponse = { message: "Email verified" };
export const resendVerificationResponse = {
  message:
    "If the account exists and is unverified, an email was sent",
};
export const forgotPasswordResponse = {
  message: "If the account exists, a reset email was sent",
};
export const passwordResetResponse = { message: "Password reset" };
