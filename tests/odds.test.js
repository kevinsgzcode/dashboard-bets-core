import { parseOdds, calculatePossibleWin } from "../utils/odds.js";

describe("parseOdds()", () => {
  test("converts positive American odds", () => {
    expect(parseOdds("+150")).toBeCloseTo(2.5);
  });

  test("converts negative American odds", () => {
    expect(parseOdds("-110")).toBeCloseTo(1.909);
  });

  test("reads decimal odds", () => {
    expect(parseOdds("2.2")).toBe(2.2);
  });

  test("returns null on invalid odds", () => {
    expect(parseOdds("abc")).toBeNull();
  });
});

describe("calculatePossibleWin()", () => {
  test("works with American odds", () => {
    expect(calculatePossibleWin(100, "+200")).toBe(300);
  });

  test("works with decimal odds", () => {
    expect(calculatePossibleWin(50, "1.5")).toBe(75);
  });

  test("returns 0 on invalid odds", () => {
    expect(calculatePossibleWin(50, "abc")).toBe(0);
  });
});
