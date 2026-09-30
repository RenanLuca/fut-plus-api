import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { USERS_REPOSITORY } from "@src/shared/database/interfaces/users.repository.interface";
import type { IUsersRepository } from "@src/shared/database/interfaces/users.repository.interface";
import { SigninDto } from "../dto/signin.dto";
import { SignupDto } from "../dto/signup.dto";
import { VerifyEmailDto } from "../dto/verifyEmail.dto";
import { ResendVerificationDto } from "../dto/resendVerification.dto";
import { ForgotPasswordDto } from "../dto/forgotPassword.dto";
import { ResetPasswordDto } from "../dto/resetPassword.dto";
import { resetPasswordTemplate } from "@src/modules/mail/templates/reset-password.template";
import { passwordChangedTemplate } from "@src/modules/mail/templates/password-changed.template";
import { compare, hash } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { env } from "@src/shared/config/env";
import { MAIL_SERVICE } from "@src/modules/mail/interfaces/mail.service.interface";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import { verifyEmailTemplate } from "@src/modules/mail/templates/verify-email.template";
import { welcomeTemplate } from "@src/modules/mail/templates/welcome.template";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "../constants/tokenTtl";
import { VerificationTokensService } from "./verification-tokens.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
    private readonly verificationTokensService: VerificationTokensService,
  ) {}

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await compare(
      password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Checked only after the password, so an unverified account isn't
    // revealed to someone who doesn't know its password.
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Email not verified");
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name, position } = signupDto;

    const existingUser =
      await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashedPassword = await this.hashPassword(password, 10);

    const user = await this.usersRepository.create({
      email: email,
      hashedPassword: hashedPassword,
      name: name,
      position: position,
    });

    await this.sendVerificationEmail(user);

    return { message: "Verification email sent" };
  }

  async verifyEmail({ token }: VerifyEmailDto) {
    const { userId } =
      await this.verificationTokensService.consume(
        token,
        VerificationTokenType.EMAIL_VERIFICATION,
      );

    const user = await this.usersRepository.findById(userId);
    if (!user || user.emailVerifiedAt) {
      return { message: "Email verified" };
    }

    await this.usersRepository.update(userId, {
      emailVerifiedAt: new Date(),
    });

    void this.mailService.send({
      to: user.email,
      ...welcomeTemplate({
        name: user.name,
        url: env.frontendUrl,
      }),
    });

    return { message: "Email verified" };
  }

  async resendVerification({ email }: ResendVerificationDto) {
    const user = await this.usersRepository.findByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.sendVerificationEmail(user);
    }

    // Same answer whether or not the account exists, so this route can't
    // be used to discover which emails are registered.
    return {
      message:
        "If the account exists and is unverified, an email was sent",
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      const token = await this.verificationTokensService.issue({
        userId: user.id,
        type: VerificationTokenType.PASSWORD_RESET,
        ttlMs: PASSWORD_RESET_TOKEN_TTL_MS,
      });

      void this.mailService.send({
        to: user.email,
        ...resetPasswordTemplate({
          name: user.name,
          url: `${env.frontendUrl}/reset-password?token=${token}`,
        }),
      });
    }

    // Same answer whether or not the account exists (see resendVerification).
    return {
      message: "If the account exists, a reset email was sent",
    };
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    const { userId } =
      await this.verificationTokensService.consume(
        token,
        VerificationTokenType.PASSWORD_RESET,
      );

    const hashedPassword = await this.hashPassword(password, 10);
    const user = await this.usersRepository.update(userId, {
      hashedPassword,
      passwordChangedAt: new Date(),
    });

    void this.mailService.send({
      to: user.email,
      ...passwordChangedTemplate({ name: user.name }),
    });

    return { message: "Password reset" };
  }

  async generateAccessToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  private async sendVerificationEmail(user: {
    id: string;
    name: string;
    email: string;
  }) {
    const token = await this.verificationTokensService.issue({
      userId: user.id,
      type: VerificationTokenType.EMAIL_VERIFICATION,
      ttlMs: EMAIL_VERIFICATION_TOKEN_TTL_MS,
    });

    void this.mailService.send({
      to: user.email,
      ...verifyEmailTemplate({
        name: user.name,
        url: `${env.frontendUrl}/verify-email?token=${token}`,
      }),
    });
  }

  private async hashPassword(
    password: string,
    salt: number,
  ): Promise<string> {
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }
}
