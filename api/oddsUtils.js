//American to decimal

export function americanToDecimal(odds) {
  const value = Number(odds);
  if (isNaN(value)) return null;

  if (value > 0) {
    // Example: +150 => 1 + (150/100) = 2.5
    return 1 + value / 100;
  } else if (value < 0) {
    // Example: -110 => 1 + (100/110) = 1.909
    return 1 + 100 / Math.abs(value);
  }

  return null;
}

export function parseOdds(rawOdds) {
  const str = String(rawOdds).trim();

  // American odds
  if (str.startsWith("+") || str.startsWith("-")) {
    return americanToDecimal(str);
  }

  // Decimal odds
  const dec = Number(str);
  if (!isNaN(dec) && dec > 1.0) {
    return dec;
  }

  return null;
}

export function calculatePossibleWin(stake, rawOdds) {
  const decimal = parseOdds(rawOdds);
  if (!decimal) return 0;
  return stake * decimal;
}

export function calculateProfitLoss(result, stake, rawOdds) {
  const decimal = parseOdds(rawOdds);
  if (!decimal) return 0;

  if (result === "won") {
    return stake * decimal - stake;
  } else if (result === "lost") {
    return -stake;
  }
  return 0; // pending
}
