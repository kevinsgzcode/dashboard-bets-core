# Step 3 — Connecting SQLite to Vanilla JS Backend

## Overview

In this stage, replaced the temporary JSON file storage with a real **SQLite database**.  
Now the API can **persist picks** using SQL commands instead of writing to disk.

This step introduced new concepts:

- Database connections and drivers (`sqlite3`)
- SQL table creation (`CREATE TABLE IF NOT EXISTS`)
- Querying and inserting data asynchronously with `await`
- Validating and parsing request bodies safely

---

## Debugging part

This was the most complex step so far, I faced:

- Native build errors from sqlite3 not compiling on ARM (fixed by reinstalling with npm).
- Module export issues between ESM and CommonJS (import sqlite3 from "sqlite3" instead of { open }).
- Request validation bugs, where odds was a string and failed Number.isNaN() checks.
- Added console.log() debug statements to inspect the RAW BODY and confirm parsed types.

After refining the API now successfully:

- Responds to GET /api/picks returning all database entries.
- Handles POST /api/picks inserting new picks clean validation

---

## What I Did

1. **Installed SQLite**
   ```bash
   pnpm add sqlite3
   ```
2. **Created the database connection**
   In db/connect.js

```js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDb() {
  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });
  console.log("Connected to SQLite database");
  return db;
}
```

3. **Set up the Table**
   In db/setup.js

```js
const db = await getDb();
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
```

4. **Updated**

- Replaced file-bases logic with SQL queries.
- Added validation for the POST body

```js
if (
  typeof team !== "string" ||
  typeof bet !== "string" ||
  Number.isNaN(numOdds)
) {
  return sendJSON(res, 400, {
    error: "Invalid body. Expected { team: string, bet: string, odds: number }",
  });
}
```
