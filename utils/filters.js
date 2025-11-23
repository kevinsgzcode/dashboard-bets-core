//filter logic
export function filterPicks(
  picks,
  { team = "", result = "", from = "", to = "" }
) {
  const teamLower = team.toLowerCase();

  return picks.filter((p) => {
    const matchesTeam = team ? p.team.toLowerCase().includes(teamLower) : true;
    const matchesResult = result ? p.result === result : true;

    const matchesDate =
      (!from || (p.match_date && p.match_date >= from)) &&
      (!to || (p.match_date && p.match_date <= to));

    return matchesTeam && matchesResult && matchesDate;
  });
}
