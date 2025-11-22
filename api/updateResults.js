// updateResults.js — Fetch NFL results from ESPN (free, stable, no API keys)

import { getDb } from "../db/connect.js";
import https from "https";
import { calculatePossibleWin } from "./oddsUtils.js";

/**
 * Basic HTTPS JSON fetch
 */
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

/**
 * Extract YYYY-MM-DD from ESPN commence_time ("2025-11-23T18:00Z")
 */
function extractDate(isoString) {
  if (!isoString) return null;
  return isoString.slice(0, 10);
}

/**
 * MAIN HANDLER — manual trigger only.
 * Fetch NFL scores from ESPN and update pending picks.
 */
export async function handleUpdateResults(req, res) {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    const db = getDb();

    // Load pending picks
    const pending = db
      .prepare("SELECT * FROM picks WHERE result = 'pending'")
      .all();

    if (pending.length === 0) {
      return res.end(JSON.stringify({ updated: 0, details: [] }));
    }

    console.log("📡 Fetching NFL results from ESPN...");

    // ESPN scoreboard (free, no API key needed)
    const url =
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

    const scoreboard = await fetchJSON(url);

    const events = scoreboard.events || [];
    console.log(`📘 Loaded ${events.length} NFL games from ESPN`);

    const updates = [];

    for (const pick of pending) {
      const pickTeam = pick.team.toLowerCase();
      const pickDate = pick.match_date; // stored as YYYY-MM-DD

      // Try to match the pick with the ESPN event
      const event = events.find((ev) => {
        const evDate = extractDate(ev.date);
        if (evDate !== pickDate) return false;

        const team1 =
          ev.competitions[0].competitors[0].team.displayName.toLowerCase();
        const team2 =
          ev.competitions[0].competitors[1].team.displayName.toLowerCase();

        return team1.includes(pickTeam) || team2.includes(pickTeam);
      });

      if (!event) {
        console.log(`⏸ No ESPN match found for ${pick.team} on ${pickDate}`);
        continue;
      }

      // ESPN marks games as "status.type.completed"
      const completed = event.status?.type?.completed;

      if (!completed) {
        console.log(`⏳ Game not completed yet: ${pick.team}`);
        continue;
      }

      // Extract score
      const comp = event.competitions[0].competitors;
      const home = comp.find((c) => c.homeAway === "home");
      const away = comp.find((c) => c.homeAway === "away");

      const homeTeam = home.team.displayName.toLowerCase();
      const awayTeam = away.team.displayName.toLowerCase();
      const homeScore = Number(home.score);
      const awayScore = Number(away.score);

      // Determine result
      let result = "lost";
      if (
        (homeTeam.includes(pickTeam) && homeScore > awayScore) ||
        (awayTeam.includes(pickTeam) && awayScore > homeScore)
      ) {
        result = "won";
      }

      const possibleWin = calculatePossibleWin(pick.stake, pick.odds);
      const profitLoss =
        result === "won" ? possibleWin - pick.stake : -pick.stake;

      // Update DB
      db.prepare(
        `UPDATE picks
         SET result = ?, possibleWin = ?, profitLoss = ?
         WHERE id = ?`
      ).run(result, possibleWin, profitLoss, pick.id);

      updates.push({
        team: pick.team,
        result,
        profitLoss,
      });

      console.log(`🏈 Updated ${pick.team}: ${result}`);
    }

    // Send response
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ updated: updates.length, details: updates })
    );
  } catch (err) {
    console.error("❌ updateResults Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Internal Error" }));
  }
}
