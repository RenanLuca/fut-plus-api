import { Group } from "@src/shared/database/interfaces/groups.repository.interface";
import {
  GroupMember,
  GroupMemberWithUser,
  MemberWithNotificationEmail,
} from "@src/shared/database/interfaces/group-members.repository.interface";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { CreateGroupDto } from "@src/modules/groups/dto/create-group.dto";
import { UpdateGroupDto } from "@src/modules/groups/dto/update-group.dto";
import { TransferOwnershipDto } from "@src/modules/groups/dto/transfer-ownership.dto";
import { Weekday } from "@src/shared/enum/weekday";
import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { UserRank } from "@src/shared/enum/userRank";
import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { randomUUID } from "crypto";

export function makeGroupMock(overrides?: Partial<Group>): Group {
  return {
    id: randomUUID(),
    name: "Pelada de Sexta",
    ownerId: randomUUID(),
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeCreateGroupInputMock(
  overrides?: Partial<CreateGroupDto>,
): CreateGroupDto {
  return {
    name: "Pelada de Sexta",
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 20,
    rank: UserRank.BRASILEIRAO,
    ...overrides,
  };
}

export function makeUpdateGroupInputMock(
  overrides?: Partial<UpdateGroupDto>,
): UpdateGroupDto {
  return {
    name: "Pelada de Sexta Atualizada",
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 20,
    ...overrides,
  };
}

export function makeTransferOwnershipInputMock(
  overrides?: Partial<TransferOwnershipDto>,
): TransferOwnershipDto {
  return {
    newOwnerId: randomUUID(),
    ...overrides,
  };
}

export function makeGroupMemberMock(
  overrides?: Partial<GroupMember>,
): GroupMember {
  return {
    id: randomUUID(),
    groupId: randomUUID(),
    userId: randomUUID(),
    type: GroupMemberType.MONTHLY,
    rank: UserRank.BRASILEIRAO,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeGroupMemberWithUserMock(
  overrides?: Partial<GroupMemberWithUser>,
): GroupMemberWithUser {
  return {
    ...makeGroupMemberMock(),
    user: {
      id: randomUUID(),
      name: "Member Name",
      position: PositionEnum.DEFENDER,
      profilePicture: null,
    },
    ...overrides,
  };
}

export function makeMemberWithNotificationEmailMock(
  overrides?: Partial<MemberWithNotificationEmail>,
): MemberWithNotificationEmail {
  return {
    ...makeGroupMemberMock(),
    user: {
      name: "Member Name",
      email: "member@example.com",
    },
    ...overrides,
  };
}
