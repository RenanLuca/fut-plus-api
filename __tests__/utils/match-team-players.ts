import { MatchTeamPlayer } from "@src/shared/database/interfaces/match-team-players.repository.interface";
import { MatchTeamPlayerDto } from "@src/modules/match-team-players/dto/match-team-player.dto";
import { MatchTeamRosterDto } from "@src/modules/match-team-players/dto/match-team-roster.dto";
import { randomUUID } from "crypto";

export function makeMatchTeamPlayerMock(
  overrides?: Partial<MatchTeamPlayer>,
): MatchTeamPlayer {
  return {
    id: randomUUID(),
    matchTeamId: randomUUID(),
    groupMatchId: randomUUID(),
    userId: randomUUID(),
    guestUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeMatchTeamPlayerInputMock(
  overrides?: Partial<MatchTeamPlayerDto>,
): MatchTeamPlayerDto {
  return {
    userId: randomUUID(),
    ...overrides,
  };
}

export function makeMatchTeamRosterInputMock(
  overrides?: Partial<MatchTeamRosterDto>,
): MatchTeamRosterDto {
  return {
    matchTeamId: randomUUID(),
    players: [makeMatchTeamPlayerInputMock()],
    ...overrides,
  };
}
