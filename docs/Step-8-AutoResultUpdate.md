# Step 8 — Auto Results Update via TheSportsDB API

## Overview

In this step, the goal was to **automate the update of sports bet results** using live data from the public [TheSportsDB API](https://www.thesportsdb.com/).  
The objective: automatically refresh all `pending` picks in the database every time the server starts — ensuring the dashboard always reflects real results with no manual input.

This step represented a big milestone — the first integration with an external data source, adding asynchronous API calls, and real-world data synchronization.

Before this step, all picks had to be manually edited once the real game ended.  
Now, the server itself can:

- Fetch real match results.
- Update pick outcomes automatically (`won` / `lost`).
- Recalculate profit and ROI based on actual performance.

This turns the project from a static simulation into a **dynamic, live-data tracking system**.

---

## Implementation

### `scores.js` — Fetching Real Match Results

This module uses Node’s built-in `https` module to query the SportsDB API and fetch the latest result for a specific team.

```js
import https from "https";

// Helper to fetch and parse JSON data from any URL
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}
```

---

### Determining the Match Outcome

Once the match data is received, the code determines if the selected team **won**, **lost**, or is still **pending**.

```js
let result = "pending";
if (event.strStatus === "Match Finished") {
  if (
    (team === homeTeam && homeScore > awayScore) ||
    (team === awayTeam && awayScore > homeScore)
  ) {
    result = "won";
  } else {
    result = "lost";
  }
}
```

**Why this logic:**  
It checks which side of the match the team belongs to (home or away) and compares scores accordingly.

---

### `updateResults.js` — Automatic Result Update

This module loops through every `pending` pick in the database, fetches its live result, and updates the record accordingly.

```js
if (apiResult.result === "won") {
  profitLoss = pick.stake * (pick.odds - 1);
} else if (apiResult.result === "lost") {
  profitLoss = -pick.stake;
}
```

**Why this calculation:**

- If the bet **wins**, profit = `(stake * (odds - 1))`
- If it **loses**, profit = `-stake`  
  This ensures consistent tracking of _net_ profit/loss, not total payout.

---

### Automatic Execution on Server Startup

The server now automatically runs the update check as soon as it boots.

```js
(async () => {
  await setupDataBase(); // ensure DB & table exist
  const autoResult = await autoUpdatePendingPicks();
  console.log("✅ Auto-Update response:", JSON.stringify(autoResult));
  console.log("Auto-Update completed successfully");

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
```

**Why here:**  
This guarantees that when the dashboard loads, all picks are already up-to-date, with no outdated stats or manual refresh required.

---

## Issues and Fixes

### `SQLITE_ERROR: no such table: picks`

**Cause:**  
The setup script was pointing to an in-memory SQLite database rather than the persistent file.

**Fix:**  
Ensured `setupDataBase()` executes before any queries and made the connection persistent using a singleton pattern in `getDb()`.

---

### `SQLITE_MISUSE: Database is closed`

**Cause:**  
The setup script closed the database connection (`db.close()`) before the main modules accessed it.

**Fix:**  
Removed `db.close()` and allowed the connection to stay alive throughout the app lifecycle.

---

## Results

When the server starts, the console output confirms everything works automatically:

```
💾 Connected to SQLite database
✅ Table 'picks' created (if not already exists)
🔄 Checking pending picks
✅ Updated Packers → lost (-300)
✅ Auto-Update response: {"updated":1,"details":[{"team":"Packers","result":"lost","profitLoss":-300}]}
Auto-Update completed successfully
🚀 Server running on http://localhost:3000
```

✅ The dashboard now stays fully synchronized with real-world data — no manual updates needed.

---

## Key Takeaways

- **Automation = reliability.** The system maintains itself.
- **Database persistence matters.** Even a single `close()` can break everything.
- **Asynchronous logic requires patience and clear flow control.**
- **Using real APIs adds realism** — the dashboard is now truly dynamic.

---
