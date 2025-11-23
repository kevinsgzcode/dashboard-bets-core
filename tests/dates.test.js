import { formatDateDisplay } from "../utils/dates.js";

describe("formatDateDisplay()", () => {
  test("converts YYYY-MM-DD to MM/DD/YYYY", () => {
    expect(formatDateDisplay("2025-11-23")).toBe("11/23/2025");
  });

  test("handles leading zeros correctly", () => {
    expect(formatDateDisplay("2025-01-05")).toBe("01/05/2025");
  });

  test("returns null for invalid formats", () => {
    expect(formatDateDisplay("2025/11/23")).toBe(null);
    expect(formatDateDisplay("11-23-2025")).toBe(null);
    expect(formatDateDisplay("")).toBe(null);
  });

  test("returns null for malformed dates", () => {
    expect(formatDateDisplay("2025-1-5")).toBe(null);
  });
});
