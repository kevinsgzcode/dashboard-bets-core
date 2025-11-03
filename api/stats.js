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

    //Query aggregated data
    //COALENSCE return first value not NULL
    const result = db.prepare(`
            SELECT 
            COALESCE(SUM(stake), 0) AS totalStake,
            COALESCE(SUM(profitLoss), 0) AS totalProfitLoss,
            CASE 
                WHEN SUM(stake) > 0 THEN (SUM(profitLoss) * 100.0 / SUM(stake))
                ELSE 0 
            END AS ROI 
            FROM picks;
            `).get();

    //Define initial bank
    const initialBank = 100;
    const currentBank = initialBank + result.totalProfitLoss;

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
