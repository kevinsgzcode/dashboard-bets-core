//Fetch latest game result from TheSportsDB API
import https from "https";

//Helper function to fetch data from a given URL
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        //acumulate chunks
        res.on("data", (chunk) => (data += chunk));

        //parse JSON at the end
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

//Main handle function
export async function handleScores(req, res) {
  //Only accept GET requests
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  //Extract team name from query
  const url = new URL(req.url, `http://${req.headers.host}`);
  const team = url.searchParams.get("team");

  if (!team) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Missin 'team' parameter" }));
  }
  try {
    //Search team by name to get ID
    const searchURL = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
      team
    )}`;
    const teamData = await fetchJSON(searchURL);
    const teamInfo = teamData.teams?.[0];

    if (!teamInfo) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Team not found" }));
    }

    const teamId = teamInfo.idTeam;

    //Get last event for the team
    const lastEventURL = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
    const lastEventData = await fetchJSON(lastEventURL);

    const event = lastEventData.results?.[0];
    if (!event) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "No recent events found" }));
    }

    //Determine win/loss
    const homeTeam = event.strHomeTeam;
    const awayTeam = event.srtAwayTeam;
    const homeScore = Number(event.intHomeScore);
    const awayScore = Number(event.intAwayScore);

    let result = "pending";
    if (event.strStatus === "Match Finished") {
      if (
        (team === homeTeam && homeScore > awayScore) ||
        (team === awayTeam && awayScore > homeScore)
      ) {
        result = "won";
      } else {
        result = "lost";
      }
    }
    //Send response
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        team,
        opponent: team === homeTeam ? awayTeam : homeTeam,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        result,
      })
    );
  } catch (err) {
    console.error("Error fetching score:", err);
    res.writeHead(500, { "Content - Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to fetch scores" }));
  }
}
