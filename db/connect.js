//import dependencies
import sqlite3 from "sqlite3"; //native drive
import { open } from "sqlite"; //API promises

sqlite3.verbose();

let _db; //singleton simple

//Initialize and open the database
export async function getDb() {
  if (_db) return _db;
  _db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });
  console.log("Connected to SQLite database");
  return _db;
}
