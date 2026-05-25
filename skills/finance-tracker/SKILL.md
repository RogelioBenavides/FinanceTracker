---
name: finance-tracker
description: Add and query expenses in the personal Finance Tracker app.
metadata.openclaw.primaryEnv: FINANCE_TRACKER_API_KEY
metadata.openclaw.requires.config:
  - FINANCE_TRACKER_API_KEY
  - FINANCE_TRACKER_URL
---

# Finance Tracker Skill

Use this skill whenever the user mentions adding an expense, logging a purchase,
recording spending, or asking about their transactions or categories.

## Authentication

The environment variables `FINANCE_TRACKER_API_KEY` and `FINANCE_TRACKER_URL` are **pre-configured** in your environment. Do NOT ask the user for them — use them directly in every request:

```
-H "X-Api-Key: $FINANCE_TRACKER_API_KEY"
-H "Content-Type: application/json"
```

Base URL is `$FINANCE_TRACKER_URL`.
All endpoints are under `/api/`.

## Adding an expense

Follow these steps in order:

### Step 1 — Get the active period

```bash
curl -s "$FINANCE_TRACKER_URL/api/periods/" \
  -H "X-Api-Key: $FINANCE_TRACKER_API_KEY"
```

The response is a list of periods with `id`, `name`, `start_date`, `end_date`.
Pick the period whose date range contains today. If none contains today, use the
most recent one. If there are no periods, tell the user they need to create one
in the app first.

### Step 2 — Get categories and cards (run both in parallel)

```bash
curl -s "$FINANCE_TRACKER_URL/api/categories/" \
  -H "X-Api-Key: $FINANCE_TRACKER_API_KEY"

curl -s "$FINANCE_TRACKER_URL/api/cards/" \
  -H "X-Api-Key: $FINANCE_TRACKER_API_KEY"
```

Categories have `id` and `name`. Cards have `id` and `name`.

### Step 3 — Map user intent to fields

From the user's message, extract:

| Field | Source | Notes |
|---|---|---|
| `description` | what they bought / where | Required |
| `amount` | number they mentioned | Required — ask if missing |
| `category_id` | best match from category list | Ask if ambiguous |
| `card_id` | best match from card list | `null` if not mentioned |
| `date` | date they mentioned | Default to today in `YYYY-MM-DD` |
| `status` | "paid" / "pending" / "not_paid" | Default to `"not_paid"` |

If the user splits the expense across multiple categories (e.g. "100 pesos: 60 food, 40 personal care"), build one item per category in the `items` array.

### Step 4 — Create the transaction

```bash
curl -s -X POST "$FINANCE_TRACKER_URL/api/transactions/" \
  -H "X-Api-Key: $FINANCE_TRACKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "period_id": <period_id>,
    "card_id": <card_id or null>,
    "date": "<YYYY-MM-DD>",
    "description": "<description>",
    "status": "<paid|pending|not_paid>",
    "items": [
      { "category_id": <id>, "amount": <number> }
    ]
  }'
```

On success (HTTP 201), confirm to the user:
> Added **<description>** — $<amount> on <date> (<category name>).

On error, show the `detail` field from the response and ask the user to clarify.

## Listing recent transactions

```bash
curl -s "$FINANCE_TRACKER_URL/api/transactions/?period_id=<id>" \
  -H "X-Api-Key: $FINANCE_TRACKER_API_KEY"
```

Present them as a short table: date, description, amount, category, status.

## Listing categories or cards

Use the same endpoints from Step 2 and present as a simple list.

## Rules

- Never guess a category or card ID — always look them up first.
- Never invent a period ID — always fetch periods first.
- If the user mentions a category that doesn't exist, tell them and list what's available.
- Amounts must be positive numbers. Do not include currency symbols in the JSON.
- Dates must be `YYYY-MM-DD`. If the user says "today", use today's actual date.
- If any required field is missing or ambiguous, ask before submitting.
