//This middleware verifies the session token for protected routes

import { getDb } from "../../db/connect.js";

export function verifySession(req) {
  const db = getDb();
  const authHeader = req.headers["authorization"]; //expect token

  if (!authHeader) {
    console.warn("No authorization header provided");
    return null;
  }

  //remove bearer prefix
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    console.warn("Empty token provided");
    return null;
  }

  //check session in DB
  const session = db
    .prepare("SELECT * FROM sessions WHERE token = ?")
    .get(token);
  if (!session) {
    console.warn("Invalid or expired session");
    return null;
  }

  console.log(`🔑 Session validated for user_id: ${session.user_id}`);
  return session.user_id; //return valid user_id
}
