# Step 12 — User backend

## Overview

In this step, the goal was to connect our existing `picks` system to real users in the database — enabling a foundation for multi-user sessions, individual stats, and personalized dashboards.

Until now, all picks and stats were global. But a real betting tracker must separate data by user. This step makes that transition possible.

---

### Database relationship

I extended the `picks` table with a new column:

```sql
user_id INTEGER REFERENCES users(id)
```

This establishes a **foreign key** relationship, ensuring every pick belongs to a specific user in the `users` table.  
The schema now supports multiple users, each with their own set of picks, stats, and future session logic.

---

### Backend filtering logic

All backend routes (`/api/picks`, `/api/stats`) were updated to accept a `user_id` parameter, either in the request body or query string.

This allows:

- `GET /api/picks?user_id=1` → returns only that user's picks.
- `GET /api/stats?user_id=1` → calculates stats only for that user.
- `POST /api/picks` → creates a pick tied to the correct `user_id`.

This logic ensures data isolation between users and is the foundation for secure and dynamic dashboards later on.

---

### Handling SQLite references

During this process, a critical issue appeared:

```
SqliteError: no such table: main.user
```

This happened because the reference was accidentally declared to `user` instead of `users`.

To fix this:

- I recreated the `picks` table with the correct reference to `users(id)`.
- This ensured referential integrity and prevented orphaned records.

---

## Design decisions & why they matter

| Decision                                | Why it matters                                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Foreign key between picks and users** | Creates a clear one-to-many relationship. This allows user-specific data filtering and stats without rewriting logic later. |
| **Parameter-based filtering**           | Keeps backend stateless and flexible. Frontend can request any user’s data dynamically via query params.                    |
| **Keep calculations in backend**        | Ensures performance and integrity — calculations depend on verified DB values, not user-side logic.                         |
| **No framework**                        | Reinforces understanding of HTTP, SQLite, and Node.js fundamentals — focusing on problem-solving, not shortcuts.            |

---

## Challenges faced

1. **Foreign key mismatch**

   - Mistakenly referenced `user` instead of `users`.
   - Solution: rebuild the table cleanly to maintain consistent schema.

2. **Integrating user_id across endpoints**

   - Needed to refactor `/api/picks` and `/api/stats` to handle user context.
   - This required consistent validation and JSON parsing logic.

3. **Ensuring data isolation**
   - Verified that each user only retrieves or creates their own picks.
   - Confirmed correct results via Postman for both picks and stats.

---
