// This module performs all betting statistics calculations on the backend side.
// Doing these aggregations server-side ensures:
// 1. Data integrity — results are based on verified database values, not client input.
// 2. Performance — SQLite handles SUM, AVG, and other aggregates far faster than JS loops.
// 3. Scalability — if the data source or structure changes, the frontend logic remains intact.
// In short: calculations belong to the data layer, not the presentation layer.

// Global stats for bank trackert
import { getDb } from "../db/connect.js";

function sendJSON(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

//handle request to api/stats
export async function handleStats(req, res) {
  try {
    const db = getDb();

    //Only allow GET method
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Method not allowed");
    }

    //extract user_id
    const url = new URL(req.url, `http://${req.headers.host}`);
    const user_id = url.searchParams.get("user_id");

    if (!user_id) {
      return sendJSON(res, 400, { error: "Missing user_id" });
    }

    //Query aggregated data for that specific user
    //COALENSCE return first value not NULL
    const result = db
      .prepare(
        `
            SELECT 
            COALESCE(SUM(stake), 0) AS totalStake,
            COALESCE(SUM(profitLoss), 0) AS totalProfitLoss,
            CASE 
                WHEN SUM(stake) > 0 THEN (SUM(profitLoss) * 100.0 / SUM(stake))
                ELSE 0 
            END AS ROI 
            FROM picks
            WHERE user_id = ?;
            `
      )
      .get(user_id);

    //fetch initial bank from users table
    const user = db
      .prepare("SELECT initialBank FROM users WHERE id = ?")
      .get(user_id);

    //default to 100 if not found
    const initialBank = user?.initialBank ?? 100;

    //calculate te users current bank dynamically
    const currentBank = initialBank + result.totalProfitLoss;

    //send data to frontend
    return sendJSON(res, 200, {
      initialBank,
      currentBank,
      totalStake: result.totalStake,
      totalProfitLoss: result.totalProfitLoss,
      ROI: result.ROI.toFixed(2),
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    return sendJSON(res, 500, { error: "Internal server Error" });
  }
}
