# Step 10 — Contextual Picks & Data Accuracy

### Overview

This step focused on improving the accuracy and contextual integrity of the `Dashboard Bets Core` project.  
Up until now, picks were recorded without any contextual data — meaning a single team could have multiple games in the same week, and the app had no way of knowing _which match_ a pick referred to.  
This caused the auto-update system to sometimes fetch or overwrite the wrong results.

To solve this, I introduced two critical new fields:

- `league` (to identify which league the team belongs to)
- `match_date` (to specify the exact game date)

By doing so, every pick now carries enough metadata to be uniquely and correctly updated — eliminating ambiguity and making the system much more reliable.

---

### Problems Encountered

1. **Ambiguous Results from the API**  
   When checking scores automatically via TheSportsDB, the API often returned multiple games for the same team (past, current, or even preseason).  
   Without a match date, the app couldn’t tell which event was relevant, leading to false “won/lost” statuses.

2. **Human Error During Data Entry**  
   Allowing the user to _type_ team names or leagues manually led to:

   - Inconsistent naming (`Chiefs` vs. `Kansas City Chiefs`)
   - Spelling mistakes that broke the API query
   - Duplicated entries that referred to different games

3. **Data Loss After Page Reload**  
   Because the `league` and `match_date` weren’t yet stored in the database, the values disappeared after refreshing the page, breaking consistency between frontend and backend.

---

### Reasoning Behind the Solutions

1. **Adding `league` and `match_date` Columns**  
   These new columns were added directly to the SQLite schema:

   ```sql
   ALTER TABLE picks ADD COLUMN league TEXT DEFAULT 'NFL';
   ALTER TABLE picks ADD COLUMN match_date TEXT;
   ```

   This ensures every record is tied to a specific event — minimizing confusion and enabling precise updates later.

2. **Dynamic League and Team Selection (Frontend)**  
   Instead of relying on free-text inputs, the frontend now provides:

   - A dropdown for `league` selection (starting with NFL)
   - A dynamically populated `team` dropdown, fetched via TheSportsDB’s API

   This design minimizes human error and guarantees the team names match the API’s naming convention exactly.

3. **Full Integration Between Backend and Database**  
   The backend routes were updated to include both new fields in `SELECT` and `INSERT` statements:

   ```js
   INSERT INTO picks (team, bet, odds, stake, possibleWin, profitLoss, result, league, match_date)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   ```

   Now the data persists correctly across reloads and survives server restarts.

4. **Validation on Submission**  
   The form now validates that all fields — including `league` and `match_date` — are filled before sending the request.  
   This ensures no incomplete or ambiguous picks can be stored.

---

### Results & Impact

- **Accurate Results:** Each pick now updates correctly based on both team and date.
- **Reduced Human Error:** Users can’t mistype or mismatch teams anymore.
- **Data Persistence:** Refreshing the dashboard no longer causes missing or empty fields.
- **Scalability:** The structure now supports multiple leagues and time filters in the future.

---
