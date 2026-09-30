import {
  GroupMatch,
  UpcomingMatchForUser,
} from "@src/shared/database/interfaces/group-matches.repository.interface";
import { CreateGroupMatchDto } from "@src/modules/group-matches/dto/create-group-match.dto";
import { randomUUID } from "crypto";

export function makeGroupMatchMock(
  overrides?: Partial<GroupMatch>,
): GroupMatch {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    matchDate: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeUpcomingMatchForUserMock(
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

export function makeCreateGroupMatchInputMock(
  overrides?: Partial<CreateGroupMatchDto>,
): CreateGroupMatchDto {
  return {
    matchDate: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}
