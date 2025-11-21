// Handles: Auth, Picks CRUD, Stats, Chart, Filters

// Local state
let allPicks = [];
let filteredPicks = [];
let performanceChart = null;
let nflTeamList = [];

//Global salt
const FRONTEND_SALT = "BETSCORE_s$9!Qp7Z2@xF1vT";

// Hashing implementation
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

function americanToDecimal(odds) {
  const value = Number(odds);
  if (isNaN(value)) return null;

  if (value > 0) return 1 + value / 100;
  if (value < 0) return 1 + 100 / Math.abs(value);

  return null;
}

function parseOdds(rawOdds) {
  const str = String(rawOdds).trim();

  if (str.startsWith("+") || str.startsWith("-")) {
    return americanToDecimal(str);
  }

  const dec = Number(str);
  if (!isNaN(dec) && dec > 1.0) return dec;

  return null;
}

function calculatePossibleWin(stake, rawOdds) {
  const decimal = parseOdds(rawOdds);
  if (!decimal) return 0;
  return stake * decimal;
}

//hash password + salt
async function hashPassword(password) {
  return await sha256(password + FRONTEND_SALT);
}

//  SESSION CHECK ON LOAD
async function checkSession() {
  const token = localStorage.getItem("token");

  if (token) {
    console.log("✅ Token found, user already logged in");

    //Hide auth section
    document.getElementById("auth-section").style.display = "none";
    //show dashboard container
    document.getElementById("dashboard-container").style.display = "block";
    //show logout
    document.getElementById("logout-section").style.display = "block";
    //show dashboard sections
    document.getElementById("picks-section").style.display = "block";
    document.getElementById("filters-and-table").style.display = "block";
    document.getElementById("new-pick-section").style.display = "block";
    document.getElementById("user-display").textContent =
      "Welcome " + localStorage.getItem("username");

    await loadPicks();
    await loadStats();
    await loadChart();
  } else {
    console.log("❌ No session stored");
    // Show login/register
    document.getElementById("auth-section").style.display = "block";

    //hide dashboard
    document.getElementById("dashboard-container").style.display = "none";
    document.getElementById("logout-section").style.display = "none";
    document.getElementById("filters-and-table").style.display = "none";
    document.getElementById("new-pick-section").style.display = "none";
  }
}

//  REGISTER
async function registerUser(e) {
  e.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const initialBank = parseFloat(document.getElementById("reg-bank").value);
  const msg = document.getElementById("auth-message");

  try {
    //frontend hashing
    const hashedPassword = await hashPassword(password);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: hashedPassword, initialBank }),
    });

    const data = await res.json();

    if (data.success) {
      msg.style.color = "green";
      msg.textContent = "Registered successfully! You can now log in.";
      document.getElementById("register-form").reset();
    } else {
      msg.style.color = "red";
      msg.textContent = data.error || "Registration failed";
    }
  } catch (err) {
    console.error("Register error:", err);
    msg.textContent = "Connection error";
    msg.style.color = "red";
  }
}

//  LOGIN
async function loginUser(e) {
  e.preventDefault();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const msg = document.getElementById("auth-message");

  try {
    //frontend hashing
    const hashedPassword = await hashPassword(password);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: hashedPassword }),
    });

    const data = await res.json();

    if (!data.success) {
      msg.style.color = "red";
      msg.textContent = data.error || "Login failed";
      return;
    }

    // Store session data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", username);

    msg.style.color = "green";
    msg.textContent = "Login successful!";

    // Show dashboard
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("dashboard-container").style.display = "block";
    document.getElementById("logout-section").style.display = "block";
    document.getElementById("picks-section").style.display = "block";
    document.getElementById("filters-and-table").style.display = "block";
    document.getElementById("new-pick-section").style.display = "block";
    document.getElementById("user-display").textContent =
      "Welcome " + localStorage.getItem("username");

    await loadPicks();
    await loadStats();
    await loadChart();
  } catch (err) {
    console.error("Login error:", err);
    msg.textContent = "Connection error";
    msg.style.color = "red";
  }
}

//  LOGOUT
async function logoutUser() {
  const token = localStorage.getItem("token");

  try {
    await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Logout error:", err);
  }

  localStorage.clear();
  alert("Logged out!");
  location.reload();
}

