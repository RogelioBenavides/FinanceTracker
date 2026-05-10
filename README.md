# Finance Tracker

A personal budget and expense tracking web app built with FastAPI and React.

## Features

- **Bimonthly periods** — organize spending by custom date ranges
- **Categories** with color coding and per-period default budgets
- **Split transactions** — one expense can span multiple categories with different amounts
- **Payment cards** — debit and credit cards; debit automatically marks transactions as Paid
- **Three-status tracking** — Not Paid → Pending → Paid workflow for credit card expenses
- **Budget vs actual** dashboard with per-category progress bars
- **Filters** on transactions by category, card, and status

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic |
| Database | MariaDB |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| State | TanStack Query v5, React Hook Form |

## Prerequisites

- Python 3.11+
- Node.js 18+
- MariaDB

## Setup

### 1. Database

```bash
sudo mariadb -u root
```
```sql
CREATE DATABASE finance_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'finance_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON finance_tracker.* TO 'finance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your DB credentials

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## First Use

1. Go to **Settings** to add categories, payment cards, and create your first period
2. Set default budgets per category — they apply automatically to new periods
3. Start adding transactions from the Dashboard or Transactions page

## Status Workflow

| Status | Meaning |
|--------|---------|
| **Not Paid** | Charged to credit card, not yet assigned in card app |
| **Pending** | Assigned in card app, card bill not paid yet |
| **Paid** | Credit card bill fully paid (or debit — auto-set) |
