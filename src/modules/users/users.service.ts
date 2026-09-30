import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { USERS_REPOSITORY } from "@src/shared/database/interfaces/users.repository.interface";
import type { IUsersRepository } from "@src/shared/database/interfaces/users.repository.interface";
import { GROUP_MATCHES_REPOSITORY } from "@src/shared/database/interfaces/group-matches.repository.interface";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import { compare, hash } from "bcryptjs";
import { env } from "@src/shared/config/env";
import { AuthService } from "@src/modules/auth/services/auth.service";
import { VerificationTokensService } from "@src/modules/auth/services/verification-tokens.service";
import { EMAIL_CHANGE_TOKEN_TTL_MS } from "@src/modules/auth/constants/tokenTtl";
import { MAIL_SERVICE } from "@src/modules/mail/interfaces/mail.service.interface";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import { changeEmailTemplate } from "@src/modules/mail/templates/change-email.template";
import { emailChangedTemplate } from "@src/modules/mail/templates/email-changed.template";
import { passwordChangedTemplate } from "@src/modules/mail/templates/password-changed.template";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";
import { UpdateUserDto } from "./dto/updateUser.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { ChangeEmailDto } from "./dto/changeEmail.dto";
import { ConfirmEmailChangeDto } from "./dto/confirmEmailChange.dto";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(GROUP_MATCHES_REPOSITORY)
    private readonly groupMatchesRepository: IGroupMatchesRepository,
    private readonly authService: AuthService,
    private readonly verificationTokensService: VerificationTokensService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}
  async checkIfUserExists(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  private async checkEmailAvailability(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      throw new ConflictException("Email is already in use");
    }
  }

  async getUserById(userId: string) {
    const user = await this.checkIfUserExists(userId);
    const { hashedPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    await this.checkIfUserExists(userId);
    const updatedUser = await this.usersRepository.update(
      userId,
      updateUserDto,
    );
    const { hashedPassword, ...userWithoutPassword } =
      updatedUser;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    { currentPassword, newPassword }: ChangePasswordDto,
  ) {
    const user = await this.checkIfUserExists(userId);
    await this.assertPasswordMatches(
      currentPassword,
      user.hashedPassword,
    );

    await this.usersRepository.update(userId, {
      hashedPassword: await hash(newPassword, 10),
      passwordChangedAt: new Date(),
    });

    void this.mailService.send({
      to: user.email,
      ...passwordChangedTemplate({ name: user.name }),
    });

    // Changing the password invalidates every token issued before it,
    // including the one used on this request, so hand back a fresh one.
    const accessToken =
      await this.authService.generateAccessToken(userId);
    return { accessToken };
  }

  async changeEmail(
    userId: string,
    { newEmail, password }: ChangeEmailDto,
  ) {
    const user = await this.checkIfUserExists(userId);
    await this.assertPasswordMatches(
      password,
      user.hashedPassword,
    );

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new BadRequestException(
        "New email must be different from the current one",
      );
    }
    await this.checkEmailAvailability(newEmail);

    const token = await this.verificationTokensService.issue({
      userId,
      type: VerificationTokenType.EMAIL_CHANGE,
      ttlMs: EMAIL_CHANGE_TOKEN_TTL_MS,
      newEmail,
    });

    // Sent to the NEW address: only someone who controls it can confirm.
    void this.mailService.send({
      to: newEmail,
      ...changeEmailTemplate({
        name: user.name,
        url: `${env.frontendUrl}/confirm-email-change?token=${token}`,
      }),
    });

    return {
      message: "Confirmation email sent to the new address",
    };
  }

  async confirmEmailChange({ token }: ConfirmEmailChangeDto) {
    const { userId, newEmail } =
      await this.verificationTokensService.consume(
        token,
        VerificationTokenType.EMAIL_CHANGE,
      );
    if (!newEmail) {
      throw new BadRequestException("Invalid or expired token");
    }

    const user = await this.checkIfUserExists(userId);
    // Re-checked here: someone else may have taken the address between
    // the request and the confirmation.
    await this.checkEmailAvailability(newEmail);

    const updatedUser = await this.usersRepository.update(
      userId,
      {
        email: newEmail,
        emailVerifiedAt: new Date(),
      },
    );

    void this.mailService.send({
      to: user.email,
      ...emailChangedTemplate({ name: user.name, newEmail }),
    });

    const { hashedPassword, ...userWithoutPassword } =
      updatedUser;
    return userWithoutPassword;
  }

  private async assertPasswordMatches(
    password: string,
    hashedPassword: string,
  ) {
    // 400 instead of 401: a 401 makes most clients treat the session as
    // expired and log the user out over a simple typo.
    const isValid = await compare(password, hashedPassword);
    if (!isValid) {
      throw new BadRequestException("Incorrect password");
    }
  }

  async delete(userId: string) {
    await this.checkIfUserExists(userId);
    return this.usersRepository.delete(userId);
  }

  async getUpcomingMatch(userId: string) {
    return this.groupMatchesRepository.findUpcomingByUserId(
      userId,
    );
  }
}
