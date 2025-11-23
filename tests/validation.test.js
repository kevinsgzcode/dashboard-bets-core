import { validateOdds, validateStake } from "../utils/validation.js";

describe("validateOdds()", () => {
  test("accepts valid American odds", () => {
    expect(validateOdds("+150")).toBe(true);
    expect(validateOdds("-110")).toBe(true);
  });

  test("rejects invalid American odds (< +100 or > -100)", () => {
    expect(validateOdds("+50")).toBe(false);
    expect(validateOdds("-80")).toBe(false);
  });

  test("accepts valid decimal odds", () => {
    expect(validateOdds("1.50")).toBe(true);
    expect(validateOdds("2")).toBe(true);
  });

  test("rejects invalid decimal odds (below 1.01)", () => {
    expect(validateOdds("1.0")).toBe(false);
    expect(validateOdds("0.90")).toBe(false);
  });

  test("rejects invalid formats", () => {
    expect(validateOdds("abc")).toBe(false);
    expect(validateOdds("10-10")).toBe(false);
    expect(validateOdds("++50")).toBe(false);
  });
});

describe("validateStake()", () => {
  test("accepts stakes greater than 0", () => {
    expect(validateStake(10)).toBe(true);
  });

  test("rejects zero or negative stakes", () => {
    expect(validateStake(0)).toBe(false);
    expect(validateStake(-20)).toBe(false);
  });

  test("rejects non-numeric stakes", () => {
    expect(validateStake("10")).toBe(false);
    expect(validateStake(null)).toBe(false);
  });
});
