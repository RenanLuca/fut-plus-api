import { describe, it, expect } from "vitest";
import {
  buildPaginationMeta,
  getSkip,
} from "@src/shared/utils/pagination";

describe("pagination", () => {
  describe("getSkip", () => {
    it("should skip nothing on the first page", () => {
      expect(getSkip(1, 10)).toBe(0);
    });

    it("should skip one full page per page already passed", () => {
      expect(getSkip(3, 10)).toBe(20);
    });
  });

  describe("buildPaginationMeta", () => {
    it("should round the total pages up", () => {
      expect(buildPaginationMeta(1, 10, 21)).toEqual({
        page: 1,
        limit: 10,
        total: 21,
        totalPages: 3,
      });
    });

    it("should report zero pages for an empty result", () => {
      expect(buildPaginationMeta(1, 10, 0).totalPages).toBe(0);
    });
  });
});
