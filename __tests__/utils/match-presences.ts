import { PresenceSummary } from "@src/shared/database/interfaces/match-presences.repository.interface";
import { UpdateMatchPresenceDto } from "@src/modules/match-presences/dto/updateMatchPresence.dto";

export function makePresenceSummaryMock(
  overrides?: Partial<PresenceSummary>,
): PresenceSummary {
  return {
    userId: "user-id",
    guestUserId: null,
    isPresent: true,
    ...overrides,
  };
}

export function makeUpdateMatchPresenceInputMock(
  overrides?: Partial<UpdateMatchPresenceDto>,
): UpdateMatchPresenceDto {
  return {
    isPresent: true,
    ...overrides,
  };
}
