# Step 1 — Basic Node.js HTTP Server (no frameworks)

**Goal:**  
Understand how to create a simple HTTP server from scratch using pure Node.js (without frameworks).

---

## Technologies Used

- **Node.js** → to handle HTTP requests and responses.
- **fs/promises** → for reading files asynchronously using promises.
- **async / await** → for non-blocking asynchronous operations.
- **UTF-8** → to properly decode text files into readable strings.

---

## Key Concepts Learned

- How Node.js handles HTTP requests using `http.createServer()`.
- The difference between `req` (incoming request) and `res` (outgoing response).
- How routing works (handling `/`, `/health`, and 404 paths).
- How to read and send files using `readFile()` from `fs/promises`.
- Why `fs/promises` is better than the old callback-style `fs` module.
- What `async/await` does and how it makes Node more efficient.
- What `"utf8"` means and how it decodes raw bytes into readable text.

## Insights / Reflections

- Learned how Node handles HTTP under the hood without any framework.
- Understood that async/await allows Node to keep handling multiple users while waiting for slow tasks (like file reading).
- Building this from scratch gave me a clear mental model of how the web works at the lowest level.
- I am very motivated, I hope to continue like this throughout the entire process.

## Next Step

- The next step will be to create a real API endpoint, and connect it to a SQLite database using SQL queries - no ORM, no abstaction, just logic and understanding

---

## I tested the server using the following routes

- / HTML page (index.html) Main page
- / health {ok: true} Health check JSON
- / random 'Not found' 404 not found

## Final Code (version 1.0)

```js
// server.js — Minimal Node.js HTTP server
import http from "http";
// with fs/promises we avoid 'callback hell' using Promises
import { readFile } from "fs/promises";

const PORT = 3000;

// async/await lets Node work in the background without blocking while waiting
const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    // Provide HTML file (home page)
    const html = await readFile("./public/index.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } else if (req.url === "/health") {
    // Health check route
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } else {
    // Error path
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found 💀");
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
```
