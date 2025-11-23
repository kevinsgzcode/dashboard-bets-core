//validates American and Decimal odds
export function validateOdds(odds) {
  if (!odds || typeof odds !== "string") return false;

  const patter = /^(\+|-)?\d+(\.\d+)?$/;
  if (!patter.test(odds)) return false;

  const value = Number(odds);

  //American odds
  if (odds.startsWith("+") || odds.startsWith("-")) {
    if (Math.abs(value) < 100) return false;
    return true;
  }

  //Decimal odds
  return value >= 1.01;
}

//validates stake
export function validateStake(stake) {
  if (stake === null || stake === undefined) return false;
  if (typeof stake !== "number") return false;
  return stake > 0;
}
