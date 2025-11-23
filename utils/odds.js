// utils/odds.js

/**
 * Convert American or Decimal odds to Decimal form.
 * Accepts: +150, -110, 1.50, 2.25, "3.0"
 */
export function parseOdds(raw) {
  if (raw === null || raw === undefined) return null;

  const str = String(raw).trim();

  // Decimal odds (1.20, 2.4, 3.0...)
  if (!str.startsWith("+") && !str.startsWith("-")) {
    const val = Number(str);
    return val > 1 ? val : null;
  }

  // American odds (+150, -110, etc)
  const num = Number(str);

  if (num >= 100) {
    return 1 + num / 100;
  } else if (num <= -100) {
    return 1 + 100 / Math.abs(num);
  }

  return null; // invalid
}

//Calculate possible win based on stake + raw odds.
export function calculatePossibleWin(stake, rawOdds) {
  const decimal = parseOdds(rawOdds);
  if (!decimal) return 0;
  return stake * decimal;
}
