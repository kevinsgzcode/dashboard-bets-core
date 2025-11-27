# 📊 Bets Core: Sports Analytics & ROI Dashboard

![Status](https://img.shields.io/badge/Status-Live-success) ![Stack](https://img.shields.io/badge/Tech-Vanilla_JS_|_Node.js_|_SQLite-blue) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

> **A financial management platform for sports betting tracking, engineered to mitigate risk through real-time ROI visualization and automated data analysis.**

---

## 🚀 The "Why" & The Architecture
Unlike typical portfolio projects built with create-react-app, **Bets Core was architected entirely in Vanilla JavaScript and raw Node.js**. 

**Why?** To master the fundamentals of software engineering—DOM manipulation, state management, and RESTful routing—without the abstraction layers of frameworks. This project demonstrates a deep understanding of how web applications work under the hood before migrating to libraries like React.


## ✨ Key Features

### 💰 Financial Logic & Risk Management
- [cite_start]**Real-time ROI Calculation:** dynamic algorithms that track Initial Bankroll vs. Current Profit/Loss to visualize financial health[cite: 89, 92].
- **Odds Conversion:** Automatic parsing and conversion between **American** and **Decimal** odds systems.
- [cite_start]**Interactive Charts:** Custom-built data visualization to track performance trends over time[cite: 94].

### 🏈 Automated Data Pipeline
- **ESPN API Integration:** Engineered a backend service that fetches NFL game results automatically. [cite_start]This eliminates manual data entry and ensures 100% accuracy for "Win/Loss" result updates[cite: 91].

### 🔐 Security & Persistence
- [cite_start]**Custom Auth System:** Secure user registration and login using **bcrypt** for password hashing and session management strategies.
- **SQLite Database:** Relational database schema designed to handle users, bets, and match metadata efficiently.

---

## 🛠️ Technical Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | Vanilla JS (ES6+) | Direct DOM manipulation, custom state logic, CSS3. |
| **Backend** | Node.js (Raw) | REST API built without Express generators to handle routes manually. |
| **Database** | SQLite | Relational data persistence with raw SQL queries. |
| **DevOps** | Render | Cloud deployment and hosting. |

---

## 📸 Screenshots

| Login & Security | Bet Tracking Table |
|:---:|:---:|
| ![Login](./assets/login.png) | ![Table](./assets/table.png) |
| *Secure Authentication* | *Detailed Pick History* |

---

## 💻 How to Run Locally

This project requires **Node.js** and **pnpm** (or npm).

```bash
# 1. Clone the repository
git clone [https://github.com/kevinsgz-code/bettracker-core.git](https://github.com/kevinsgz-code/bettracker-core.git)

# 2. Navigate to the project directory
cd bettracker-core

# 3. Install dependencies
pnpm install

# 4. Setup Environment Variables
# Create a .env file in the root and add your config (example):
# PORT=3000
# DB_PATH=./database.sqlite

# 5. Start the development server
pnpm run dev

Open http://localhost:3000 to view the app.
