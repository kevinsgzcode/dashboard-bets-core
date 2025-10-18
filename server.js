// server.js — Minimal Node.js HTTP server
import http from "http";
//with fs/promises avoid 'callback hell' whit promisses
import { readFile } from "fs/promises";
import { handlePicks } from "./api/picks.js";

const PORT = 3000;

//async/await lets Node work in the background without stopping while waiting for results.

// Create the server
//utf8 Decodes bytes to readable text
const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    //provide HTML file (face of page)
    const html = await readFile("./public/index.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } else if (req.url === "/health") {
    //state path
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } else if (req.url.startsWith("/api/picks")) {
    //Route request to the picks API handle
    await handlePicks(req, res);
  } else {
    //error path
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
