import { mock } from "vitest-mock-extended";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { GroupMatchesSchedulerService } from "@src/modules/group-matches/services/group-matches-scheduler.service";
import { GroupsService } from "@src/modules/groups/services/groups.service";
import { GroupMatchesService } from "@src/modules/group-matches/services/group-matches.service";
import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { Weekday } from "@src/shared/enum/weekday";
import { ConflictException } from "@nestjs/common";
import { makeGroupMock } from "../../utils/groups";
import { makeGroupMatchMock } from "../../utils/group-matches";

const groupsServiceMock = mock<GroupsService>();
const groupMatchesServiceMock = mock<GroupMatchesService>();

// A fixed "now" makes the 5-day-ahead target date (and its weekday)
// deterministic: 2026-01-01T00:00:00Z is a Brazil-local Wednesday
// night (Dec 31), so 5 days ahead lands on Monday, 2026-01-05.
const FAKE_NOW = new Date("2026-01-01T00:00:00.000Z");
const TARGET_WEEKDAY = Weekday.MONDAY;
const EXPECTED_MATCH_DATE_UTC = "2026-01-05T23:00:00.000Z";

let sut: GroupMatchesSchedulerService;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FAKE_NOW);
  sut = new GroupMatchesSchedulerService(
    groupsServiceMock,
    groupMatchesServiceMock,
  );
  groupMatchesServiceMock.create.mockResolvedValue(
    makeGroupMatchMock(),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GroupMatchesSchedulerService", () => {
  describe("generateUpcomingMatches", () => {
    it("should generate a match only for monthly groups matching the target weekday", async () => {
      const matchingGroup = makeGroupMock({
        weekday: TARGET_WEEKDAY,
        hour: "20:00",
      });
      const otherWeekdayGroup = makeGroupMock({
        weekday: Weekday.FRIDAY,
      });
      groupsServiceMock.findAllByFrequency.mockResolvedValueOnce([
        matchingGroup,
        otherWeekdayGroup,
      ]);

      await sut.generateUpcomingMatches();

      expect(
        groupsServiceMock.findAllByFrequency,
      ).toHaveBeenCalledWith(FrequencyType.MONTHLY);
      expect(groupMatchesServiceMock.create).toHaveBeenCalledTimes(
        1,
      );
      expect(groupMatchesServiceMock.create).toHaveBeenCalledWith(
        matchingGroup.id,
        { matchDate: EXPECTED_MATCH_DATE_UTC },
      );
    });

    it("should not throw if a match already exists for that group and date", async () => {
      const matchingGroup = makeGroupMock({
        weekday: TARGET_WEEKDAY,
      });
      groupsServiceMock.findAllByFrequency.mockResolvedValueOnce([
        matchingGroup,
      ]);
      groupMatchesServiceMock.create.mockRejectedValueOnce(
        new ConflictException(
          "There's already a match scheduled for this date in this group",
        ),
      );

      await expect(
        sut.generateUpcomingMatches(),
      ).resolves.toBeUndefined();
    });

    it("should not throw if generating a match fails unexpectedly", async () => {
      const matchingGroup = makeGroupMock({
        weekday: TARGET_WEEKDAY,
      });
      groupsServiceMock.findAllByFrequency.mockResolvedValueOnce([
        matchingGroup,
      ]);
      groupMatchesServiceMock.create.mockRejectedValueOnce(
        new Error("Database is down"),
      );

      await expect(
        sut.generateUpcomingMatches(),
      ).resolves.toBeUndefined();
    });
  });
});
