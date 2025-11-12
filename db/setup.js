//Ensure 'picks' exist
import { getDb } from "./connect.js";

export function setupDataBase() {
  const db = getDb(); //No async needed - better-sqlite3 is synchronous
  //Picks table
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

  //Check picks table
  console.log("✅ Table 'picks' created or verified");

  // User table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    initialBank REAL DEFAULT 100,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    `);
  //Check users table
  console.log('✅ Table "users" created or verified');

  //new columns in picks
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

  //Picks - Users
  if (!columns.includes("user_id")) {
    db.exec(
      `ALTER TABLE picks ADD COLUMN user_id INTEGER REFERENCES users(id)`
    );
    console.log("New column 'user_id' added to 'picks'");
  }
  //Sessions table
  db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `);
  console.log("✅ Table 'sessions' created or verified");
}

setupDataBase();
