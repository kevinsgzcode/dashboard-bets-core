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
    result TEXT DEFAULT 'pending',
    league TEXT DEFAULT 'NFL',
    match_date TEXT
    )
    `);

  //Check if new columns exist
  console.log("✅ Table 'picks' created or verified");

  const pragma = db.prepare("PRAGMA table_info(picks)").all();
  const columns = pragma.map((col) => col.name);

  if (!columns.includes("league")) {
    db.exec(`ALTER TABLE picks ADD COLUMN league TEXT DEFAULT 'NFL'`);
    console.log("New column 'league' added");
  }
  if (!columns.includes("match_date")) {
    db.exec(`ALTER TABLE picks ADD COLUMN match_date TEXT`);
    console.log("New Column 'match_date' added");
  }
}

setupDataBase();
