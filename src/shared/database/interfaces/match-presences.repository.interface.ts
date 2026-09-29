export const MATCH_PRESENCES_REPOSITORY = Symbol(
  "MATCH_PRESENCES_REPOSITORY",
);

export type GroupMatchPresence = {
  id: string;
  groupMatchId: string;
  isPresent: boolean;
  userId: string | null;
  guestUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PresenceSummary = {
  userId: string | null;
  guestUserId: string | null;
  isPresent: boolean;
};

export interface IMatchPresencesRepository {
  findAllByGroupMatchId(
    groupMatchId: string,
  ): Promise<PresenceSummary[]>;

  /**
   * Creates the presence row if it doesn't exist yet, or flips
   * `isPresent` if it does — a member can change their RSVP.
   */
  setUserPresence(
    groupMatchId: string,
    userId: string,
    isPresent: boolean,
  ): Promise<void>;

  /**
   * The user's presence for the match, together with the match's date
   * (needed to tell whether the match has already happened).
   */
  findByMatchAndUserWithMatchDate(
    groupMatchId: string,
    userId: string,
  ): Promise<{ isPresent: boolean; matchDate: Date } | null>;
}
