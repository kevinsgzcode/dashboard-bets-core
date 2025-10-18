# 🧠 Dashboard Bets Core  
### Learning full-stack development from the ground up

### 🚀 About the Project
This repository is part of my journey to build a **sports betting dashboard from scratch** —  
starting with **pure JavaScript, Node.js, and SQL**, to understand everything from the ground up before using frameworks.

Every step of the project is documented inside the `/docs` folder.

---

###  Project Goals
- Build a **fully functional REST API** without frameworks (vanilla Node.js).
- Handle routes, requests, and responses manually.
- Create a simple persistence layer using JSON files.
- Later migrate to **SQLite** using raw SQL queries.
- Eventually evolve into a **full-stack dashboard** for tracking sports picks and stats.

---

###  Current Progress

| Step | Description | Status |
|------|--------------|--------|
| 1️⃣ | Setting up Node.js environment and minimal HTTP server | ✅ Completed |
| 2️⃣ | Building a Raw Node.js REST API (GET & POST routes) | ✅ Completed |
| 3️⃣ | Connecting to SQLite database using pure SQL | 🔄 In progress |

All documentation can be found here → [`/docs`](./docs)

---

###  Tech Stack
- **Language:** JavaScript (ESM Modules)
- **Runtime:** Node.js
- **Data Storage:** JSON → SQLite (next step)
- **Tools:** pnpm, Git, Postman, cURL
- **IDE:** VS Code + Warp Terminal

---

###  How to Run Locally
```bash
# 1. Clone the repo
git clone https://github.com/kevinsgz-code/bettracker-core.git

# 2. Navigate into the project
cd bettracker-core

# 3. Start the server
pnpm run dev
