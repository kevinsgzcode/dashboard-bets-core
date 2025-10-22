# Step 4 — Connecting Backend with a Visual Dashboard

## Overview

In this stage, the project connected the **Node.js backend** with a minimal **frontend built using pure HTML, CSS, and JavaScript** — no frameworks.  
The goal was to make data from the SQLite database visible and interactive through the browser.

This step introduced new concepts:

- Serving static files (HTML, CSS, JS) from Node’s `http` module
- Using `fetch()` to connect client and server
- Handling JSON responses and rendering data dynamically
- Sending POST requests directly from the browser
- Understanding how frontend and backend communicate

---

## Debugging part

This step required several adjustments before the system worked end-to-end:

- **404 Not Found** when loading `index.html`  
  → Fixed by adding static file serving and ignoring Chrome’s `.well-known` requests.
- **Server crash** because `fs/promises` was missing  
  → Solved by importing it explicitly in `server.js`.
- **HTML rendering issue** where table data appeared concatenated  
  → Fixed by matching database property names (`bet`, `odds`) instead of old ones.
- **Confusion between `picks.json` and SQLite**  
  → Clarified that the live data now resides in `./db/database.db` (the real storage).

After debugging, the dashboard successfully:

- Fetches and displays stored picks dynamically via `GET /api/picks`
- Allows adding new picks with a POST request from the frontend form
- Updates the table instantly without reloading the page

---

## What I Did

1. **Updated the server**
   In `server.js`  
   Added logic to serve static files in addition to the API routes.

2. **Ignored Chrome's background request**

   ```js
   if (req.url.includes(".well-known") || req.url === "/favicon.ico") {
     res.writeHead(204);
     return res.end();
   }
   ```

3. **Created a minimal index.html**
   Just to visualize the information and understand how backend woks with frontend

## Results

- Data flows seamlessly from the database to the browser.
- GET and POST routes both function as intended.
- Picks can be created visually from the dashboard and persist in SQLite.
- Server now fully integrates backend + frontend layers.