//  LOAD STATS
async function loadStats() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  if (!token || !userId) return;

  try {
    const res = await fetch(`/api/stats?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to load stats");

    const data = await res.json();

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

    document.getElementById("stats-panel").style.display = "block";
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

//  LOAD PICKS
async function loadPicks() {
  const loading = document.getElementById("loading");
  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");

  if (!token || !user_id) {
    loading.textContent = "Please log in";
    return;
  }

  try {
    const res = await fetch(`/api/picks?user_id=${user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to load picks");

    const data = await res.json();
    allPicks = [...data];
    filteredPicks = [...allPicks];

    renderPicks(filteredPicks);

    loading.style.display = "none";
    document.getElementById("filters-and-table").style.display = "block";
    document.getElementById("picks-table").style.display = "table";
  } catch (err) {
    loading.textContent = "Error loading picks";
    console.error("Load picks error:", err);
  }
}

//  CREATE PICK
async function createPick(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");
  const msg = document.getElementById("form-message");

  if (!token || !user_id) {
    msg.textContent = "Please log in first";
    msg.style.color = "red";
    return;
  }

  const team = document.getElementById("team").value.trim();

  //validation autocomplete
  if (!nflTeamList.includes(team)) {
    msg.textContent = "Please select a valid team";
    msg.style.color = "red";
    return;
  }

  const bet = document.getElementById("bet").value.trim();
  const odds = document.getElementById("odds").value.trim();
  const stake = parseFloat(document.getElementById("stake").value);
  const league = document.getElementById("league").value;
  const match_date = document.getElementById("match_date").value;

  //odds validation for american an decimal
  const oddsPattern = /^(\+|-)?\d+(\.\d+)?$/;

  if (!oddsPattern.test(odds)) {
    msg.textContent = "Invalid odds format. Use formats like -110 or +150, etc";
    msg.style.color = "red";
    return;
  }

  const oddsValue = Number(odds);

  if (odds.startsWith("+") || odds.startsWith("-")) {
    //American odds
    if (Math.abs(oddsValue) < 100) {
      msg.textContent = "American odds must be ≥ +100 or ≤ -100.";
      msg.style.color = "red";
      return;
    }
  } else {
    //decimal or integer
    if (oddsValue < 1.01) {
      msg.textContent = "Decimal odds must be greater than 1.01.";
      msg.style.color = "red";
      return;
    }
  }

  //general validation
  if (!team || !bet || !odds || isNaN(stake) || !league || !match_date) {
    msg.textContent = "Fill all fields correctly";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/picks", {
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

    if (!res.ok) throw new Error("Failed to create pick");

    const { pick } = await res.json();

    document.getElementById("picks-body").prepend(createRow(pick));

    msg.textContent = "Pick added successfully!";
    msg.style.color = "green";

    document.getElementById("new-pick-form").reset();

    await loadStats();
    await loadChart();
  } catch (err) {
    msg.textContent = "Error adding pick";
    msg.style.color = "red";
    console.error(err);
  }
}

//  DELETE PICK
async function deletePick(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You must be logged in to delete picks");
    return;
  }

  try {
    const response = await fetch(`/api/picks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete pick");

    console.log("Pick deleted:", await response.json());
    await loadPicks();
    await loadStats();
    await loadChart();
  } catch (err) {
    console.log(err);
    alert("Error deleting pick");
  }
}

//  RENDER TABLE
function createRow(pick) {
  const row = document.createElement("tr");

  const profitColor =
    pick.profitLoss > 0 ? "green" : pick.profitLoss < 0 ? "red" : "gray";

  const formattedDate = pick.match_date
    ? new Date(pick.match_date).toLocaleDateString("en-US")
    : "-";

  row.innerHTML = `
    <td>${pick.league}</td>
    <td>${pick.team}</td>
    <td>${pick.bet}</td>
    <td>${pick.odds}</td>
    <td>${Number(pick.stake).toFixed(2)}</td>
    <td>${Number(pick.possibleWin).toFixed(2)}</td>
    <td style="color:${profitColor}">${Number(pick.profitLoss).toFixed(2)}</td>
    <td>${formattedDate}</td>
    <td>${pick.result}</td>
    <td><button class="delete-btn" data-id="${pick.id}">Delete</button></td>
  `;
  return row;
}

function renderPicks(picks) {
  const tbody = document.getElementById("picks-body");
  tbody.innerHTML = "";

  if (picks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:gray;">No picks found</td></tr>`;
    return;
  }

  picks.forEach((p) => tbody.appendChild(createRow(p)));
}

// CHART
async function loadChart() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  if (!token || !userId) return;

  try {
    const res = await fetch(`/api/picks?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error();

    const picks = await res.json();

    const chartSection = document.getElementById("chart-section");
    const emptyMsgx = document.getElementById("chart-empty");
    const canvas = document.getElementById("performanceChart");

    const ctx = document.getElementById("performanceChart").getContext("2d");
    if (!picks.length) {
      if (performanceChart) performanceChart.destroy();

      chartSection.style.display = "block";
      emptyMsgx.style.display = "block";
      canvas.style.display = "none";
      return;
    }

    emptyMsgx.style.display = "none";
    canvas.style.display = "block";

    if (performanceChart) performanceChart.destroy();

    performanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: picks.map((p) => p.team),
        datasets: [
          {
            label: "Profit / Loss",
            data: picks.map((p) => p.profitLoss),
            backgroundColor: picks.map((v) =>
              v >= 0 ? "rgba(0,255,176,0.6)" : "rgba(244,67,54,0.6)"
            ),
            borderColor: picks.map((v) => (v >= 0 ? "#00ffb0" : "#f44336")),
            borderWidth: 1.2,
          },
        ],
      },
    });

    document.getElementById("chart-section").style.display = "block";
  } catch (err) {
    console.error("Chart error:", err);
  }
}

//fetch Nfl Teams
async function fetchNFLTeams() {
  const fallbackNFL = [
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
    const res = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NFL"
    );

    const data = await res.json();

    if (Array.isArray(data.teams)) {
      const teams = data.teams.map((t) => t.strTeam).sort();
      console.log("🏈 NFL teams loaded from API", teams.length);
      return teams;
    }
    //API Return null
    console.warn("⚠️ API return null, using fallback");
    return fallbackNFL.sort();
  } catch (err) {
    console.log("❌ NFL API failed, using fallback".err);
    return fallbackNFL.sort();
  }
}

// FILTERS
function setupFilters() {
  document.getElementById("filterTeam").addEventListener("input", applyFilters);
  document
    .getElementById("filterResult")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterFrom")
    .addEventListener("change", applyFilters);
  document.getElementById("filterTo").addEventListener("change", applyFilters);
}

function applyFilters() {
  const team = document.getElementById("filterTeam").value.toLowerCase();
  const result = document.getElementById("filterResult").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;

  filteredPicks = allPicks.filter((p) => {
    const matchesTeam = team ? p.team.toLowerCase().includes(team) : true;
    const matchesResult = result ? p.result === result : true;

    const date = p.match_date ? new Date(p.match_date) : null;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const matchesDate =
      (!fromDate || (date && date >= fromDate)) &&
      (!toDate || (date && date <= toDate));

    return matchesTeam && matchesResult && matchesDate;
  });

  renderPicks(filteredPicks);
}

// 12. INITIALIZE

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("register-form")
    .addEventListener("submit", registerUser);
  document.getElementById("login-form").addEventListener("submit", loginUser);
  document.getElementById("logout-btn").addEventListener("click", logoutUser);

  document
    .getElementById("new-pick-form")
    .addEventListener("submit", createPick);

  const teamInput = document.getElementById("team");
  const suggestions = document.getElementById("team-suggestions");

  teamInput.addEventListener("input", () => {
    const value = teamInput.value.toLowerCase();

    if (!value) {
      suggestions.style.display = "none";
      suggestions.innerHTML = "";
      return;
    }

    //filter teams
    const filtered = nflTeamList.filter((t) => t.toLowerCase().includes(value));

    if (filtered.length === 0) {
      suggestions.style.display = "none";
      suggestions.innerHTML = "";
      return;
    }

    suggestions.innerHTML = "";
    suggestions.style.display = "block";

    filtered.forEach((team) => {
      const div = document.createElement("div");
      div.classList.add("autocomplete-item");
      div.textContent = team;

      div.addEventListener("click", () => {
        teamInput.value = team;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
      });
      suggestions.appendChild(div);
    });
  });

  const leagueSelect = document.getElementById("league");

  leagueSelect.addEventListener("change", async (e) => {
    const league = e.target.value;
    const teamSelect = document.getElementById("team");

    if (!league) {
      teamSelect.innerHTML = "<option value=''>Select a team</option>";
      return;
    }
    //Show loading
    teamSelect.innerHTML = "<option value=''>Loading teams...</option>";
    if (league === "NFL") {
      nflTeamList = await fetchNFLTeams(); //save global list

      teamInput.value = "";
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
    }
  });

  setupFilters();
  checkSession();

  // Delete pick delegation
  document.getElementById("picks-body").addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (confirm("Delete this pick?")) deletePick(id);
    }
  });
});
