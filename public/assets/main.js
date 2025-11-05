// Frontend logic for Dashboard Bets Core
// Handles full CRUD operations via Fetch API

//Local state for filtering
let allPicks = []; //data from backend
let filteredPicks = [];

//Fetch and display global stats
async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error("Failed to load stats");

    const data = await res.json();

    //Update UI
    document.getElementById(
      "initial-bank"
    ).textContent = `$${data.initialBank.toFixed(2)}`;
    document.getElementById(
      "current-bank"
    ).textContent = `$${data.currentBank.toFixed(2)}`;
    document.getElementById(
      "total-stake"
    ).textContent = `$${data.totalStake.toFixed(2)}`;
    document.getElementById(
      "total-profitloss"
    ).textContent = `$${data.totalProfitLoss.toFixed(2)}`;
    document.getElementById("roi").textContent = `${data.ROI}%`;

    //show the panel
    document.getElementById("stats-panel").style.display = "block";
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

//Create table row dynamically
function createRow(pick) {
  const row = document.createElement("tr");

  //Format Profit/Loss
  const profitColor =
    pick.profitLoss > 0 ? "green" : pick.profitLoss < 0 ? "red" : "gray";

  //Format match date
  const formattedDate = pick.match_date
    ? new Date(pick.match_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  row.innerHTML = `
    <td>${pick.league || "-"}</td>
    <td>${pick.team}</td>
    <td>${pick.bet}</td>
    <td>${pick.odds.toFixed(2)}</td>
    <td>${pick.stake?.toFixed(2) ?? 0} </td>
    <td>${pick.possibleWin?.toFixed(2) ?? 0}</td>
    <td style="color:${profitColor}; font-weight:500;">${
    pick.profitLoss?.toFixed(2) ?? 0
  }</td>
    <td>${formattedDate}</td>
    <td>${pick.result}</td>
    <td>
      <button class="delete-btn" data-id="${pick.id}">Delete</button>
    </td>
  `;
  return row;
}

//Render given picks array into te table
function renderPicks(picks) {
  const tbody = document.getElementById("picks-body");
  const loading = document.getElementById("loading");
  const table = document.getElementById("picks-table");

  tbody.replaceChildren(); //clean table
  picks.forEach((pick) => tbody.appendChild(createRow(pick)));

  //show table + filters
  loading.style.display = "none";
  table.style.display = "table";
  document.getElementById("filters-section").style.display = "block";

  if (picks.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="10" style="text-align:center; color:gray;">No picks found</td>';
    tbody.appendChild(emptyRow);
  }
  const total = document.getElementById("picks-count");
  if (total) total.textContent = `Showing ${picks.length} picks`;
}

//Load all picks and render in the table
async function loadPicks() {
  const loading = document.getElementById("loading");

  try {
    // Fetch data from backend API
    const response = await fetch("/api/picks");
    if (!response.ok) throw new Error("Failed to load picks");

    const data = await response.json();

    allPicks = data; //keep full dataset in memory
    filteredPicks = [...allPicks]; //initial state

    renderPicks(filteredPicks);
  } catch (error) {
    loading.textContent = "Error loading picks";
    console.error(error);
  }
}

//Handle form submission (Create new pick with stake)

async function createPick(event) {
  event.preventDefault();

  const team = document.getElementById("team").value.trim();
  const bet = document.getElementById("bet").value.trim();
  const odds = parseFloat(document.getElementById("odds").value);
  const stake = parseFloat(document.getElementById("stake").value);
  const message = document.getElementById("form-message");
  const league = document.getElementById("league").value;
  const match_date = document.getElementById("match_date").value;

  // Basic form validation
  if (!team || !bet || isNaN(odds) || isNaN(stake) || !league || !match_date) {
    message.textContent = "Please fill all fields correctly";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, bet, odds, stake, league, match_date }),
    });

    if (!response.ok) throw new Error("Failed to create pick");

    const result = await response.json();

    //Append new row directly instead of reloading entire table
    const tbody = document.getElementById("picks-body");
    tbody.prepend(createRow(result.pick)); //adds pick instantly

    message.textContent = "✅ Pick added successfully!";
    message.style.color = "green";
    document.getElementById("new-pick-form").reset();
    await loadStats();
  } catch (err) {
    console.error(err);
    message.textContent = "Error adding pick";
    message.style.color = "red";
  }
}

