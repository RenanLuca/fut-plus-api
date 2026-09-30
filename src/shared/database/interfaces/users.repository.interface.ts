import { PositionEnum } from "@src/shared/enum/positionEnum";

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export type User = {
  id: string;
  email: string;
  name: string;
  telefone: string | null;
  hashedPassword: string;
  position: PositionEnum;
  profilePicture: string | null;
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserDTO = {
  email: string;
  name: string;
  hashedPassword: string;
  position: PositionEnum;
};

export type UpdateUserDTO = Partial<
  Pick<
    User,
    | "name"
    | "telefone"
    | "position"
    | "profilePicture"
    | "hashedPassword"
    | "passwordChangedAt"
    | "emailVerifiedAt"
    | "email"
    | "emailNotifications"
  >
>;

export interface IUsersRepository {
  create(data: CreateUserDTO): Promise<User>;

  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;

  /**
   * Just the one field AuthGuard checks on every authenticated request —
   * avoids pulling the full row (hashedPassword included) into memory on
   * every call.
   */
  findPasswordChangedAtById(
    id: string,
  ): Promise<{ passwordChangedAt: Date | null } | null>;

  update(id: string, data: UpdateUserDTO): Promise<User>;

  delete(id: string): Promise<User>;
}
