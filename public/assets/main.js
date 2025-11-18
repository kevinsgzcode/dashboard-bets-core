// Frontend logic for Dashboard Bets Core
// Handles full CRUD operations via Fetch API

//Local state for filtering
let allPicks = []; //data from backend
let filteredPicks = [];

//Handle login / register / logout
//check session on page load

async function checkSession() {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("✅Token found, user already logged in");
    document.getElementById("auth-seccion").style.display = "none";
    document.getElementById("logout-section").style.display = "block";
    document.getElementById("picks-seccion").style.display = "block";

    await loadPicks();
    await loadStats();
    await loadChart();
  } else {
    document.getElementById("auth-seccion").style.display = "block";
    document.getElementById("logout-section").style.display = "none";
    document.getElementById("picks-seccion").style.display = "none";
  }
}

//Register
async function registerUser(e) {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const initialBank = parseFloat(document.getElementById("reg-bank").value);
  const msg = document.getElementById("auth-message");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, initialBank }),
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = "green";
      msg.textContent = "Registered successfully! Log now";
      document.getElementById("register-form").reset();
    } else {
      msg.style.color = "red";
      msg.textContent = data.error || "Error during registration";
    }
  } catch (err) {
    console.error(err);
    msg.textContent = "Connection error";
    msg.style.color = "red";
  }
}

//login
async function loginUser(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const msg = document.getElementById("auth-message");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    //login failed
    if (!data.success) {
      msg.style.color = "red";
      msg.textContent = data.error || "Login failed";
      return;
    }

    //store session data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", username);

    msg.style.color = "green";
    msg.textContent = "✅ Login successful";

    //hide auth section and show dashboard
    document.getElementById("auth-seccion").style.display = "none";
    document.getElementById("logout-section").style.display = "block";
    document.getElementById("picks-seccion").style.display = "block";
    document.getElementById("filters-section").style.display = "block";

    //load user dashboard sections
    await loadPicks();
    await loadStats();
    await loadChart();
  } catch (err) {
    console.error("Login error:", err);
    msg.textContent = "Connection error";
    msg.style.color = "red";
  }
}

//Logout
async function logoutUser() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Logout error:", err);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("username");
  alert("Logged out!");
  location.reload();
}

//Attach event listeners
document
  .getElementById("register-form")
  .addEventListener("submit", registerUser);
document.getElementById("login-form").addEventListener("submit", loginUser);
document.getElementById("logout-btn").addEventListener("click", logoutUser);

//reun session check on load
document.addEventListener("DOMContentLoaded", checkSession);

//Fetch and display stats for the active user
async function loadStats() {
  try {
    //Authentication data from local storage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    //Prevent fecth if user is not logged in
    if (!token || !userId) {
      console.warn("No authenticated session detected");
      document.getElementById("stats-panel").style.display = "none";
      return;
    }

    //Fetch stats filtered by user
    const res = await fetch(`/api/stats?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    //handle backend error
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

    console.log(`Stats updated for user ${userId}`);
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

  //Authentication data from local storage
  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");

  //prevent fetchs if user is not autehnticated
  if (!token || !user_id) {
    loading.textContent = "Please login to view your picks";
    console.warn("Missing token or user_id");
    document.getElementById("picks-table").style.display = "none";
    return;
  }

  try {
    // Fetch users picks
    const response = await fetch(`/api/picks?user_id=${user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to load picks");

    //parse data and update state
    const data = await response.json();
    allPicks = data; //keep complete dataset in memory
    filteredPicks = [...allPicks];

    //render picks
    renderPicks(filteredPicks);

    //update UI and logs
    loading.style.display = "none";
    document.getElementById("picks-table").style.display = "table";
    console.log(`✅Loaded ${filteredPicks.length} picks for user ${user_id}`);
  } catch (err) {
    loading.textContent = "Error loading picks";
    console.error("Error loading picks:", err);
  }
}

//Handle create new pick with stake)
async function createPick(event) {
  event.preventDefault();

  //Authentication data from local storage
  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");
  const message = document.getElementById("form-message");

  //prevent submission if no user
  if (!token || !user_id) {
    message.textContent = "Please log in before adding picks";
    message.style.color = "red";
    console.warn("Attemptend to create pick without authentication");
    return;
  }

  const team = document.getElementById("team").value.trim();
  const bet = document.getElementById("bet").value.trim();
  const odds = parseFloat(document.getElementById("odds").value);
  const stake = parseFloat(document.getElementById("stake").value);
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        team,
        bet,
        odds,
        stake,
        league,
        match_date,
        user_id,
      }),
    });

    if (!response.ok) throw new Error("Failed to create pick");

    //Append new row dynamically
    const result = await response.json();
    const tbody = document.getElementById("picks-body");
    tbody.prepend(createRow(result.pick)); //adds pick instantly

    //reset form
    message.textContent = "✅ Pick added successfully!";
    message.style.color = "green";
    document.getElementById("new-pick-form").reset();

    //refresh stats and chart after adding new pick
    await loadStats();
    await loadChart();
    console.log(`✅Pick created successfuly for user ${user_id}`);
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
    //Authentication data from local storage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    //Prevent if user is not logged in
    if (!token || !userId) {
      console.warn("No authenticated session");
      return;
    }

    //Fetchs picks
    const res = await fetch(`/api/picks?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to load chart data");

    const picks = await res.json();

    //stop if no data exist
    if (!picks.length) {
      console.log("No picks avalible to generate chart");
      document.getElementById("chart-section").style.display = "none";
      return;
    }

    //prepare data chart
    const ctx = document.getElementById("performanceChart").getContext("2d");
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
    console.log(`📈 Chart updated successfully for user ${userId}`);
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

  //Load dash board data if a valid token exists
  document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    //attach form listeners
    const pickForm = document.getElementById("new-pick-form");
    if (!pickForm) pickForm.addEventListener("submit", createPick);

    setupFilters();

    if (token) {
      console.log("Authenticated session detected");
      await loadPicks();
      await loadStats();
      await loadChart();
    } else {
      console.log("No toekn, user must login first");
    }
  });
});
