import {
  MatchTeam,
  MatchTeamWithPlayers,
} from "@src/shared/database/interfaces/match-teams.repository.interface";
import { ConfirmedMemberForBalancing } from "@src/modules/match-teams/utils/match-teams-balancer";
import { CreateMatchTeamDto } from "@src/modules/match-teams/dto/create-match-team.dto";
import { UpdateMatchTeamDto } from "@src/modules/match-teams/dto/update-match-team.dto";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { randomUUID } from "crypto";

export function makeMatchTeamMock(
  overrides?: Partial<MatchTeam>,
): MatchTeam {
  return {
    id: randomUUID(),
    groupMatchId: randomUUID(),
    name: "Time 1",
    color: "#FFFFFF",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeMatchTeamWithPlayersMock(
  overrides?: Partial<MatchTeamWithPlayers>,
): MatchTeamWithPlayers {
  return {
    ...makeMatchTeamMock(),
    matchTeamPlayers: [],
    ...overrides,
  };
}

export function makeCreateMatchTeamInputMock(
  overrides?: Partial<CreateMatchTeamDto>,
): CreateMatchTeamDto {
  return {
    name: "Time 1",
    color: "#FFFFFF",
    ...overrides,
  };
}

export function makeUpdateMatchTeamInputMock(
  overrides?: Partial<UpdateMatchTeamDto>,
): UpdateMatchTeamDto {
  return {
    name: "Time Atualizado",
    ...overrides,
  };
}

export function makeConfirmedMemberForBalancingMock(
  overrides?: Partial<ConfirmedMemberForBalancing>,
): ConfirmedMemberForBalancing {
  return {
    userId: randomUUID(),
    guestUserId: null,
    rank: UserRank.BRASILEIRAO,
    position: PositionEnum.DEFENDER,
    ...overrides,
  };
}
