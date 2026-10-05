import { describe, it, expect } from "vitest";
import {
  BRAZIL_UTC_OFFSET_HOURS,
  getBrazilCalendarDate,
  getBrazilCurrentMonthStart,
} from "@src/shared/utils/brazil-date";

describe("brazil-date", () => {
  describe("getBrazilCalendarDate", () => {
    it("should shift a UTC instant back by the Brazil offset", () => {
      const utc = new Date("2026-01-10T15:30:00.000Z");

      const brazil = getBrazilCalendarDate(utc);

      expect(brazil.toISOString()).toBe("2026-01-10T12:30:00.000Z");
    });

    it("should cross into the previous day when UTC is early in the morning", () => {
      const utc = new Date("2026-01-10T01:00:00.000Z");

      const brazil = getBrazilCalendarDate(utc);

      expect(brazil.toISOString()).toBe("2026-01-09T22:00:00.000Z");
    });

    it("should use the configured offset", () => {
      expect(BRAZIL_UTC_OFFSET_HOURS).toBe(3);
    });
  });

  describe("getBrazilCurrentMonthStart", () => {
    it("should return the first day of the current month in Brazil", () => {
      const utc = new Date("2026-03-15T12:00:00.000Z");

      expect(getBrazilCurrentMonthStart(utc).toISOString()).toBe(
        "2026-03-01T00:00:00.000Z",
      );
    });

    it("should stay in the previous month when it is already next month in UTC but not yet in Brazil", () => {
      const utc = new Date("2026-02-01T02:00:00.000Z");

      expect(getBrazilCurrentMonthStart(utc).toISOString()).toBe(
        "2026-01-01T00:00:00.000Z",
      );
    });
  });
});