//PUT - Update result of a pick
async function updatePick(id, result) {
  try {
    const response = await fetch(`/api/picks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });

    if (!response.ok) throw new Error("Failed to update pick");

    console.log("Pick updated:", await response.json());
    await loadPicks(); //Refresh table to reflect change
    await loadStats(); //refresh stats
  } catch (err) {
    console.error(err);
    alert("Error updating pick");
  }
}

//DELETE - Remove pick
async function deletePick(id) {
  try {
    const response = await fetch(`/api/picks/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete pick");

    console.log("Pick deleted:", await response.json());
    await loadPicks(); //Reload table to reflect removal
    await loadStats(); //Reload stats
  } catch (err) {
    console.error(err);
    alert("Error deleting pick");
  }
}

//Add charts
let performanceChart;

async function loadChart() {
  try {
    const res = await fetch("/api/picks");
    const picks = await res.json();

    if (!picks.length) return;

    const ctx = document.getElementById("performanceChart").getContext("2d");

    //prepare data
    const labels = picks.map((p) => p.team);
    const profitData = picks.map((p) => p.profitLoss);

    //Destroy previuos chart if exist
    if (performanceChart) performanceChart.destroy();

    performanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Profit / Loss",
            data: profitData,
            backgroundColor: profitData.map((val) =>
              val >= 0 ? "rgba(0, 255, 176, 0.6)" : "rgba(244, 67, 54, 0.6)"
            ),
            borderColor: profitData.map((val) =>
              val >= 0 ? "#00ffb0" : "#f44336"
            ),
            borderWidth: 1.2,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.1)" },
            ticks: { color: "#ccc" },
          },
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#ccc" },
          },
        },
      },
    });
    //show chart section
    document.getElementById("chart-section").style.display = "block";
  } catch (err) {
    console.error("Error loading chart:", err);
  }
}

//Filters logic
function setupFilters() {
  const teamInput = document.getElementById("filterTeam");
  const resultSelect = document.getElementById("filterResult");
  const fromDate = document.getElementById("filterFrom");
  const toDate = document.getElementById("filterTo");

  if (!teamInput) return; //safety check

  teamInput.addEventListener("input", applyFilters);
  resultSelect.addEventListener("change", applyFilters);
  fromDate.addEventListener("change", applyFilters);
  toDate.addEventListener("change", applyFilters);
}

//filters
function applyFilters() {
  const teamInput = document.getElementById("filterTeam").value.toLowerCase();
  const resultSelect = document.getElementById("filterResult").value;
  const fromDate = document.getElementById("filterFrom").value;
  const toDate = document.getElementById("filterTo").value;

  //Created a new filtered copy of the original state
  filteredPicks = allPicks.filter((pick) => {
    // team filter
    const matchesTeam = teamInput
      ? pick.team.toLowerCase().includes(teamInput)
      : true;

    // result filter
    const matchesResult = resultSelect ? pick.result === resultSelect : true;

    // date filter
    const pickDate = pick.match_date ? new Date(pick.match_date) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const matchesDate =
      (!from || (pickDate && pickDate >= from)) &&
      (!to || (pickDate && pickDate <= to));

    return matchesTeam && matchesResult && matchesDate;
  });

  //show filters in table
  renderPicks(filteredPicks);
}

//DOMContentLoaded — Initialize once
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("picks-body");

  //Load NFL teams
  document.getElementById("league").addEventListener("change", async (e) => {
    const league = e.target.value;
    if (!league) return;

    const teamSelect = document.getElementById("team");
    teamSelect.innerHTML = "<option value=''>Loading teams...</option>";

    //Local fallback
    const nflTeams = [
      "Arizona Cardinals",
      "Atlanta Falcons",
      "Baltimore Ravens",
      "Buffalo Bills",
      "Carolina Panthers",
      "Chicago Bears",
      "Cincinnati Bengals",
      "Cleveland Browns",
      "Dallas Cowboys",
      "Denver Broncos",
      "Detroit Lions",
      "Green Bay Packers",
      "Houston Texans",
      "Indianapolis Colts",
      "Jacksonville Jaguars",
      "Kansas City Chiefs",
      "Las Vegas Raiders",
      "Los Angeles Chargers",
      "Los Angeles Rams",
      "Miami Dolphins",
      "Minnesota Vikings",
      "New England Patriots",
      "New Orleans Saints",
      "New York Giants",
      "New York Jets",
      "Philadelphia Eagles",
      "Pittsburgh Steelers",
      "San Francisco 49ers",
      "Seattle Seahawks",
      "Tampa Bay Buccaneers",
      "Tennessee Titans",
      "Washington Commanders",
    ];

    try {
      const leagueName = league === "NFL" ? "National Football League" : league;
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(
          leagueName
        )}`
      );

      const data = await res.json();

      let teams = [];

      //Usea API if available, otherwise fallback
      if (Array.isArray(data.teams)) {
        teams = data.teams.map((t) => t.strTeam);
        console.log(`Loaded ${teams.length} teams from API`);
      } else {
        teams = nflTeams;
        console.warn("API returned null, using local fallback list");
      }

      //Show options
      teamSelect.innerHTML = "<option value=''>Select a team</option>";
      teams.forEach((team) => {
        const option = document.createElement("option");
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading teams:", err);
      teamSelect.innerHTML = "<option value=''>Error loading teams</option>";
    }
  });

  //Event delegation for Delete (attached ONCE)
  tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id = target.dataset.id;

    // Handle Delete
    if (target.classList.contains("delete-btn")) {
      const confirmDelete = confirm("Delete this pick?");
      if (confirmDelete) await deletePick(id);
    }
  });

  // Handle form submission for new picks
  document
    .getElementById("new-pick-form")
    .addEventListener("submit", createPick);

  // Load initial data
  loadPicks();
  loadStats();
  loadChart();
  setupFilters();
});
