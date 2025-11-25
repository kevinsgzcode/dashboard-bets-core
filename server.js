// server.js — Minimal Node.js HTTP server
import http from "http";
import https from "https";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { handlePicks } from "./api/picks.js";
import { handleStats } from "./api/stats.js";
import { handleScores } from "./api/scores.js";
import { handleUpdateResults } from "./api/updateResults.js";
import { handleUsers } from "./api/users.js";
import { setupDataBase } from "./db/setup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // STEP 1: CLEAN THE URL (Fixes the "/?" Bug)
  let cleanUrl = req.url.split("?")[0];
  if (!cleanUrl || cleanUrl === "") cleanUrl = "/";

  console.log("Request URL:", req.url);
  console.log("Clean URL:", cleanUrl);

  // --- API ROUTES ---
  if (cleanUrl.startsWith("/api/picks")) {
    return handlePicks(req, res);
  }

  if (
    cleanUrl.startsWith("/api/register") ||
    cleanUrl.startsWith("/api/login")
  ) {
    return handleUsers(req, res);
  }

  if (cleanUrl.startsWith("/api/users")) {
    return handleUsers(req, res);
  }

  if (cleanUrl.startsWith("/api/logout")) {
    return handleUsers(req, res);
  }

  if (cleanUrl.startsWith("/api/scores")) {
    return handleScores(req, res);
  }

  if (cleanUrl.startsWith("/api/update-results")) {
    return handleUpdateResults(req, res);
  }

  if (cleanUrl.startsWith("/api/stats")) {
    return handleStats(req, res);
  }

  // --- INTERNAL PROXY FOR ODDS ---
  if (cleanUrl.startsWith("/api/proxy")) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const target = urlObj.searchParams.get("url");

    if (!target) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing url param" }));
    }

    console.log("🔁 Proxying request to:", target);

    https
      .get(target, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => (data += chunk));
        proxyRes.on("end", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(data);
        });
      })
      .on("error", (err) => {
        console.error("❌ Proxy error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Proxy failed" }));
      });

    return;
  }

  // Ignore Chrome DevTools and favicon
  if (cleanUrl === "/favicon.ico" || cleanUrl.includes(".well-known")) {
    res.writeHead(204);
    return res.end();
  }

  // --- STATIC FILES (fix for /?) ---
  const filePath = path.join(
    __dirname,
    "public",
    cleanUrl === "/" ? "index.html" : cleanUrl
  );

  const ext = path.extname(filePath);
  const contentType =
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
    }[ext] || "text/plain";

  try {
    console.log("Resolved filePath:", filePath);
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not found");
  }
});

// Start the server
(async () => {
  setupDataBase();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
