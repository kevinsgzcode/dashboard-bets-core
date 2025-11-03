//Ensure 'picks' exist
import { getDb } from "./connect.js";

export function setupDataBase() {
  const db = getDb(); //No async needed - better-sqlite3 is synchronous
  //Execute SQL command
  db.exec(`
    CREATE TABLE IF NOT EXISTS picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team TEXT NOT NULL,
    bet TEXT NOT NULL,
    odds REAL NOT NULL,
    stake REAL DEFAULT 0,
    possibleWin REAL DEFAULT 0,
    profitLoss REAL DEFAULT 0,
    result TEXT DEFAULT 'pending'
    )
    `);
}

setupDataBase();
console.log("✅ Table 'picks' created (if not already exists)");
