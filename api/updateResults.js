//Auto-update pending picks based on real match results
import { getDb } from "../db/connect.js";
import https from "https";
import { parseOdds, calculatePossibleWin } from "./oddsUtils.js";

// Helper function to fetch JSON reuses the same pattern from /api/scores
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

// Main handler
export async function handleUpdateResults(req, res) {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    const db = getDb();

    //Fetch all picks still pending
    const pendingPicks = db
      .prepare(
        "SELECT id, team, stake, odds FROM picks WHERE result = 'pending'"
      )
      .all();

    if (pendingPicks.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ message: "No pending picks to update." })
      );
    }

    const updates = [];

    //For each pending pick → check the real result via TheSportsDB
    for (const pick of pendingPicks) {
      const { id, team, stake, odds } = pick;

      try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
          team
        )}`;
        const teamData = await fetchJSON(url);
        const teamInfo = teamData.teams?.[0];
        if (!teamInfo) continue;

        const teamId = teamInfo.idTeam;
        const eventData = await fetchJSON(
          `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`
        );
        const event = eventData.results?.[0];
        if (!event) continue;

        const homeTeam = event.strHomeTeam;
        const awayTeam = event.strAwayTeam;
        const homeScore = Number(event.intHomeScore);
        const awayScore = Number(event.intAwayScore);
        const status = (event.strStatus || "").toLowerCase();

        // Determine if the match finished
        const isFinished =
          status.includes("match finished") ||
          status.includes("ft") ||
          status.includes("ended") ||
          status.includes("full") ||
          (homeScore >= 0 && awayScore >= 0);

        let result = "pending";
        if (isFinished) {
          const normalizedTeam = team.toLowerCase();
          const homeNormalized = homeTeam.toLowerCase();
          const awayNormalized = awayTeam.toLowerCase();

          if (
            (homeNormalized.includes(normalizedTeam) &&
              homeScore > awayScore) ||
            (awayNormalized.includes(normalizedTeam) && awayScore > homeScore)
          ) {
            result = "won";
          } else {
            result = "lost";
          }
        }

        // Skip if match still pending
        if (result === "pending") continue;

        //Calculate profit/loss and update DB
        const decimal0dds = parseOdds(odds);
        if (!decimal0dds) {
          console.error(`❌ Invalid odds format for ${team}`, odds);
          continue;
        }

        //possible win using your sportbook logic
        const possibleWin = calculatePossibleWin(stake, odds);

        //profit/loss
        const profitLoss = result === "won" ? possibleWin - stake : -stake;

        db.prepare(
          `UPDATE picks SET result = ?, possibleWin = ?, profitLoss = ? WHERE id = ?`
        ).run(result, possibleWin, profitLoss, id);

        updates.push({
          team,
          result,
          profitLoss,
        });

        console.log(`✅ Updated ${team} → ${result} (${profitLoss})`);
      } catch (err) {
        console.error(`❌ Error updating ${pick.team}:`, err);
      }
    }

    //Respond with summary
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        updated: updates.length,
        details: updates,
      })
    );
  } catch (err) {
    console.error("handleUpdateResults error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
