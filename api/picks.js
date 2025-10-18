import { readFile, writeFile } from "fs/promises";

//Path to the file were picks will storage
const DATA_PATH = "./data/picks.json";

//function to handle all the requests
//this block reads the picks and returns them as JSON
export async function handlePicks(req, res) {
  if (req.method === "GET") {
    // Read all picks in picks.json
    const data = await readFile(DATA_PATH, "utf8");
    //everything went well
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(data);
    //check if client sent data
  } else if (req.method === "POST") {
    //Add new pick
    let body = "";
    req.on("data", (chunk) => {
      //transform data to string
      body += chunk.toString();
    });
    //this block recibe new pick and add to the file
    req.on("end", async () => {
      //transform text to object JavaScript
      const newPick = JSON.parse(body);
      //read data and transform in new array
      const data = JSON.parse(await readFile(DATA_PATH, "utf8"));
      //push new pick
      data.push(newPick);
      //udate file
      await writeFile(DATA_PATH, JSON.stringify(data, null, 2));
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ message: "Pick added successfully" }));
    });
    //just prevent fails
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
  }
}

//Node handles the body of a request as a stream
//which means that the data doesn't arrive all at once, but in small pieces called chunks.
