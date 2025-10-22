//Frontend logic for Dashboard

//Fetch picks from the API and render them in the table
async function loadPicks() {
  const loading = document.getElementById("loading");
  const table = document.getElementById("picks-table");
  const tbody = document.getElementById("picks-body");

  try {
    //Fetch data from backen API
    const response = await fetch("/api/picks");
    if (!response.ok) throw new Error("Failed to load picks");

    const picks = await response.json();

    //clean previuos rows
    tbody.innerHTML = "";

    //render picks in table
    picks.forEach((pick) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${pick.team}</td>
        <td>${pick.bet}</td>
        <td>${pick.odds}</td>
        <td>${pick.result}</td>`;
      tbody.appendChild(row);
    });

    //show table and hide loading text
    loading.style.display = "none";
    table.style.display = "table";
  } catch (error) {
    loading.textContent = "Error loading picks";
    console.log(error);
  }
}

//Handle formsubmission (new pick)
async function createPick(event) {
  event.preventDefault();

  const team = document.getElementById("team").value.trim();
  const bet = document.getElementById("bet").value.trim();
  const odds = parseFloat(document.getElementById("odds").value);
  const message = document.getElementById("form-message");

  if (!team || !bet || isNaN(odds)) {
    message.textContent = "Please fill all fields correctly";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, bet, odds }),
    });

    if (!response.ok) throw new Error("Failed to create pick");

    const result = await response.json();
    console.log("Created:", result);

    //Add new pick to the table dynamically
    const tbody = document.getElementById("picks-body");
    const row = document.createElement("tr");
    row.innerHTML = `<td>${result.pick.team}</td>
    <td>${result.pick.bet}</td>
    <td>${result.pick.odds}</td>
    <td>${result.pick.result}</td>`;
    tbody.prepend(row);

    message.textContent = "✅ Pick added successfully!";
    message.style.color = "green";
    document.getElementById("new-pick-form").reset();
  } catch (err) {
    console.log(err);
    message.textContent = "Error adding pick";
    message.style.color = "red";
  }
}

//run when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadPicks();
  document
    .getElementById("new-pick-form")
    .addEventListener("submit", createPick);
});
