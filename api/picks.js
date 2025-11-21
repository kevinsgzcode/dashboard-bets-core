//api/picks.js - SQL-backend
import { getDb } from "../db/connect.js";
import { verifySession } from "./middleware/auth.js";
import { calculatePossibleWin } from "./oddsUtils.js";
import { parseOdds } from "./oddsUtils.js";

function sendJSON(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

export async function handlePicks(req, res) {
  try {
    const db = getDb();

    //Veryfi token
    const user_id = verifySession(req);
    if (!user_id) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    //Get all picks for active user
    if (req.method === "GET") {
      const picks = db
        .prepare("SELECT * FROM picks WHERE user_id = ? ORDER BY id DESC")
        .all(user_id);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(picks));
    }

    //POST - Create New pick for specific user
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          //validate session
          const user_id = verifySession(req);
          if (!user_id) {
            return sendJSON(res, 401, { error: "Unauthorized" });
          }

          console.log("RAW BODY:", body);
          const parsed = JSON.parse(body || "{}");
          console.log("PARSED:", parsed);

          let {
            team,
            bet,
            odds,
            stake = 0,
            result = "pending",
            league = "NFL",
            match_date,
          } = parsed;

          // Normalize values
          if (typeof team !== "string") team = String(team ?? "").trim();
          if (typeof bet !== "string") bet = String(bet ?? "").trim();
          if (typeof league !== "string") league = String(league ?? "").trim();

          stake = parseFloat(stake);

          // Normalize odds as string
          const oddsString = String(odds ?? "").trim();

          //Convert odds to decimal
          const decimalOdds = parseOdds(oddsString);
          if (!decimalOdds) {
            return sendJSON(res, 400, { error: "Invalid odds format" });
          }

          //Calculate possible win
          const possible_win = calculatePossibleWin(stake, oddsString);

          //New pick start at 0 profitloss
          let profitLoss = 0;

          // Insert pick with new fields
          const sql = `
          INSERT INTO picks (team, bet, odds, stake, possibleWin, profitLoss, result, league, match_date, user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const info = db
            .prepare(sql)
            .run(
              team,
              bet,
              oddsString,
              stake,
              possible_win,
              profitLoss,
              result,
              league,
              match_date,
              user_id
            );

          const created = db
            .prepare("SELECT * FROM picks WHERE id = ?")
            .get(info.lastInsertRowid);

          console.log(`✅ Pick created for user_id: ${user_id}`);
          return sendJSON(res, 201, { message: "Pick created", pick: created });
        } catch (e) {
          console.error("POST /api/picks error:", e);
          return sendJSON(res, 400, { error: "Invalid JSON body" });
        }
      });
      return; //stop here, response will be sent in 'end'
    }

    //PUT - update an existing pick
    if (req.method === "PUT") {
      const id = req.url.split("/").pop();
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const data = JSON.parse(body || "{}");
          const { result, odds, stake } = data;

          const pick = db.prepare("SELECT * FROM picks WHERE id = ?").get(id);
          if (!pick) return sendJSON(res, 404, { error: "Pick not found" });

          const newOddsString = String(odds ?? pick.odds).trim();
          const newStake = stake != null ? parseFloat(stake) : pick.stake;

          const decimalOdds = parseOdds(newOddsString);
          if (!decimalOdds) {
            return sendJSON(res, 400, { error: "Invalid odds format" });
          }

          const possibleWin = calculatePossibleWin(newStake, newOddsString);

          let profitLoss = pick.profitLoss;
          if (result === "won") {
            profitLoss = possibleWin - newStake;
          } else if (result === "lost") {
            profitLoss = -newStake;
          } else if (result === "pending") {
            profitLoss = 0;
          }

          const sql = `
            UPDATE picks
            SET result = ?, odds = ?, stake = ?, possibleWin = ?, profitLoss = ?
            WHERE id = ?
          `;

          db.prepare(sql).run(
            result ?? pick.result,
            newOddsString,
            newStake,
            possibleWin,
            profitLoss,
            id
          );

          const updated = db
            .prepare("SELECT * FROM picks WHERE id = ?")
            .get(id);
          return sendJSON(res, 200, {
            message: "Picks updated",
            pick: updated,
          });
        } catch (err) {
          console.error("PUT /api/picks error", err);
          return sendJSON(res, 400, { error: "Invalid JSON body" });
        }
      });
      return;
    }

    //Delete - Remove a pick

    if (req.method === "DELETE") {
      const id = req.url.split("/").pop();
      try {
        const db = getDb();
        const info = db.prepare("DELETE FROM picks WHERE id = ?").run(id);

        if (info.changes === 0) {
          return sendJSON(res, 400, { error: "Pick not found" });
        }
        return sendJSON(res, 200, {
          message: `Pick ${id} deleted successfully`,
        });
      } catch (err) {
        console.error("DELETE /api/picks error:", err);
        return sendJSON(res, 500, { error: "Internal server error" });
      }
    }

    //Method not allowed
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not Allowed");
  } catch (e) {
    console.error("handlePicks fatal:", e);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
}
