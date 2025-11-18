# Step 13 — User Authentication, Secure Sessions & Per-User Dashboard

## Overview

This step marks a major milestone in the evolution of the Dashboard Bets Core project:  
moved from a “global, shared dataset” into a **secure, multi-user application** where every user sees _only_ their own picks, stats and chart.

---

## Why Authentication Matters for This Project

Since the beginning, the vision of the project has been:

- A clean, simple dashboard where users track their own bets
- A scalable architecture for future additions (more leagues, more bet types, richer stats)
- A foundation solid enough to deploy publicly and serve real users

To achieve that, we needed:

✔️ Independent user accounts  
✔️ Private data per user  
✔️ Secure access to picks, stats and chart  
✔️ Server-controlled sessions  
✔️ A login workflow usable in real-world deployments

This step delivered **all of that**.

---

# Creating Real User Accounts

### (Registration with bcrypt hashing)

Before authentication, the app allowed user creation in plain text — not acceptable for a real system.

### Key decision: Use bcrypt for password hashing

I implemented bcrypt with 10 salt rounds to ensure:

- Passwords are **never stored in plain text**
- Even we (the developers) cannot recover original passwords
- Password hashes are strong enough for long-term scale

### ✔ Implemented endpoint

`POST /api/register`

### ✔ What it does:

- Validates username + password
- Prevents duplicate usernames
- Hashes the password
- Stores secure credentials in SQLite
- Returns the new user_id

### ✔ Verified via:

- Postman
- SQLite console (hash validation OK)

### ✔ Removed leftovers

We also cleaned the legacy “create user” logic that was still present in `/api/users`.

---

# Implementing Secure Login With Tokens

### (Session-based authentication, not JWT)

Next, created a secure login flow that generates a **unique session token** for each login.

### ✔ Login endpoint

`POST /api/login`

### ✔ How it works:

1. User sends username + password
2. Password is validated using bcrypt.compare
3. A session token is generated using `crypto.randomBytes(24)`
4. Token is stored in a new **sessions** table:

   ```sql
   sessions (
     id INTEGER,
     user_id INTEGER,
     token TEXT,
     created_at TIMESTAMP
   )
   ```

5. The token + user_id are sent back to the frontend

6. The frontend stores:

- token
- user_id
- username
  This turns the app into a fully authenticated system.

## verifySession() Middleware

(Protecting all private routes)
implemented a backend function called:

**verifySession(req)**

## What it does:

- Extracts the token from the Authorization header
- Searches for an active session in SQLite
- Returns the associated user_id
- If invalid → returns null

**This allowed us to protect all private endpoints:**

- GET /api/picks
- POST /api/picks
- DELETE /api/picks/:id
- GET /api/stats
- GET /api/scores
- GET /api/update-results

## Final Results of Step 13

**Backend now**

- Has secure user creation
- Hashes passwords using bcrypt
- Generates and stores session tokens
- Validates tokens per request
- Enforces per-user ownership of picks
- Protects all sensitive routes
- Supports safe logout

**Frontend now**

- Has working login/register UI
- Stores tokens and user_id
- Loads only the authenticated user's data
- Updates dashboard automatically after login
- Supports logout
