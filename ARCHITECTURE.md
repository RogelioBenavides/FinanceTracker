# FinanceTracking — System Architecture

## Overview

A personal finance tracking web app for managing bimonthly expense periods, categories, payment cards, budgets, and transactions. All categories, cards, and budget amounts are user-configurable — nothing is hardcoded.

---

## Tech Stack

| Layer     | Technology                                                              |
|-----------|-------------------------------------------------------------------------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2.0 (sync, pymysql), Alembic, Pydantic v2, MariaDB |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS v4, TanStack Query v5, React Hook Form v7, React Router v6 |
| Database  | MariaDB                                                                 |
| Language  | English throughout                                                      |

---

## Directory Structure

```
FinanceTracking/
├── ARCHITECTURE.md          # This file — shared contract
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── src/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── category.py
│   │   │   ├── card.py
│   │   │   ├── period.py
│   │   │   ├── budget.py
│   │   │   └── transaction.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── category.py
│   │   │   ├── card.py
│   │   │   ├── period.py
│   │   │   ├── budget.py
│   │   │   ├── transaction.py
│   │   │   └── summary.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── categories.py
│   │   │   ├── cards.py
│   │   │   ├── periods.py
│   │   │   ├── budgets.py
│   │   │   ├── transactions.py
│   │   │   └── summary.py
│   │   └── crud/
│   │       ├── __init__.py
│   │       ├── category.py
│   │       ├── card.py
│   │       ├── period.py
│   │       ├── budget.py
│   │       └── transaction.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api/
    │   │   ├── client.ts          # axios instance
    │   │   ├── categories.ts
    │   │   ├── cards.ts
    │   │   ├── periods.ts
    │   │   ├── budgets.ts
    │   │   ├── transactions.ts
    │   │   └── summary.ts
    │   ├── types/
    │   │   └── index.ts           # All TypeScript interfaces
    │   ├── hooks/
    │   │   ├── useCategories.ts
    │   │   ├── useCards.ts
    │   │   ├── usePeriods.ts
    │   │   ├── useBudgets.ts
    │   │   ├── useTransactions.ts
    │   │   └── useSummary.ts
    │   ├── pages/
    │   │   ├── PeriodsPage.tsx
    │   │   ├── PeriodDetailPage.tsx
    │   │   ├── TransactionsPage.tsx
    │   │   ├── CategoriesPage.tsx
    │   │   └── CardsPage.tsx
    │   └── components/
    │       ├── layout/
    │       │   ├── AppShell.tsx
    │       │   ├── Sidebar.tsx
    │       │   └── TopBar.tsx
    │       ├── periods/
    │       │   ├── PeriodCard.tsx
    │       │   └── PeriodForm.tsx
    │       ├── budgets/
    │       │   ├── BudgetTable.tsx
    │       │   └── BudgetRow.tsx
    │       ├── transactions/
    │       │   ├── TransactionTable.tsx
    │       │   ├── TransactionRow.tsx
    │       │   └── TransactionForm.tsx
    │       ├── summary/
    │       │   ├── SummaryTable.tsx
    │       │   └── SummaryBar.tsx
    │       └── shared/
    │           ├── Modal.tsx
    │           ├── ConfirmDialog.tsx
    │           ├── StatusBadge.tsx
    │           └── CurrencyCell.tsx
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Database Schema (MariaDB DDL)

```sql
CREATE TABLE categories (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    color      VARCHAR(7)   NOT NULL DEFAULT '#6B7280',  -- hex color
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cards (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cards_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE periods (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL,   -- e.g. "April-May"
    start_date DATE         NOT NULL,
    end_date   DATE         NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_periods_name (name),
    CONSTRAINT chk_period_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE budgets (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    period_id   INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uq_budgets_period_category (period_id, category_id),
    CONSTRAINT fk_budgets_period   FOREIGN KEY (period_id)   REFERENCES periods(id)    ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE transactions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    period_id   INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    card_id     INT UNSIGNED NULL,
    date        DATE         NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    status      ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_period   FOREIGN KEY (period_id)   REFERENCES periods(id)    ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_card     FOREIGN KEY (card_id)     REFERENCES cards(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Design notes:**
- `budgets.amount` is per-category per-period; creating a period does NOT auto-create budgets.
- `transactions.card_id` is nullable (cash/unknown payment).
- `transactions.category_id` uses RESTRICT on delete to prevent orphaned spend data.
- `categories.color` is a hex string for UI color-coding.

---

## SQLAlchemy 2.0 Models

### `src/models/category.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, func
from src.database import Base

class Category(Base):
    __tablename__ = "categories"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(100), nullable=False, unique=True)
    color      = Column(String(7), nullable=False, default="#6B7280")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
```

### `src/models/card.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, func
from src.database import Base

class Card(Base):
    __tablename__ = "cards"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
```

### `src/models/period.py`
```python
from sqlalchemy import Column, Integer, String, Date, DateTime, func
from src.database import Base

class Period(Base):
    __tablename__ = "periods"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(50), nullable=False, unique=True)
    start_date = Column(Date, nullable=False)
    end_date   = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
```

### `src/models/budget.py`
```python
from sqlalchemy import Column, Integer, Numeric, ForeignKey, UniqueConstraint
from src.database import Base

class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("period_id", "category_id"),)
    id          = Column(Integer, primary_key=True, autoincrement=True)
    period_id   = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    amount      = Column(Numeric(10, 2), nullable=False, default=0)
```

### `src/models/transaction.py`
```python
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Enum, ForeignKey, func
from src.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    period_id   = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    card_id     = Column(Integer, ForeignKey("cards.id", ondelete="SET NULL"), nullable=True)
    date        = Column(Date, nullable=False)
    description = Column(String(255), nullable=False)
    amount      = Column(Numeric(10, 2), nullable=False)
    status      = Column(Enum("Paid", "Pending"), nullable=False, default="Pending")
    created_at  = Column(DateTime, nullable=False, server_default=func.now())
    updated_at  = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
```

---

## REST API Contract

**Base URL:** `http://localhost:8000/api`

All responses use `application/json`. All list endpoints return arrays. All mutation endpoints return the updated/created resource. Errors return `{"detail": "..."}` with appropriate HTTP status.

---

### Categories

| Method | Path              | Description         |
|--------|-------------------|---------------------|
| GET    | /categories       | List all categories |
| POST   | /categories       | Create category     |
| GET    | /categories/{id}  | Get category        |
| PUT    | /categories/{id}  | Update category     |
| DELETE | /categories/{id}  | Delete category     |

**CategoryRead**
```json
{
  "id": 1,
  "name": "Groceries",
  "color": "#10B981",
  "created_at": "2026-04-01T00:00:00"
}
```

**CategoryCreate / CategoryUpdate**
```json
{
  "name": "Groceries",
  "color": "#10B981"
}
```
- `color` is optional on create (defaults to `#6B7280`); optional on update.
- DELETE returns `204 No Content`.

---

### Cards

| Method | Path        | Description    |
|--------|-------------|----------------|
| GET    | /cards      | List all cards |
| POST   | /cards      | Create card    |
| GET    | /cards/{id} | Get card       |
| PUT    | /cards/{id} | Update card    |
| DELETE | /cards/{id} | Delete card    |

**CardRead**
```json
{
  "id": 1,
  "name": "Nu",
  "created_at": "2026-04-01T00:00:00"
}
```

**CardCreate / CardUpdate**
```json
{
  "name": "Nu"
}
```
- DELETE returns `204 No Content`.

---

### Periods

| Method | Path          | Description      |
|--------|---------------|------------------|
| GET    | /periods      | List all periods |
| POST   | /periods      | Create period    |
| GET    | /periods/{id} | Get period       |
| PUT    | /periods/{id} | Update period    |
| DELETE | /periods/{id} | Delete period    |

**PeriodRead**
```json
{
  "id": 1,
  "name": "April-May",
  "start_date": "2026-04-01",
  "end_date": "2026-05-31",
  "created_at": "2026-04-01T00:00:00"
}
```

**PeriodCreate / PeriodUpdate**
```json
{
  "name": "April-May",
  "start_date": "2026-04-01",
  "end_date": "2026-05-31"
}
```
- Creating a period does NOT auto-create budget rows. Budgets are managed separately.
- DELETE returns `204 No Content` and cascades to budgets and transactions.

---

### Budgets

| Method | Path                        | Description                      |
|--------|-----------------------------|----------------------------------|
| GET    | /periods/{id}/budgets       | List all budgets for a period    |
| PUT    | /periods/{id}/budgets       | Upsert (bulk) budgets for period |

**GET response — array of BudgetRead:**
```json
[
  {
    "id": 1,
    "period_id": 1,
    "category_id": 2,
    "category_name": "Groceries",
    "amount": "3500.00"
  }
]
```

**PUT request body — BudgetUpsertList:**
```json
{
  "budgets": [
    { "category_id": 2, "amount": "3500.00" },
    { "category_id": 3, "amount": "1200.00" }
  ]
}
```
- PUT is a full upsert: rows for categories listed are created or updated. Categories not in the list are left unchanged.
- `amount` is a string-encoded decimal to avoid floating-point drift.

**PUT response — array of BudgetRead** (all budgets for the period after upsert).

---

### Transactions

| Method | Path                | Description                            |
|--------|---------------------|----------------------------------------|
| GET    | /transactions       | List transactions (filter by period)   |
| POST   | /transactions       | Create transaction                     |
| GET    | /transactions/{id}  | Get transaction                        |
| PUT    | /transactions/{id}  | Update transaction                     |
| DELETE | /transactions/{id}  | Delete transaction                     |

**Query params for GET /transactions:**
- `period_id` (int, required in practice — UI always filters by period)
- `category_id` (int, optional)
- `status` (string `"Paid"|"Pending"`, optional)

**TransactionRead**
```json
{
  "id": 1,
  "period_id": 1,
  "category_id": 2,
  "category_name": "Groceries",
  "card_id": 1,
  "card_name": "Nu",
  "date": "2026-04-15",
  "description": "Walmart",
  "amount": "450.00",
  "status": "Paid",
  "created_at": "2026-04-15T10:00:00",
  "updated_at": "2026-04-15T10:00:00"
}
```

**TransactionCreate**
```json
{
  "period_id": 1,
  "category_id": 2,
  "card_id": 1,
  "date": "2026-04-15",
  "description": "Walmart",
  "amount": "450.00",
  "status": "Paid"
}
```
- `card_id` is nullable (omit or set `null`).
- `status` defaults to `"Pending"` if omitted.

**TransactionUpdate** — same shape as Create, all fields optional.

- DELETE returns `204 No Content`.

---

### Summary

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | /summary/{period_id}  | Aggregated budget vs actual per category |

**SummaryRead**
```json
{
  "period_id": 1,
  "period_name": "April-May",
  "total_budget": "15000.00",
  "total_spent": "12345.67",
  "total_pending": "1200.00",
  "categories": [
    {
      "category_id": 2,
      "category_name": "Groceries",
      "color": "#10B981",
      "budget": "3500.00",
      "spent": "2800.00",
      "pending": "0.00",
      "remaining": "700.00"
    }
  ]
}
```
- `spent` = sum of Paid transactions for that category in the period.
- `pending` = sum of Pending transactions.
- `remaining` = `budget - spent - pending`.
- Categories with no budget row have `budget: "0.00"`.
- Categories with transactions but no budget row ARE included.

---

## Pydantic v2 Schemas

### `src/schemas/category.py`
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")

class CategoryRead(CategoryBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
```

### `src/schemas/card.py`
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)

class CardRead(CardBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
```

### `src/schemas/period.py`
```python
from pydantic import BaseModel, Field, model_validator
from datetime import date, datetime
from typing import Optional

class PeriodBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def end_after_start(self) -> "PeriodBase":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self

class PeriodCreate(PeriodBase):
    pass

class PeriodUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class PeriodRead(PeriodBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
```

### `src/schemas/budget.py`
```python
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

class BudgetItem(BaseModel):
    category_id: int
    amount: Decimal = Field(..., ge=0, decimal_places=2)

class BudgetUpsertList(BaseModel):
    budgets: list[BudgetItem]

class BudgetRead(BaseModel):
    id: int
    period_id: int
    category_id: int
    category_name: str
    amount: Decimal
    model_config = {"from_attributes": True}
```

### `src/schemas/transaction.py`
```python
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date, datetime
from typing import Literal, Optional

class TransactionCreate(BaseModel):
    period_id: int
    category_id: int
    card_id: Optional[int] = None
    date: date
    description: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    status: Literal["Paid", "Pending"] = "Pending"

class TransactionUpdate(BaseModel):
    period_id: Optional[int] = None
    category_id: Optional[int] = None
    card_id: Optional[int] = None
    date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    status: Optional[Literal["Paid", "Pending"]] = None

class TransactionRead(BaseModel):
    id: int
    period_id: int
    category_id: int
    category_name: str
    card_id: Optional[int]
    card_name: Optional[str]
    date: date
    description: str
    amount: Decimal
    status: Literal["Paid", "Pending"]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
```

### `src/schemas/summary.py`
```python
from pydantic import BaseModel
from decimal import Decimal

class CategorySummary(BaseModel):
    category_id: int
    category_name: str
    color: str
    budget: Decimal
    spent: Decimal
    pending: Decimal
    remaining: Decimal

class SummaryRead(BaseModel):
    period_id: int
    period_name: str
    total_budget: Decimal
    total_spent: Decimal
    total_pending: Decimal
    categories: list[CategorySummary]
```

---

## TypeScript Types

### `src/types/index.ts`
```typescript
export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Card {
  id: number;
  name: string;
  created_at: string;
}

export interface Period {
  id: number;
  name: string;
  start_date: string;   // "YYYY-MM-DD"
  end_date: string;
  created_at: string;
}

export interface Budget {
  id: number;
  period_id: number;
  category_id: number;
  category_name: string;
  amount: string;       // decimal string
}

export type TransactionStatus = "Paid" | "Pending";

export interface Transaction {
  id: number;
  period_id: number;
  category_id: number;
  category_name: string;
  card_id: number | null;
  card_name: string | null;
  date: string;         // "YYYY-MM-DD"
  description: string;
  amount: string;       // decimal string
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  color: string;
  budget: string;
  spent: string;
  pending: string;
  remaining: string;
}

export interface Summary {
  period_id: number;
  period_name: string;
  total_budget: string;
  total_spent: string;
  total_pending: string;
  categories: CategorySummary[];
}

// Form types
export interface CategoryForm {
  name: string;
  color: string;
}

export interface CardForm {
  name: string;
}

export interface PeriodForm {
  name: string;
  start_date: string;
  end_date: string;
}

export interface TransactionForm {
  period_id: number;
  category_id: number;
  card_id: number | null;
  date: string;
  description: string;
  amount: string;
  status: TransactionStatus;
}
```

---

## React Component Tree

```
App
└── AppShell (layout wrapper)
    ├── Sidebar (nav links)
    ├── TopBar (page title)
    └── <Outlet> (React Router)
        ├── / → PeriodsPage
        │   ├── PeriodCard (per period, links to detail)
        │   └── PeriodForm (modal: create/edit)
        ├── /periods/:id → PeriodDetailPage
        │   ├── SummaryTable
        │   │   └── SummaryBar (progress bar per category)
        │   ├── BudgetTable (editable budget amounts)
        │   │   └── BudgetRow (inline edit per category)
        │   └── TransactionTable (filtered to this period)
        │       ├── TransactionRow
        │       └── TransactionForm (modal: create/edit)
        ├── /transactions → TransactionsPage
        │   ├── PeriodSelector (dropdown)
        │   └── TransactionTable
        │       ├── TransactionRow
        │       └── TransactionForm (modal)
        ├── /categories → CategoriesPage
        │   └── CategoryForm (inline or modal: create/edit)
        └── /cards → CardsPage
            └── CardForm (inline or modal: create/edit)

Shared components (used across pages):
    Modal
    ConfirmDialog
    StatusBadge        (Paid=green, Pending=yellow)
    CurrencyCell       (formats Decimal string as MXN/USD)
```

---

## Routing

| Path              | Page               | Description                       |
|-------------------|--------------------|-----------------------------------|
| `/`               | PeriodsPage        | List all periods, create/edit     |
| `/periods/:id`    | PeriodDetailPage   | Summary, budgets, transactions    |
| `/transactions`   | TransactionsPage   | Cross-period transaction browser  |
| `/categories`     | CategoriesPage     | Manage category list + colors     |
| `/cards`          | CardsPage          | Manage payment card list          |

---

## TanStack Query Keys

```typescript
// Consistent query key factory
export const queryKeys = {
  categories:   () => ["categories"] as const,
  category:     (id: number) => ["categories", id] as const,
  cards:        () => ["cards"] as const,
  card:         (id: number) => ["cards", id] as const,
  periods:      () => ["periods"] as const,
  period:       (id: number) => ["periods", id] as const,
  budgets:      (periodId: number) => ["periods", periodId, "budgets"] as const,
  transactions: (filters: object) => ["transactions", filters] as const,
  summary:      (periodId: number) => ["summary", periodId] as const,
};
```

---

## CORS and Environment

**Backend `.env.example`:**
```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/finance_tracking
CORS_ORIGINS=http://localhost:5173
```

**Frontend `vite.config.ts` proxy:**
```typescript
server: {
  proxy: {
    "/api": "http://localhost:8000"
  }
}
```

---

## Key Architectural Decisions

### ADR-001: Sync SQLAlchemy over async
**Decision:** Use SQLAlchemy 2.0 synchronous engine with pymysql.
**Rationale:** Single-user personal app; sync is simpler to reason about, no connection pool edge cases, Alembic migrations work seamlessly without async workarounds.

### ADR-002: Decimal strings over floats in API
**Decision:** All monetary `amount` and budget values are returned as strings (`"3500.00"`).
**Rationale:** Avoids floating-point precision loss in JSON. Frontend formats for display; backend uses Python `Decimal` and MariaDB `DECIMAL(10,2)`.

### ADR-003: Budgets not auto-created with period
**Decision:** Creating a period does not auto-populate budget rows.
**Rationale:** User may want to copy budgets from a previous period, set them all at once via the BudgetTable, or leave some categories unbudgeted. The UI handles the UX for this workflow.

### ADR-004: Bulk upsert for budgets
**Decision:** `PUT /periods/{id}/budgets` accepts an array and upserts.
**Rationale:** User edits budget amounts inline in a table and saves the whole period at once. Individual row PUT endpoints would require N round-trips.

### ADR-005: category_id RESTRICT on transaction delete
**Decision:** Deleting a category is blocked if transactions reference it.
**Rationale:** Preserves financial history integrity. UI should warn user and require re-categorization before deletion.

### ADR-006: Vite proxy for API calls
**Decision:** Frontend calls `/api/...` (no host), proxied by Vite dev server.
**Rationale:** Avoids CORS preflight in development. Same configuration works in production behind a reverse proxy (nginx).
