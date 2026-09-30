import { mock } from "vitest-mock-extended";
import type { IUsersRepository } from "@src/shared/database/interfaces/users.repository.interface";
import type { IGroupMatchesRepository } from "@src/shared/database/interfaces/group-matches.repository.interface";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import type { Mock } from "vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "@src/modules/auth/services/auth.service";
import { VerificationTokensService } from "@src/modules/auth/services/verification-tokens.service";
import { UsersService } from "@src/modules/users/users.service";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { compare } from "bcryptjs";
import { VerificationTokenType } from "@src/shared/enum/verificationTokenType";
import {
  makeSignupOutputMock,
  makeVerificationTokenMock,
} from "../../utils/auth";
import {
  makeUpdateUserDtoMock,
  makeChangePasswordDtoMock,
  makeChangeEmailDtoMock,
  makeConfirmEmailChangeDtoMock,
  makeUpcomingMatchMock,
  emailChangeConfirmationSentResponse,
} from "../../utils/users";

const usersRepoMock = mock<IUsersRepository>();
const groupMatchesRepoMock = mock<IGroupMatchesRepository>();
const authServiceMock = mock<AuthService>();
const verificationTokensServiceMock =
  mock<VerificationTokensService>();
const mailServiceMock = mock<IMailService>();

// vi.mock's factory is hoisted above every other declaration in this
// file, so the value it needs must be created through vi.hoisted() to
// exist by then too — a plain const wouldn't be initialized yet.
const { mockedHashedPassword } = vi.hoisted(() => ({
  mockedHashedPassword: "hashedPassword",
}));
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue(mockedHashedPassword),
  compare: vi.fn().mockResolvedValue(true),
}));

// bcryptjs's `compare` is overloaded (a callback variant returning `void`
// alongside the promise-based one); vi.mocked() picks up the callback
// overload, so we cast to the shape we actually mock.
const compareMock = compare as unknown as Mock<
  (password: string, hash: string) => Promise<boolean>
>;

let sut: UsersService;
beforeEach(() => {
  sut = new UsersService(
    usersRepoMock,
    groupMatchesRepoMock,
    authServiceMock,
    verificationTokensServiceMock,
    mailServiceMock,
  );
  usersRepoMock.findById.mockResolvedValue(makeSignupOutputMock());
  usersRepoMock.findByEmail.mockResolvedValue(null);
  compareMock.mockResolvedValue(true);
});

