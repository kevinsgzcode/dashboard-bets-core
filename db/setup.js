import { connectToDatabase } from "./connect.js";

async function setupDataBase() {
  const db = await connectToDatabase();
  //Execute SQL command
  await db.exec(`
    CREATE TABLE IF NOT EXISTS picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team TEXT NOT NULL,
    bet TEXT NOT NULL,
    odds REAL NOT NULL,
    result TEXT DEFAULT 'pending'
    )
    `);

  console.log("Table 'picks' created (if not already exists)");
  await db.close();
}

setupDataBase();
