# Step 16 — Testing & Linters (Jest + ESLint)

## Overview

Step 16 focused on introducing software engineering best practices into the Dashboard Bets Core:  
**unit tests**, **input validation testing**, **date logic testing**, **filter testing**, and **linting** for consistent code quality.

This step ensures the project is stable, predictable, and production-ready — and demonstrates real engineering discipline for hiring managers.

Testing is one of the most valuable additions made to the project so far.

---

## 16.1 — Jest Setup (Node.js + ESM + pnpm)

### What was done

- Installed Jest using **pnpm**.
- Configured Jest to run correctly in an **ESM environment** using `"type": "module"`.
- Enabled ESM support with: node --experimental-vm-modules

- Created a test script inside `package.json`.

### Why this matters

Modern JavaScript uses ES modules by default, and configuring Jest for ESM shows real-world engineering understanding.

---

## 16.2 — Odds Unit Tests (parseOdds + calculatePossibleWin)

### Coverage

- Positive American odds
- Negative American odds
- Decimal odds
- Invalid odds
- Correct sportsbook payout calculations

### Why this matters

Odds processing is **core business logic**.  
Any mistake breaks:

- stats
- table
- charts
- user profit/loss values

These tests guarantee correctness.

---

## 16.3 — Validation Unit Tests

### ✔ Covered validation rules:

- American odds format
- decimal odds format
- range validation (+100 / -100 / min decimal 1.01)
- required fields
- correct vs incorrect formats

### Why this matters

Validations protect the database from corrupted input and guarantee stable UX across the dashboard.

---

## 16.4 — Date Handling Tests

### Ensured:

- No timezone drift
- Dates remain `"YYYY-MM-DD"`
- `formatDateDisplay()` works
- Lexicographical comparison works correctly for ranges

### Why this matters

You eliminated one of the most difficult bugs in frontend/backend integration:  
**automatic timezone shifting**.

Your tests guarantee the fix is permanent.

---

## 16.5 — Filters Tests (Team, Result, Date Range)

### ✔ Covered:

- filtering by team name
- filtering by result (win/loss/pending)
- filtering by date range
- filtering with multiple combined conditions

### 🛠 Bug found & solved

The tests exposed a typo inside your filter function.  
Fixing it prevented a real production bug.

**This is exactly why automated testing exists.**

---

## 16.6 — ESLint Setup (Code Quality & Consistency)

### ✔ Installed:

- eslint
- @eslint/js
- globals

### ✔ Configuration

- Browser + Node global variables enabled.
- ESM support.
- `"extends": ["js/recommended"]`.
- Custom rules:

```js
"no-unused-vars": "off"
```
