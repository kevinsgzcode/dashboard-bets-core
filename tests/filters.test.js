import { filterPicks } from "../utils/filters.js";

const samplePicks = [
  {
    team: "New York Jets",
    result: "won",
    match_date: "2025-11-23",
  },
  {
    team: "Kansas City Chiefs",
    result: "lost",
    match_date: "2025-11-16",
  },
  {
    team: "Carolina Panthers",
    result: "won",
    match_date: "2025-11-16",
  },
];

describe("filterPicks()", () => {
  test("filters by team name (case-insensitive)", () => {
    const out = filterPicks(samplePicks, { team: "jets" });
    expect(out.length).toBe(1);
    expect(out[0].team).toBe("New York Jets");
  });

  test("filters by result", () => {
    const out = filterPicks(samplePicks, { result: "won" });
    expect(out.length).toBe(2);
  });

  test("filters by date range", () => {
    const out = filterPicks(samplePicks, {
      from: "2025-11-20",
      to: "2025-11-25",
    });

    expect(out.map((p) => p.team)).toContain("New York Jets");
    expect(out.length).toBe(1);
  });

  test("returns all picks when filters are empty", () => {
    const out = filterPicks(samplePicks, {});
    expect(out.length).toBe(3);
  });
});
