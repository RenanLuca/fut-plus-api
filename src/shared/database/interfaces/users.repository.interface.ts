export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export type User = {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
  passwordHash: string;
  position: string | null;
  profilePicture: string | null;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface IUsersRepository {
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    position?: string;
    profilePicture?: string;
  }): Promise<User>;

  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
  delete(id: string): Promise<User>;
}
