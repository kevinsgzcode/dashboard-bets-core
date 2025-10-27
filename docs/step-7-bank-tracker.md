# Step 7 — Bank Tracker and Global Statistics

## Overview

In this step, turned CRUD + financial logic backend into a **real financial dashboard** by adding a system capable of summarizing all data into **bank, ROI, and performance metrics**.  
The goal was to connect every single pick to its _real-world consequence_ — how each decision affects the total balance.

This required the creation of a new API endpoint (`/api/stats`) that aggregates all financial data directly from the SQLite database and returns a clear overview of the current betting bank and performance indicators.

## Why this step matters

- It transforms the app from “a list of bets” into a **personal analytics dashboard**.
- It lets us understand total exposure, profit/loss, and return on investment (ROI).
- It provides the foundation for future visualizations (charts, bankroll history, etc.).

## Backend Implementation

### New file: `api/stats.js`

This module introduced a single GET endpoint `/api/stats`, which aggregates and calculates totals directly from the database.

### Key logic explained

| Concept            | Description                                  | Why it matters                   |
| :----------------- | :------------------------------------------- | :------------------------------- |
| `SUM(stake)`       | Adds all money wagered across all picks      | Tells how much has been invested |
| `SUM(profitLoss)`  | Adds up all gains/losses                     | Determines net performance       |
| `CASE WHEN ...`    | Avoids division by zero when calculating ROI | Ensures stability                |
| `COALESCE(..., 0)` | Returns 0 instead of NULL for empty data     | Prevents app crashes             |

This approach ensures the backend always returns meaningful data — even if no picks exist.

## ROI Formula Recap

```
ROI (%) = (Total ProfitLoss / Total Stake) × 100
```

## Frontend Integration

A new **Bank Overview Panel** was added above the table to visualize the metrics dynamically.

### Added to `main.js`

```js
// Fetch and display global stats (bank tracker)
async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error("Failed to load stats");

    const data = await res.json();

    document.getElementById(
      "initial-bank"
    ).textContent = `$${data.initialBank.toFixed(2)}`;
    document.getElementById(
      "current-bank"
    ).textContent = `$${data.currentBank.toFixed(2)}`;
    document.getElementById(
      "total-stake"
    ).textContent = `$${data.totalStake.toFixed(2)}`;
    document.getElementById(
      "total-profitloss"
    ).textContent = `$${data.totalProfitLoss.toFixed(2)}`;
    document.getElementById("roi").textContent = `${data.ROI}%`;

    document.getElementById("stats-panel").style.display = "block";
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}
```

The function runs when the app starts and after every CRUD operation to keep stats up to date.

## Results

The dashboard now displays **live global statistics** for every betting pick:

- Bank value updates automatically with every insert, edit, or delete.
- ROI and total stake reflect the true state of the database.
- The entire system works in real time, fully synced between backend and frontend.
