// server.js — Minimal Node.js HTTP server
import http from "http";
import fs from "fs/promises";
import { handlePicks } from "./api/picks.js";
import { handleStats } from "./api/stats.js";
import path from "path";
import { fileURLToPath } from "url";
import { handleScores } from "./api/scores.js";
import { setupDataBase } from "./db/setup.js";
import { handleUpdateResults } from "./api/updateResults.js";
import { handleUsers } from "./api/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

//async/await lets Node work in the background without stopping while waiting for results.

// Create the server
const server = http.createServer(async (req, res) => {
  //Handle API routes
  if (req.url.startsWith("/api/picks")) {
    return handlePicks(req, res);
  }

  //handle users
  if (req.url.startsWith("/api/users")) {
    return handleUsers(req, res);
  }

  //handle scores
  if (req.url.startsWith("/api/scores")) {
    return handleScores(req, res);
  }

  //handle Update Results
  if (req.url.startsWith("/api/update-results")) {
    return handleUpdateResults(req, res);
  }

  //Handle stats
  if (req.url.startsWith("/api/stats")) {
    return handleStats(req, res);
  }

  // Ignore Chrome DevTools and favicon requests
  if (req.url.includes(".well-known") || req.url === "/favicon.ico") {
    res.writeHead(204); // No Content
    return res.end();
  }

  //Static files
  const filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "index.html" : req.url
  );
  const ext = path.extname(filePath);

  // Map file extensions to proper MIME types
  // This ensures the browser renders HTML, CSS, JS, and JSON correctly
  const contentType =
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
    }[ext] || "text/plain";

  try {
    console.log("Request URL:", req.url); //try to find bugs
    console.log("Resolved filePath:", filePath); //try to find bugs
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not found");
  }
});

//Fuction to auto-update pending picks at startup
async function autoUpdatePicks() {
  try {
    console.log("🔄 Checking pending pick");
    // Simulate an internal GET request to /api/update-result
    const fakeReq = { method: "GET", url: "/api/update-results", headers: {} };
    const fakeRes = {
      writeHead: () => {},
      end: (msg) => {
        console.log("✅ Auto-Update response:", msg);
      },
    };
    await handleUpdateResults(fakeReq, fakeRes);
    console.log("Auto-Update completed succesfully");
  } catch (err) {
    console.error("Auto-Update error:", err);
  }
}

//Auto-setup before starting the server
(async () => {
  setupDataBase(); //ensure DB & table exist
  await autoUpdatePicks(); //run auto-update after DB is ready

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