describe("UsersService", () => {
  describe("checkIfUserExists", () => {
    it("should return the user when found", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);

      const response = await sut.checkIfUserExists(user.id);

      expect(response).toEqual(user);
    });

    it("should throw NotFoundException when the user does not exist", async () => {
      usersRepoMock.findById.mockResolvedValueOnce(null);

      const promiseResult = sut.checkIfUserExists("any-id");

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getUserById", () => {
    it("should return the user without the hashed password", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);

      const response = await sut.getUserById(user.id);

      expect(response).not.toHaveProperty("hashedPassword");
      expect(response).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      );
    });
  });

  describe("update", () => {
    it("should update the user and return it without the hashed password", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.update.mockResolvedValueOnce(user);

      const response = await sut.update(
        user.id,
        makeUpdateUserDtoMock(),
      );

      expect(usersRepoMock.update).toHaveBeenCalledWith(
        user.id,
        makeUpdateUserDtoMock(),
      );
      expect(response).not.toHaveProperty("hashedPassword");
    });

    it("should throw NotFoundException if the user does not exist", async () => {
      usersRepoMock.findById.mockResolvedValueOnce(null);

      const promiseResult = sut.update(
        "any-id",
        makeUpdateUserDtoMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("should update the password, notify the user and return a fresh access token", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      authServiceMock.generateAccessToken.mockResolvedValueOnce(
        "access-token",
      );

      const response = await sut.changePassword(
        user.id,
        makeChangePasswordDtoMock(),
      );

      expect(usersRepoMock.update).toHaveBeenCalledWith(user.id, {
        hashedPassword: mockedHashedPassword,
        passwordChangedAt: expect.any(Date),
      });
      expect(mailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email }),
      );
      expect(
        authServiceMock.generateAccessToken,
      ).toHaveBeenCalledWith(user.id);
      expect(response).toEqual({ accessToken: "access-token" });
    });

    it("should throw BadRequestException if the current password does not match", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(false);

      const promiseResult = sut.changePassword(
        user.id,
        makeChangePasswordDtoMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("changeEmail", () => {
    it("should issue a token and send a confirmation email to the new address", async () => {
      const user = makeSignupOutputMock();
      const changeEmailDto = makeChangeEmailDtoMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      verificationTokensServiceMock.issue.mockResolvedValueOnce(
        "change-email-token",
      );

      const response = await sut.changeEmail(
        user.id,
        changeEmailDto,
      );

      expect(
        verificationTokensServiceMock.issue,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          type: VerificationTokenType.EMAIL_CHANGE,
          newEmail: changeEmailDto.newEmail,
        }),
      );
      expect(mailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: changeEmailDto.newEmail }),
      );
      expect(response).toEqual(emailChangeConfirmationSentResponse);
    });

    it("should throw BadRequestException if the password does not match", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(false);

      const promiseResult = sut.changeEmail(
        user.id,
        makeChangeEmailDtoMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if the new email is the same as the current one", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);

      const promiseResult = sut.changeEmail(
        user.id,
        makeChangeEmailDtoMock({
          newEmail: user.email.toUpperCase(),
        }),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw ConflictException if the new email is already taken", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock({
          email: "someone-else@example.com",
        }),
      );

      const promiseResult = sut.changeEmail(
        user.id,
        makeChangeEmailDtoMock({
          newEmail: "someone-else@example.com",
        }),
      );

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("confirmEmailChange", () => {
    it("should update the email and notify the old address", async () => {
      const user = makeSignupOutputMock();
      const tokenRecord = makeVerificationTokenMock({
        userId: user.id,
        newEmail: "new-email@example.com",
      });
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        tokenRecord,
      );
      usersRepoMock.findById.mockResolvedValueOnce(user);
      usersRepoMock.update.mockResolvedValueOnce({
        ...user,
        email: tokenRecord.newEmail!,
      });

      const response = await sut.confirmEmailChange(
        makeConfirmEmailChangeDtoMock(),
      );

      expect(usersRepoMock.update).toHaveBeenCalledWith(user.id, {
        email: tokenRecord.newEmail,
        emailVerifiedAt: expect.any(Date),
      });
      expect(mailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: user.email }),
      );
      expect(response).not.toHaveProperty("hashedPassword");
    });

    it("should throw BadRequestException if the token has no new email", async () => {
      const tokenRecord = makeVerificationTokenMock({
        newEmail: null,
      });
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        tokenRecord,
      );

      const promiseResult = sut.confirmEmailChange(
        makeConfirmEmailChangeDtoMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepoMock.update).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if the new email was taken meanwhile", async () => {
      const user = makeSignupOutputMock();
      const tokenRecord = makeVerificationTokenMock({
        userId: user.id,
        newEmail: "new-email@example.com",
      });
      verificationTokensServiceMock.consume.mockResolvedValueOnce(
        tokenRecord,
      );
      usersRepoMock.findById.mockResolvedValueOnce(user);
      usersRepoMock.findByEmail.mockResolvedValueOnce(
        makeSignupOutputMock({ email: "new-email@example.com" }),
      );

      const promiseResult = sut.confirmEmailChange(
        makeConfirmEmailChangeDtoMock(),
      );

      await expect(promiseResult).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("delete", () => {
    it("should delete the user", async () => {
      const user = makeSignupOutputMock();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      usersRepoMock.delete.mockResolvedValueOnce(user);

      const response = await sut.delete(user.id);

      expect(usersRepoMock.delete).toHaveBeenCalledWith(user.id);
      expect(response).toEqual(user);
    });
  });

  describe("getUpcomingMatch", () => {
    it("should return the upcoming match for the user", async () => {
      const match = makeUpcomingMatchMock();
      groupMatchesRepoMock.findUpcomingByUserId.mockResolvedValueOnce(
        match,
      );

      const response = await sut.getUpcomingMatch("user-id");

      expect(
        groupMatchesRepoMock.findUpcomingByUserId,
      ).toHaveBeenCalledWith("user-id");
      expect(response).toEqual(match);
    });

    it("should return null if there is no upcoming match", async () => {
      groupMatchesRepoMock.findUpcomingByUserId.mockResolvedValueOnce(
        null,
      );

      const response = await sut.getUpcomingMatch("user-id");

      expect(response).toBeNull();
    });
  });
});
