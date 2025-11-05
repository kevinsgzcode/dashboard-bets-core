# Step 11 — State Management & Dynamic Filters

### Overview

Until now, every update to the picks table required fetching data directly from the backend.  
This caused unnecessary server requests, slower interactions, and limited flexibility when applying filters or modifying the UI.

To solve this, I introduced **frontend state management** — a lightweight but powerful system that stores the current picks directly in memory — together with a **dynamic filtering layer** that updates the table instantly without reloading the page.

---

### Problems Encountered

1. **Redundant Requests**  
   Every small UI change (adding, deleting, or filtering) required a full call to `/api/picks`, even when the data was already available.

2. **Lack of Reactivity**  
   The table only reflected data after manually refreshing or re-fetching from the backend, which broke the principle of a “live dashboard”.

3. **Unnecessary Coupling Between Data and Render**  
   The previous implementation mixed the logic of fetching and rendering in the same function (`loadPicks()`), making it harder to scale or update UI behavior independently.

---

### Reasoning Behind the Solutions

1. **Introducing Local State (`allPicks`, `filteredPicks`)**  
   Two in-memory arrays were added to keep track of:

   - `allPicks` the complete dataset fetched once from the backend.
   - `filteredPicks` the currently visible data after filters are applied.

   This change allows the app to work with data **directly from memory**, reducing network load and enabling instant updates.

   ```js
   // Local state for picks
   let allPicks = [];
   let filteredPicks = [];
   ```

2. **Separating Data Loading and Rendering**  
   The previous `loadPicks()` function was split into two:

   - `loadPicks()` → responsible for fetching data and updating state.
   - `renderPicks()` → responsible for drawing the table based on the current state.

   This separation ensures **single responsibility** and mirrors, but built entirely with vanilla JS.

3. **Implementing Real-Time Filtering Without Reloads**  
   A dedicated `applyFilters()` function reads the user inputs (team, result, date range) and updates `filteredPicks` dynamically.  
   Each filter action triggers a full table re-render in milliseconds, keeping the experience fluid and consistent:

   ```js
   // Apply filters instantly in memory
   filteredPicks = allPicks.filter(pick => {
     const matchesTeam = teamInput ? pick.team.toLowerCase().includes(teamInput) : true;
     const matchesResult = resultSelect ? pick.result === resultSelect : true;
     const matchesDate = ...
     return matchesTeam && matchesResult && matchesDate;
   });

   renderPicks(filteredPicks);
   ```

4. **State as a Single Source of Truth**  
   Once loaded, the dashboard fully relies on its local state to handle UI logic.  
   Only operations that actually change persistent data (create, update, delete) make calls to the backend, keeping communication minimal and intentional.

---

### Results & Impact

- **Instant Filtering:** Users can now search and combine filters (team + result + date) without page reloads.
- **Improved Performance:** Reduced backend calls, smoother UI transitions, and less network overhead.
- **Modular Architecture:** Clear separation between fetching, state management, and rendering.
- **Scalability Ready:** This state system will support future features like per-user data, saved views, and advanced stats without reworking the core logic.
- **Better Developer Experience:** Debugging and extending the frontend is now more predictable and maintainable.

---

### Lessons Learned

- Managing data locally through a controlled state makes a frontend **faster, cleaner, and easier to reason about**.
- Efficient apps are not only those that “look good”, but those that **avoid unnecessary work** — fewer requests, smarter updates.
- Understanding state at a low level (vanilla JS) builds a strong foundation to later adopt frameworks with real reactivity.
- The key insight: _the backend handles persistence, while the frontend handles presence._

---
