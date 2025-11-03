# Step 9 — Migration to better-sqlite3 and First Visual Experiment

### Overview

This step focused on improving **database stability and runtime performance** by migrating the project from the standard `sqlite3` driver to **better-sqlite3**.  
Alongside this backend upgrade, a **light visual enhancement** was made to the dashboard — including a dark theme and a first experimental chart integration.

During the previous steps, the project relied on the `sqlite3` library using asynchronous operations (`await db.run()`, `await db.all()`), which occasionally led to:

- **“Database is closed”** errors after async race conditions,
- Multiple open connections across modules,
- and unpredictable write/read timing when auto-updating results.

These issues became more noticeable after introducing background update tasks (Step 8).  
To solve this, we migrated to **better-sqlite3**, a synchronous SQLite driver known for its simplicity and stability in Node.js environments.

---

## Migration Summary

**Before:**

```js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDb() {
  if (_db) return _db;
  _db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });
  return _db;
}
```

**After (better-sqlite3):**

```js
import Database from "better-sqlite3";

let _db;

export function getDb() {
  if (!_db) {
    _db = new Database("./db/database.db");
    console.log("💾 Connected to SQLite database");
  }
  return _db;
}
```

Key improvements:

- No more async/await required — everything is synchronous and atomic.
- The database connection becomes a **singleton**, ensuring a single stable connection for all modules.
- Eliminated transient “SQLITE_MISUSE” and “Database is closed” errors.

---

## Setup Script Refactor

The setup file (`setup.js`) was simplified as well.  
Since `better-sqlite3` executes synchronously, we no longer need promises to initialize the database:

```js
import { getDb } from "./connect.js";

export function setupDataBase() {
  const db = getDb();
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
  console.log("✅ Table 'picks' created (if not already exists)");
}

setupDataBase();
```

This ensures the schema is always verified on server start — lightweight, fast, and safe.

---

## Visual Update

While the main focus was backend reliability, a **small visual experiment** was introduced:

- The dashboard now has a **clean dark interface** with improved color contrast.
- Profit/Loss cells dynamically color in **green (won)**, **red (lost)**, or **gray (pending)**.

These UI tweaks were kept minimal, serving only to test readability and contrast before future refinements.

---

## First Functional Chart Integration

As an early test for potential analytics features, a **performance chart** was added using Chart.js.  
It visualizes each pick’s Profit/Loss, allowing a quick overview of performance trends.

```js
const labels = picks.map((p) => p.team);
const profitData = picks.map((p) => p.profitLoss);

performanceChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels,
    datasets: [
      {
        label: "Profit / Loss",
        data: profitData,
        backgroundColor: profitData.map((val) =>
          val >= 0 ? "rgba(0, 255, 176, 0.6)" : "rgba(244, 67, 54, 0.6)"
        ),
      },
    ],
  },
});
```

The goal of this integration was **not aesthetic**, but exploratory — to understand how Chart.js handles dynamic updates and how it could later integrate with real-time data visualization.

---

## Next Step

**Step 10 → Restructuring for Accuracy.**  
This will focus on improving data precision by adding _league_, _game date_, and controlled _team selection_, ensuring the system fetches and tracks results accurately.

---
