//API route for user managment

import { getDb } from "../db/connect.js";

export async function handleUsers(req, res) {
  const db = getDb();

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  //GET - return users
  if (req.method === "GET") {
    const users = db
      .prepare("SELECT id, username, initialBank from users")
      .all();
    return res.end(JSON.stringify(users));
  }

  //POST - Create new user
  if (req.method === "POST") {
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
