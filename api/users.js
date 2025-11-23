//API route for user managment
import { getDb } from "../db/connect.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { verifySession } from "./middleware/auth.js";

export async function handleUsers(req, res) {
  const db = getDb();
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //Register
  if (req.url === "/api/register" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { username, password, initialBank = 100 } = JSON.parse(body);

        if (!username || !password)
          return res.end(
            JSON.stringify({ error: "Username and password required" })
          );

        //check duplicate
        const existing = db
          .prepare("SELECT * FROM users WHERE username = ?")
          .get(username);
        if (existing)
          return res.end(JSON.stringify({ error: "Username already exists" }));

        //Hash password
        const hashed = await bcrypt.hash(password, 10);

        //Insert new user
        const info = db
          .prepare(
            "INSERT INTO users (username, password, initialBank) VALUES (?, ?, ?)"
          )
          .run(username, hashed, initialBank);

        return res.end(
          JSON.stringify({
            success: true,
            message: "User registered successfully",
            user_id: info.lastInsertRowid,
          })
        );
      } catch (err) {
        console.log("❌Register error:", err);
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  //Login
  if (req.url === "/api/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password)
          return res.end(JSON.stringify({ error: "Missing credentials" }));

        const user = db
          .prepare("SELECT * FROM users WHERE username = ?")
          .get(username);
        if (!user) return res.end(JSON.stringify({ error: "User not found" }));

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
          return res.end(JSON.stringify({ error: "Invalid password" }));

        //Generate token
        const token = crypto.randomBytes(24).toString("hex");
        db.prepare("INSERT INTO sessions (user_id, token) VALUES (?, ?)").run(
          user.id,
          token
        );

        return res.end(
          JSON.stringify({
            success: true,
            message: "Login successful",
            token,
            user_id: user.id,
          })
        );
      } catch (err) {
        console.log("❌Login error:", err);
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }
  //Logout
  if (req.url === "/api/logout" && req.method === "POST") {
    try {
      //Validate token
      const user_id = verifySession(req);
      if (!user_id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
      //Extract token from header
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];
      if (!token) {
        res.writeHead(400, { "Content-Type": "acpplication/json" });
        return res.end(JSON.stringify({ error: "Missing token" }));
      }
      //Delete session
      const db = getDb();
      const result = db
        .prepare("DELETE FROM sessions WHERE token = ?")
        .run(token);

      if (result.changes === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Session not found" }));
      }

      //Success
      console.log(`👋🏼 User ${user_id} logged out successfully`);
      res.writeHead(200, { "Contente-Type": "application/json" });
      return res.end(
        JSON.stringify({ success: true, message: "Logged out successfully" })
      );
    } catch (err) {
      console.log("❌ Logout error", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  //GET - return users
  if (req.method === "GET") {
    const users = db
      .prepare("SELECT id, username, initialBank from users")
      .all();
    return res.end(JSON.stringify(users));
  }

  //POST - Create new user
  if (req.url === "/api/users" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { username, initialBank } = JSON.parse(body);

        if (!username || isNaN(initialBank)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Invalid data" }));
        }
        const stmt = db.prepare(
          "INSERT INTO users (username, initialBank) VALUES (?, ?)"
        );
        const info = stmt.run(username, initialBank);

        const newUser = {
          id: info.lastInsertRowid,
          username,
          initialBank,
        };
        console.log(`✅ New user created: ${username}`);
        return res.end(JSON.stringify(newUser));
      } catch (err) {
        console.error("❌ Error creating user:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  }
}
