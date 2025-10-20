//api/picks.js - SQL-backend
import { getDb } from "../db/connect.js";

function sendJSON(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

export async function handlePicks(req, res) {
  try {
    const db = await getDb();

    if (req.method === "GET") {
      //Get all picks
      const rows = await db.all(
        "SELECT id, team, bet, odds, result FROM picks ORDER BY id DESC"
      );
      return sendJSON(res, 200, rows);
    }

    if (req.method === "POST") {
      //Read streaming body
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          console.log("RAW BODY:", body);
          const parsed = JSON.parse(body || "{}");
          console.log("PARSED:", parsed, "typeof odds:", typeof parsed.odds);
          const { team, bet, odds, result = "pending" } = parsed;

          //ensuer proper types

          // Coerce: ensure proper types
          if (typeof team !== "string") team = String(team ?? "").trim();
          if (typeof bet !== "string") bet = String(bet ?? "").trim();

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

          if (!team || !bet || Number.isNaN(numOdds)) {
            return sendJSON(res, 400, {
              error:
                "Invalid body. Expected { team: string, bet: string, odds: number, result?: string }",
            });
          }
          // Parameterized INSERT prevents SQL inkection
          const sql =
            "INSERT INTO picks (team, bet, odds, result) VALUES (?, ?, ?, ?)";
          const { lastID } = await db.run(sql, team, bet, numOdds, result);

          const created = await db.get(
            "SELECT id, team, bet, odds, result FROM picks WHERE id = ?",
            lastID
          );

          return sendJSON(res, 201, { message: "Pick created", pick: created });
        } catch (e) {
          console.error("POST /api/picks error:", e);
          return sendJSON(res, 400, { error: "Invalid JSON body" });
        }
      });
      return; //stop here, response will be sent in 'end'
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
