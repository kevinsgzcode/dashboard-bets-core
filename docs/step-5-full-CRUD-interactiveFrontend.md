# Step 5 — Full CRUD & Interactive Frontend

## Overview

In this stage, the **Dashboard Bets Core** project evolved from a backend API to a **fully interactive web app**.  
I connected the Node.js + SQLite backend with a lightweight **frontend UI** built in **pure HTML, CSS, and Vanilla JS**.

Now the system supports complete **CRUD functionality**:

- Read — Display all picks from the database.
- Create — Add new picks via a form.
- Update — Edit existing picks directly from the table.
- Delete — Remove picks instantly.

## Debugging part

This was one of the most practical and tricky steps, since introduced frontend-to-backend communication.  
Here are the main challenges and what was I learned:

## 1. Event listener duplication

- Problem: every time `loadPicks()` was called, new event listeners were added to the same buttons.
- Symptom: multiple alerts firing when clicking “Edit” or “Delete”.
- Solution: moved the event delegation **outside `loadPicks()`** and attached it only **once** under `DOMContentLoaded`.

## 2. Table losing format after adding a new pick

- Problem: when adding a pick, the table re-rendered incorrectly or lost button functionality.
- Solution: replaced `tbody.innerHTML = ""` with `tbody.replaceChildren()` — this keeps the same DOM node reference, preserving listeners and layout.

## 3. Maintaining dynamic UI updates

- Learned to create a **reusable `createRow()` function**, responsible for building new table rows dynamically, used both in `loadPicks()` and `createPick()`.

## 4. Fetch & API errors

- Added error handling for failed fetch responses (`response.ok` validation).
- Improved user feedback with form messages and console logs.

---

## What I Did

## 1. **Created `createRow()` helper**

A reusable function to generate table rows dynamically:

```js
function createRow(pick) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${pick.team}</td>
    <td>${pick.bet}</td>
    <td>${pick.odds}</td>
    <td>${pick.result}</td>
    <td>
      <button class="edit-btn" data-id="${pick.id}">Edit</button>
      <button class="delete-btn" data-id="${pick.id}">Delete</button>
    </td>
  `;
  return row;
}
```

## 2. **Refactored `loadPicks()`**

Replaced `innerHTML = ""` with a safer DOM method and attached rows using `createRow()`:

```js
const picks = await response.json();
tbody.replaceChildren(); // keeps same node reference
picks.forEach((pick) => tbody.appendChild(createRow(pick)));
```

## 3. **Implemented Event Delegation**

To handle edit and delete actions efficiently:

```js
tbody.addEventListener("click", async (e) => {
  const target = e.target;
  const id = target.dataset.id;

  if (target.classList.contains("edit-btn")) {
    const newResult = prompt("Enter new result (won/lost/pending):");
    if (newResult) await updatePick(id, newResult.trim());
  }

  if (target.classList.contains("delete-btn")) {
    const confirmDelete = confirm("Delete this pick?");
    if (confirmDelete) await deletePick(id);
  }
});
```
