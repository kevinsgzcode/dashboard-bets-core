//import dependencies
import Database from "better-sqlite3";

let _db; //singleton simple

//Initialize and open the database
export function getDb() {
  if (_db) return _db;
  _db = new Database("./db/database.db");
  return _db;
}
console.log("💾 Connected to SQLite database");
