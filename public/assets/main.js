// Frontend logic for Dashboard Bets Core
// Handles full CRUD operations via Fetch API

//Create table row dynamically
function createRow(pick) {
  const row = document.createElement("tr");

  //Format Profit/Loss
  const profitColor =
    pick.profitLoss > 0 ? "green" : pick.profitLoss < 0 ? "red" : "gray";

  row.innerHTML = `
    <td>${pick.team}</td>
    <td>${pick.bet}</td>
    <td>${pick.odds.toFixed(2)}</td>
    <td>${pick.stake?.toFixed(2) ?? 0} </td>
    <td>${pick.possibleWin?.toFixed(2) ?? 0}</td>
    <td style="color:${profitColor}; font-weight:500;">${
    pick.profitLoss?.toFixed(2) ?? 0
  }</td>
    <td>${pick.result}</td>
    <td>
      <button class="edit-btn" data-id="${pick.id}">Edit</button>
      <button class="delete-btn" data-id="${pick.id}">Delete</button>
    </td>
  `;
  return row;
}

//Load all picks and render in the table
async function loadPicks() {
  const loading = document.getElementById("loading");
  const table = document.getElementById("picks-table");
  const tbody = document.getElementById("picks-body");

  try {
    // Fetch data from backend API
    const response = await fetch("/api/picks");
    if (!response.ok) throw new Error("Failed to load picks");

    const picks = await response.json();

    // Clear and repopulate rows safely
    tbody.replaceChildren(); //keeps the same <tbody> reference (listeners stay alive)

    // Render all picks dynamically
    picks.forEach((pick) => tbody.appendChild(createRow(pick)));

    // Show table and hide loading text
    loading.style.display = "none";
    table.style.display = "table";
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

  // Basic form validation
  if (!team || !bet || isNaN(odds) || isNaN(stake)) {
    message.textContent = "Please fill all fields correctly";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, bet, odds, stake }),
    });

    if (!response.ok) throw new Error("Failed to create pick");

    const result = await response.json();

    //Append new row directly instead of reloading entire table
    const tbody = document.getElementById("picks-body");
    tbody.prepend(createRow(result.pick)); //adds pick instantly

    message.textContent = "✅ Pick added successfully!";
    message.style.color = "green";
    document.getElementById("new-pick-form").reset();
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
  } catch (err) {
    console.error(err);
    alert("Error deleting pick");
  }
}

//DOMContentLoaded — Initialize once
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("picks-body");

  //Fixed typo: "click" instead of "clik"
  //Event delegation for Edit/Delete (attached ONCE)
  tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id = target.dataset.id;

    // Handle Edit
    if (target.classList.contains("edit-btn")) {
      const newResult = prompt("Enter new result (won/lost/pending):");
      if (newResult) await updatePick(id, newResult.trim());
    }

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
});
