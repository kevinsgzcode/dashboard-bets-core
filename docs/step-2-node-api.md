# Step 2 — Building a Raw Node.js API (Vanilla JavaScript)

## Overview

In this step, I built a **minimal REST API using only Node.js core modules** — no frameworks, no Express, no ORMs.  
The goal was to understand how routing, asynchronous logic, and data persistence work at the lowest level.

This step simulates the foundation of a real backend: handling requests, parsing data, and returning responses — all using pure JavaScript.

---

## Objectives

- Learn how HTTP servers work internally with Node.js.
- Understand the role of `req` (request) and `res` (response) objects.
- Implement custom routes manually (e.g., `/`, `/api/picks`, `/health`).
- Handle **GET** and **POST** requests without frameworks.
- Save and read data persistently using JSON files.
- Test API endpoints using both `curl` and Postman.

---

## Implementation

- server.js

else if (req.url.startsWith("/api/picks")) {
await handlePicks(req, res);
}

## Testing

- GET
  curl http://localhost:3000/api/picks
- response
  [{ "team": "Dolphins", "bet": "Win", "odds": 1.75 }]
- POST
  curl -X POST http://localhost:3000/api/picks \
  -H "Content-Type: application/json" \
  -d '{"team": "Ravens", "bet": "Over 2.5 Goals", "odds": 1.95}'
- response
  { "message": "Pick added successfully" }

## Key Learnings

- How to route requests manually using Node’s native http module.
- Handling asynchronous file operations with async/await.
- Understanding response codes: 200, 201, 404.
- Testing APIs via curl and Postman.
- Managing persistence using local JSON storage.

## Next step

- Connect the API to a real SQL database for structured data managment
