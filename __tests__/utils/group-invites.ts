import {
  GroupInvite,
  GroupInviteWithGroup,
} from "@src/shared/database/interfaces/group-invites.repository.interface";
import { AcceptInviteDto } from "@src/modules/group-invites/dto/accept-invite.dto";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { UserRank } from "@src/shared/enum/userRank";
import { randomUUID } from "crypto";

export function makeGroupInviteMock(
  overrides?: Partial<GroupInvite>,
): GroupInvite {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    createdAt: new Date(),
    ...overrides,
  };
}

export function makeGroupInviteWithGroupMock(
  overrides?: Partial<GroupInviteWithGroup>,
): GroupInviteWithGroup {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    createdAt: new Date(),
    group: {
      id: randomUUID(),
      name: "Pelada de Sexta",
      weekday: "FRIDAY",
      hour: "20:00",
      frequency: "MONTHLY",
      valuePerUser: 20,
      owner: { name: "Owner Name" },
      _count: { groupMembers: 5 },
    },
    ...overrides,
  };
}

export function makeAcceptInviteInputMock(
  overrides?: Partial<AcceptInviteDto>,
): AcceptInviteDto {
  return {
    type: GroupMemberType.MONTHLY,
    rank: UserRank.BRASILEIRAO,
    ...overrides,
  };
}
