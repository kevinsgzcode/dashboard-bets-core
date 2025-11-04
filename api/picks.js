//api/picks.js - SQL-backend
import { getDb } from "../db/connect.js";

function sendJSON(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

export async function handlePicks(req, res) {
  try {
    const db = getDb();

    //Get all picks
    if (req.method === "GET") {
      const rows = db
        .prepare(
          "SELECT id, team, bet, odds, stake, possibleWin, profitLoss, result, league, match_date FROM picks ORDER BY id DESC"
        )
        .all();
      return sendJSON(res, 200, rows);
    }

    //POST - Create New pick
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
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

          // takes "1.95" o "1,95" o 1.95
          let numOdds;
          if (typeof odds === "number") {
            numOdds = odds;
          } else {
            const normalized = String(odds ?? "")
              .replace(",", ".")
              .trim();
            numOdds = Number(normalized);
          }

          //Validate all required fields

          if (
            !team ||
            !bet ||
            Number.isNaN(numOdds) ||
            Number.isNaN(stake) ||
            !league ||
            !match_date
          ) {
            return sendJSON(res, 400, {
              error:
                "Invalid body. Expected { team: string, bet: string, odds: number, result?: string }",
            });
          }

          //Calculate derived values
          const possibleWin = stake * numOdds;
          let profitLoss = 0;
          if (result === "won") profitLoss = possibleWin - stake;
          else if (result === "lost") profitLoss = -stake;

          // Insert pick with new fields
          const sql = `
          INSERT INTO picks (team, bet, odds, stake, possibleWin, profitLoss, result, league, match_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const info = db
            .prepare(sql)
            .run(
              team,
              bet,
              numOdds,
              stake,
              possibleWin,
              profitLoss,
              result,
              league,
              match_date
            );

          const created = db
            .prepare("SELECT * FROM picks WHERE id = ?")
            .get(info.lastInsertRowid);

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

          //updated fields
          const newOdds = odds ?? pick.odds;
          const newStake = stake ?? pick.stake;
          const possibleWin = newStake * newOdds;
          let profitLoss = pick.profitLoss;

          if (result === "won") profitLoss = possibleWin - newStake;
          else if (result === "lost") profitLoss = -newStake;
          else if (result === "pendig") profitLoss = 0;

          //update record
          const sql = `UPDATE picks SET result = ?, odds = ?, stake = ?, possibleWin = ?, profitLoss = ? WHERE id = ?`;
          db.prepare(sql).run(
            result ?? pick.result,
            newOdds,
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
