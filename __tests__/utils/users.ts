import { UpdateUserDto } from "@src/modules/users/dto/updateUser.dto";
import { ChangePasswordDto } from "@src/modules/users/dto/changePassword.dto";
import { ChangeEmailDto } from "@src/modules/users/dto/changeEmail.dto";
import { ConfirmEmailChangeDto } from "@src/modules/users/dto/confirmEmailChange.dto";
import { UpcomingMatchForUser } from "@src/shared/database/interfaces/group-matches.repository.interface";
import { randomUUID } from "crypto";

const currentPassword = "currentPassword";
const newPassword = "newPassword123";
const newEmail = "new-email@example.com";
const token = "some-token";

export function makeUpdateUserDtoMock(
  overrides?: Partial<UpdateUserDto>,
): UpdateUserDto {
  return {
    name: "Updated Name",
    ...overrides,
  };
}

export function makeChangePasswordDtoMock(
  overrides?: Partial<ChangePasswordDto>,
): ChangePasswordDto {
  return {
    currentPassword,
    newPassword,
    ...overrides,
  };
}

export function makeChangeEmailDtoMock(
  overrides?: Partial<ChangeEmailDto>,
): ChangeEmailDto {
  return {
    newEmail,
    password: currentPassword,
    ...overrides,
  };
}

export function makeConfirmEmailChangeDtoMock(
  overrides?: Partial<ConfirmEmailChangeDto>,
): ConfirmEmailChangeDto {
  return {
    token,
    ...overrides,
  };
}

export function makeUpcomingMatchMock(
  overrides?: Partial<UpcomingMatchForUser>,
): UpcomingMatchForUser {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    matchDate: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    group: {
      id: randomUUID(),
      name: "Pelada de Sexta",
      valuePerUser: 20,
    },
    ...overrides,
  };
}

// Canonical copies of what UsersService responds with on success. Tests
// assert against these instead of duplicating the literal string.
export const emailChangeConfirmationSentResponse = {
  message: "Confirmation email sent to the new address",
};
