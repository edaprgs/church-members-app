import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  fmtDate,
  fmtShort,
  getAge,
  getAgeGroup,
  getYearsMarried,
  mmdd,
  getInitials,
  fullName,
  displayName,
  titleCase,
  formatMobile,
  escapeCSV,
  getZone,
} from "./utils";

describe("fmtDate", () => {
  it("returns an em dash for empty input", () => {
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate("")).toBe("—");
  });

  it("returns an em dash for an invalid date string", () => {
    expect(fmtDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date", () => {
    expect(fmtDate("2024-03-15")).toBe("March 15, 2024");
  });
});

describe("fmtShort", () => {
  it("formats month and day only", () => {
    expect(fmtShort("2024-03-15")).toBe("Mar 15");
  });
});

describe("getAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes age correctly when the birthday has already passed this year", () => {
    expect(getAge("1994-01-01")).toBe(30);
  });

  it("subtracts one year when the birthday hasn't occurred yet this year", () => {
    expect(getAge("1994-12-31")).toBe(29);
  });

  it("handles a birthday that falls exactly today", () => {
    expect(getAge("1994-06-15")).toBe(30);
  });
});

describe("getAgeGroup", () => {
  it("classifies ages into the correct bucket", () => {
    expect(getAgeGroup(5)).toBe("Children");
    expect(getAgeGroup(12)).toBe("Children");
    expect(getAgeGroup(13)).toBe("Youth");
    expect(getAgeGroup(30)).toBe("Youth");
    expect(getAgeGroup(31)).toBe("Adult");
    expect(getAgeGroup(59)).toBe("Adult");
    expect(getAgeGroup(60)).toBe("Senior");
  });
});

describe("getYearsMarried", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes full years since the wedding date", () => {
    expect(getYearsMarried("2019-01-01")).toBe(5);
  });

  it("doesn't count the current year if the anniversary hasn't occurred yet", () => {
    expect(getYearsMarried("2019-12-31")).toBe(4);
  });
});

describe("mmdd", () => {
  it("encodes month and day for sorting", () => {
    expect(mmdd("2024-01-05")).toBe(105);
    expect(mmdd("2024-12-25")).toBe(1225);
  });
});

describe("getInitials", () => {
  it("returns uppercase first letters", () => {
    expect(getInitials("juan", "dela cruz")).toBe("JD");
  });

  it("handles missing names gracefully", () => {
    expect(getInitials("", "")).toBe("");
    expect(getInitials(undefined as unknown as string, "cruz")).toBe("C");
  });
});

describe("fullName / displayName", () => {
  const m = { first_name: "Juan", middle_name: "Santos", last_name: "Dela Cruz", suffix: "Jr." };

  it("fullName puts last name first", () => {
    expect(fullName(m)).toBe("Dela Cruz Juan Santos Jr.");
  });

  it("displayName puts first name first", () => {
    expect(displayName(m)).toBe("Juan Santos Dela Cruz Jr.");
  });

  it("handles missing fields without stray whitespace at the edges", () => {
    expect(fullName({ first_name: "Juan" })).toBe("Juan");
    expect(displayName({ last_name: "Cruz" })).toBe("Cruz");
  });
});

describe("titleCase", () => {
  it("capitalizes the first letter of each word", () => {
    expect(titleCase("juan dela cruz")).toBe("Juan Dela Cruz");
  });

  it("capitalizes after a hyphen", () => {
    expect(titleCase("mary-jane")).toBe("Mary-Jane");
  });

  it("does not capitalize after an apostrophe", () => {
    expect(titleCase("o'brien")).toBe("O'brien");
  });
});

describe("formatMobile", () => {
  it("strips non-digits and caps at 10 characters", () => {
    expect(formatMobile("0917-123-4567")).toBe("0917123456");
  });

  it("leaves a short numeric string untouched", () => {
    expect(formatMobile("0917")).toBe("0917");
  });
});

describe("escapeCSV", () => {
  it("wraps values in quotes", () => {
    expect(escapeCSV("hello")).toBe('"hello"');
  });

  it("escapes embedded quotes by doubling them", () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });

  it("returns an empty string for null/undefined", () => {
    expect(escapeCSV(null)).toBe("");
    expect(escapeCSV(undefined)).toBe("");
  });
});

describe("getZone", () => {
  it("matches an address to Zone 1", () => {
    expect(getZone("123 Poblacion Street")).toBe("Zone 1");
  });

  it("matches an address to Zone 2", () => {
    expect(getZone("Tambo, Iligan City")).toBe("Zone 2");
  });

  it("matches an address to Zone 3", () => {
    expect(getZone("Tipanoy, Iligan City")).toBe("Zone 3");
  });

  it("is case-insensitive", () => {
    expect(getZone("TIPANOY")).toBe("Zone 3");
  });

  it("returns an empty string when no zone matches", () => {
    expect(getZone("Somewhere unmapped")).toBe("");
  });
});
