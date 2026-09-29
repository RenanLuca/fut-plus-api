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

export interface IUsersRepository {
  create(data: {
    email: string;
    name: string;
    hashedPassword: string;
    position: PositionEnum;
  }): Promise<User>;

  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;

  update(
    id: string,
    data: Partial<
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
    >,
  ): Promise<User>;

  delete(id: string): Promise<User>;
}
