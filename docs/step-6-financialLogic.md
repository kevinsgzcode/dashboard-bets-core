# Step 6 — Stake, Profit/Loss and Bank Foundations

## Overview

This step transformed the dashboard from a simple record of picks into a **functional betting management system** — capable of tracking real money, potential winnings, and performance over time.

## Why Add Stake and Profit Calculations?

In real-world betting or investment systems, every decision has **financial consequences**. A pick is not just a record of “who might win” — it’s a **transaction** that affects the user’s balance.

Adding `stake`, `possibleWin`, and `profitLoss` brings realism and accountability to each entry:

| Field           | Purpose                     | Why it Matters                                                                      |
| --------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| **stake**       | Money risked on the bet     | Introduces real economic input — turning each pick into a measurable transaction.   |
| **possibleWin** | stake × odds                | Shows the _potential outcome_ of the bet, helping to assess reward vs. risk.        |
| **profitLoss**  | Net result based on outcome | Measures actual gain or loss, forming the foundation for future statistics and ROI. |

This logic is universal: whether you’re building a finance tracker or a sports-betting dashboard, you always need the connection between **decision → outcome → financial effect**.

## Database Upgrades

Expanded the existing SQLite schema by adding three new columns:

```sql
ALTER TABLE picks ADD COLUMN stake REAL DEFAULT 0;
ALTER TABLE picks ADD COLUMN possibleWin REAL DEFAULT 0;
ALTER TABLE picks ADD COLUMN profitLoss REAL DEFAULT 0;
```

### Why Use Default Values?

Setting `DEFAULT 0` prevents breaking existing data and allows seamless backward compatibility. Older records remain valid, even if they were created before these financial fields existed.

## Backend Logic — Turning Picks into Transactions

### POST — Create a Pick

- Receives `stake` from the client.
- Calculates `possibleWin = stake * odds`.
- Determines `profitLoss` only if result is `won` or `lost`.

### PUT — Update a Pick

When a result or stake changes, the backend recalculates the outcome:

- Changing `result` from `pending` to `won/lost` triggers a new `profitLoss`.
- Editing the `stake` or `odds` updates both `possibleWin` and `profitLoss`.

### Why Automate It?

Manual calculations are error-prone. Automating ensures that every update maintains **data consistency** and prevents mismatches between financial fields.

## Frontend — Visual Feedback of Financial Performance

The interface now includes:

- **Stake input field** (money wagered).
- **Possible Win and Profit/Loss columns** in the table.

Each pick is color-coded:

- Green → profit (won)
- Red → loss
- Gray → pending or neutral

## The Math Behind It

| Situation | Formula                  | Example            | Output |
| --------- | ------------------------ | ------------------ | ------ |
| Won       | `(stake * odds) - stake` | (100 × 1.95) - 100 | +95    |
| Lost      | `-stake`                 | -100               | -100   |
| Pending   | `0`                      |                    | 0      |

Each value reflects **net movement** — just like a trading ledger or profit/loss statement.

The formulas aren’t arbitrary — they model **risk and return**:

- **`stake`** is exposure — what you risk.
- **`odds`** is leverage — how much the market pays back per unit.
- **`possibleWin`** represents _expected outcome if correct_.
- **`profitLoss`** captures _realized performance_ after the fact.

Together, they create a micro financial system inside the app.

## Debugging

- Incorrect `stake` parsing (string vs number) initially caused `NaN` errors → fixed by coercing `stake = parseFloat(stake)`.
- `profitLoss` values recalculated dynamically in PUT to maintain accuracy.
- Color formatting and precision rounding (`toFixed(2)`) improved readability.
- Minor styling inconsistencies (button layout) deferred to UI polish phase.
