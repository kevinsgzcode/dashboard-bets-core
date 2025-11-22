# Step 15 — Debugging & System Hardening

## Overview

Step 15 focused on stabilizing, optimizing, and debugging multiple critical areas of the Dashboard Bets Core.  
This step included deep improvements across security, UX, odds logic, data integrity, date handling, validations, and real match result integration.

It was the largest debugging milestone of the entire project — and it established production-grade foundations.

---

# 15.1 — Frontend Password Hashing (SHA-256 + Salt)

### Implementation

- Added SHA-256 + salt hashing directly in the **frontend** using Web Crypto API.
- Passwords are now encrypted before they are sent to the backend.
- Backend bcrypt continues hashing on top of the SHA-256 output.

### Security Achieved

- Eliminates plaintext password transmission.
- Higher entropy against rainbow-table attacks.
- Double-hash architecture: **SHA-256 → bcrypt**.

---

# 15.2 — Fix: Chart Not Rendering After First Pick

A bug prevented the Chart.js graph from showing after adding the first pick.

### ✔ Key Fixes

- Corrected canvas visibility logic.
- The chart now appears correctly once at least one pick is present.

---

# 15.3 — Display Logged User Inside Bank Panel

Added “Welcome {username}” inside the Bank Overview.

### Benefits

- Better session clarity.
- More professional dashboard UX.

---

# 15.4.1 — NFL Teams API Fix

### Issue

- Incorrect endpoint was being used (“National Football League”).
- Team loading, autocomplete, and validation were failing.

### ✔ Solution

- Implemented correct API: `search_all_teams.php?l=NFL`.
- Kept a local fallback list of all 32 NFL teams.
- Sorted teams alphabetically.
- Enforced strict validation based on the dynamic list.

---

# 15.5.2 — Team Autocomplete UX

### Improvements

- Replaced `<select>` with a dynamic **autocomplete input**.
- Modern UX similar to Notion / Linear.
- Strong validation ensures only valid NFL teams can be selected.

---

# 15.5.3 — American Odds Bug Fix (+750 → 75000)

This was the most severe logic bug in the app.  
The browser removed the “+” sign because odds were using `<input type="number">`.

### Fix

- Changed to `<input type="text" inputmode="numeric">`.
- This preserves +750, -110, etc.
- Entire odds calculation chain now works correctly.

### Result

- No more **$75,000** inflation bug.
- Full sportsbook-accurate logic.

---

# 15.5.4 — Unified Odds System + Database Schema Fix

### Root Problem

SQLite stored `odds` as REAL, which removed the “+” sign.  
`+750` became `750`, breaking calculations after reloads or auto-updates.

### ✔ Final Fix

- Rebuilt schema with `odds TEXT`.
- Odds are preserved _exactly as typed_.
- All logic now uses:
  - `parseOdds()`
  - `calculatePossibleWin()`

### Result

- Full American + Decimal odds support.
- 100% consistent calculations across all flows.

---

# 15.6 — Timezone-Safe Date Handling

### Problem

`new Date()` converted values internally to UTC.  
This caused:

- 1–2 day shifts
- Incorrect render
- Broken filters
- Wrong match validation

### Solution

- Removed **all** uses of `new Date()` for match dates.
- Entire system now uses pure strings: `"YYYY-MM-DD"`.
- Filters use lexicographical comparison.
- Added `formatDateDisplay()` for safe rendering.

### Result

No drift. No silent conversions.  
Dates remain 100% accurate.

---

# 15.6 — Migration to ESPN Scoreboard API (Free, Stable, Safe)

After multiple issues with TheOddsAPI (DNS, CORS, credits, VPN), the system migrated to ESPN.

### ✔ Why ESPN

- Free
- No limits
- No API key required
- No DNS issues
- Provides scheduled & live game metadata
- Includes real scores & match status

### ✔ Implemented Improvements

- Removed TheOddsAPI integration
- Removed proxy logic entirely
- New ESPN-based `updateResults.js`:
  - Detects `status.type.completed`
  - Reads scores from `competitors[]`
  - Protects future/ongoing games from premature updates
  - Ensures accurate win/loss resolution

### ✔ Known Limitation

- ESPN only returns games for the **current NFL season**.
- Past-season games are intentionally not returned.

This is acceptable because:

- The dashboard is meant to track **current/future** NFL bets.
- For a hiring portfolio, this demonstrates real data processing without paid APIs.

### Result

A stable, cost-free real score system ideal for phase-1 production.

---

# 15.7 — Manual “Update Results” Button

Previously, the server auto-triggered result updates on startup.

### Issues

- Wasted API calls
- Incorrect updates before games occurred
- Unnecessary coupling between startup and results

### ✔ Fix

- Disabled auto-update on server start.
- Added a manual UI button calling `/api/update-results`.
- Workflow:
  1. User clicks “Update Results”
  2. Server fetches ESPN data
  3. Only completed matches update
  4. Picks + stats + chart refresh

### Result

Total control, zero wasted requests, cleaner backend architecture.

---

# 15.8 — Final API Selection

### 🔍 Evaluated APIs

| API             | Issues                                        |
| --------------- | --------------------------------------------- |
| TheOddsAPI      | DNS blocked, credits, VPN, proxy restrictions |
| AllOrigins      | Returned HTML instead of JSON                 |
| corsproxy.io    | Blocks server-side requests                   |
| ESPN Scoreboard | ✔ Works, ✔ free, ✔ stable                     |

### Final Decision

**Use ESPN Scoreboard as the official NFL results provider for Dashboard Bets Core.**

Reasons:

- Zero cost
- No API key
- No request limits
- Reliable & stable
- Perfect for current-season tracking

---

# 🚀 Step 15 Final Outcome

Step 15 delivered:

### ✔ Fully stable end-to-end system

### ✔ Correct American & Decimal odds logic

### ✔ Accurate, drift-free date handling

### ✔ Reliable ESPN score integration

### ✔ Hardened login security

### ✔ Modern UX (autocomplete + odds input)

### ✔ Accurate sportsbook-style payouts

### ✔ Clean backend architecture

---
