# FinTrack — Personal Finance OS

A full-stack expense tracker and personal finance manager built for individuals and families. Goes beyond basic expense logging — handles multi-stream income, smart budget rules, goal-oriented savings, PDF passbook import, and linked family accounts.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API overview](#api-overview)
- [Budget logic](#budget-logic)
- [PDF import pipeline](#pdf-import-pipeline)
- [Auto-classification](#auto-classification)
- [Family accounts](#family-accounts)
- [Investment section](#investment-section)
- [Goal-oriented savings](#goal-oriented-savings)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core

- **User authentication** via Firebase (Google OAuth + email/password), JWT issued for all API calls
- **Multi-stream income** — salary, freelance, rental, SIP returns; each with its own frequency and active period
- **Expense categorisation** — primary (needs), secondary (wants), investment; 17 default categories seeded on registration; fully customisable
- **Budget allocation rules** — 50/30/20 by default; user-configurable percentage splits per month
- **Real-time budget alerts** — push notification when a category crosses a configurable threshold (default 80%)
- **Dashboard analytics** — monthly trend lines, category pie charts, save vs spend vs invest bar chart

### Advanced

- **PDF passbook import** — upload your bank statement PDF; transactions are parsed, auto-classified, and queued for your review before being saved
- **Auto-classifier** — keyword-rule engine (instant) with optional Claude API NLP fallback for ambiguous descriptions
- **Goal-oriented savings** — set a target amount and date; the app computes your required monthly contribution and tracks progress
- **Family / linked accounts** — invite family members; each person controls what others can see (summary / category totals / full transactions)
- **Investment tracking** — log SIP, mutual fund, stock, ETF, FD, PPF/NPS contributions; view projections using MFAPI.in market data

---

## Tech stack

| Layer        | Choice                  | Why                                             |
| ------------ | ----------------------- | ----------------------------------------------- |
| Frontend     | React 18 + Tailwind CSS | Component model fits dashboard complexity       |
| Charts       | Recharts                | Composable, React-native, no jQuery             |
| Backend      | Node.js + Express       | Fast to build, large ecosystem                  |
| Auth         | Firebase Auth + JWT     | Handles OAuth, token refresh, phone OTP         |
| Database     | MongoDB + Mongoose      | Flexible schema suits varied transaction shapes |
| Cache        | Redis                   | Session store, rate limiting, budget snapshots  |
| File storage | AWS S3 / Cloudflare R2  | PDF uploads; delete raw file after parsing      |
| PDF parsing  | pdf-parse + pdfjs-dist  | Text extraction; Claude API for ambiguous rows  |
| Email        | SendGrid / Resend       | Budget alerts, family invites                   |
| Market data  | MFAPI.in                | Free Indian MF NAV data                         |

---

## Project structure

```
fintrack/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/   # Charts, summary cards, alerts
│   │   │   ├── transactions/# Transaction list, PDF upload, review queue
│   │   │   ├── budget/      # Budget rule editor, progress bars
│   │   │   ├── goals/       # Goal cards, progress tracker
│   │   │   └── family/      # Linked accounts, shared dashboard
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── server/                  # Express backend
│   ├── models/              # Mongoose schemas (see Database schema)
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── IncomeStream.js
│   │   ├── Category.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   ├── Goal.js
│   │   └── FamilyGroup.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budget.js
│   │   ├── goals.js
│   │   ├── income.js
│   │   ├── pdf.js
│   │   └── family.js
│   ├── services/
│   │   ├── classifier.js    # Keyword rules + NLP fallback
│   │   ├── pdfParser.js     # Bank PDF extraction pipeline
│   │   ├── budgetEngine.js  # 50/30/20 logic, alert triggers
│   │   └── goalEngine.js    # Monthly target computation
│   ├── middleware/
│   │   ├── auth.js          # Firebase token verify → attach req.user
│   │   └── rateLimiter.js
│   └── app.js
│
├── .env.example
├── docker-compose.yml       # MongoDB + Redis for local dev
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (or Docker)
- Redis 7+ (or Docker)
- A Firebase project (free tier is enough)

### 1. Clone and install

```bash
git clone https://github.com/yourname/fintrack.git
cd fintrack

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Start local infrastructure

```bash
# From project root — starts MongoDB and Redis in Docker
docker-compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in the values — see Environment variables below
```

### 4. Run in development

```bash
# Terminal 1 — backend (runs on :5000)
cd server && npm run dev

# Terminal 2 — frontend (runs on :3000)
cd client && npm start
```

### 5. Seed default categories

Default categories are seeded automatically when a user registers for the first time. No manual seeding needed.

---

## Environment variables

Create a `.env` file in `/server`. Never commit this file.

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/fintrack

# Redis
REDIS_URL=redis://localhost:6379

# Firebase — get from Firebase Console > Project settings > Service accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT
JWT_SECRET=a-long-random-string-minimum-32-characters
JWT_EXPIRES_IN=7d

# AWS S3 (for PDF uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=fintrack-uploads

# Claude API (for NLP classification fallback)
ANTHROPIC_API_KEY=sk-ant-...

# Email (SendGrid)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@yourapp.com

# Market data
MFAPI_BASE_URL=https://api.mfapi.in
```

---

## Database schema

Seven MongoDB collections. All schemas are in `server/models/`.

| Collection      | Purpose                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `users`         | Profile, currency, family group membership, preferences                                            |
| `incomestreams` | One document per income source; frequency-normalised to monthly equivalent                         |
| `categories`    | Per-user categories with keyword lists for auto-classification; 17 defaults seeded on registration |
| `transactions`  | Every financial event; indexes optimised for month/year/category aggregations                      |
| `budgets`       | One document per user per month; stores percentage splits, not absolute amounts                    |
| `goals`         | Savings targets with denormalised `currentAmount` updated atomically on each linked transaction    |
| `familygroups`  | Group membership, invite tokens, per-member view scope                                             |

### Key design decisions worth knowing

**Transactions store `month` and `year` as separate fields** alongside `date`. Redundant, but removes expensive date-math operators from every dashboard aggregation query.

**Budget stores percentages, not rupee amounts.** `primaryPct: 50` derives the actual budget from `totalIncomeSnapshot` at query time. If income changes, the budget adjusts automatically — no stale values.

**`confirmed: false` on PDF-imported transactions.** All parsed transactions start unconfirmed and are excluded from budgets and charts until the user reviews and confirms them. This is your data quality gate — do not remove it.

**`currentAmount` on Goals is denormalised.** Updated atomically inside a MongoDB session whenever a transaction is linked or unlinked from a goal. Avoids a full collection scan on every goal card render.

---

## API overview

All routes require `Authorization: Bearer <jwt>` except `/api/auth/*`.

```
POST   /api/auth/register          Create user, seed categories, issue JWT
POST   /api/auth/login             Verify Firebase token, return JWT

GET    /api/transactions            List (filter by month, year, category, confirmed)
POST   /api/transactions            Create single transaction
PUT    /api/transactions/:id        Update (description, category, confirmed, goalId)
DELETE /api/transactions/:id        Soft delete

POST   /api/pdf/upload              Upload bank PDF → returns pdfBatchId
GET    /api/pdf/batch/:batchId      Get all unconfirmed transactions from a batch
POST   /api/pdf/batch/:batchId/confirm-all   Confirm all parsed transactions

GET    /api/budget/:year/:month     Get budget + actuals for a month
PUT    /api/budget/:year/:month     Update budget rules

GET    /api/income                  List income streams
POST   /api/income                  Add income stream
PUT    /api/income/:id              Update / deactivate

GET    /api/goals                   List goals with progress
POST   /api/goals                   Create goal
PUT    /api/goals/:id               Update target, pause, mark complete

POST   /api/family/create           Create family group
POST   /api/family/invite           Send invite by email
PUT    /api/family/accept/:token    Accept invite
PUT    /api/family/scope            Update your own view scope
GET    /api/family/dashboard        Aggregated view of all members (respects viewScope)
```

---

## Budget logic

The budget engine runs in `server/services/budgetEngine.js`.

**How 50/30/20 works in this app:**

1. Sum all active `IncomeStream.monthlyEquivalent` values for the user → `totalMonthlyIncome`
2. Multiply by stored percentages: `primaryBudget = totalMonthlyIncome × primaryPct / 100`
3. On every new confirmed transaction, run an aggregation to get `spentByType` for the current month
4. If `spentByType[type] / budget[type] >= alertThresholdPct`, fire a push notification

**Category overrides** take precedence over type-level budgets. If you set a ₹5,000 cap on "Dining out", that limit is checked independently of the secondary budget total.

**Budget documents are created lazily** — the first time a user views a month's dashboard, if no Budget document exists for that month, one is created using the user's current default rule.

---

## PDF import pipeline

Handled in `server/services/pdfParser.js`. The pipeline runs in five stages:

```
Upload PDF → Extract text rows → Parse transactions → Auto-classify → Save as unconfirmed
```

**Stage 1 — Upload**
PDF is uploaded to S3. The raw file is deleted from S3 after parsing completes (or after 24 hours if parsing fails). We do not store bank statements permanently.

**Stage 2 — Text extraction**
`pdf-parse` extracts raw text. If the result is empty (scanned/image PDF), `pdfjs-dist` renders pages to canvas and runs OCR via `tesseract.js`.

**Stage 3 — Row parsing**
Bank-specific regex patterns extract date, description, debit/credit, and balance from each row. Supported banks and their statement formats:

| Bank  | Format          | Parser status |
| ----- | --------------- | ------------- |
| HDFC  | Text PDF        | Supported     |
| SBI   | Text PDF        | Supported     |
| ICICI | Text PDF        | Supported     |
| Axis  | Text PDF        | In progress   |
| Kotak | Image PDF (OCR) | In progress   |

**Stage 4 — Auto-classification**
Each parsed row goes through the classifier (see Auto-classification below).

**Stage 5 — Save as unconfirmed**
All parsed transactions are saved with `confirmed: false` and tagged with a `pdfBatchId`. The user sees a review screen, edits any misclassified rows, then confirms the batch. Only confirmed transactions count toward budgets and analytics.

**What to expect:** Parsing accuracy depends on bank format consistency. HDFC and SBI text PDFs parse reliably. Scanned PDFs have ~85–90% accuracy. Always keep the user review step — do not auto-confirm.

---

## Auto-classification

Handled in `server/services/classifier.js`. Three layers, tried in order:

**Layer 1 — Keyword rules (instant)**
Each `Category` document has a `keywords` array. The classifier lowercases the transaction description and checks for substring matches. First match wins.

Example: `"SWIGGY*ORDER Mumbai"` → matches `["swiggy"]` → category: Dining out

**Layer 2 — Claude API NLP (fallback)**
If no keyword matches, the description is sent to Claude with a prompt that includes the user's category list. Returns a category name and confidence score. Used sparingly — adds ~300ms latency and API cost. Only fires when Layer 1 finds no match.

**Layer 3 — Pending (user classifies)**
If Claude returns low confidence (< 0.7), the transaction is saved with `classifiedBy: 'pending'` and appears in an "uncategorised" queue on the dashboard.

**Improving accuracy over time:**
When a user manually reclassifies a transaction, the corrected keyword is optionally added to that category's `keywords` array. This makes Layer 1 more accurate over time without any ML training.

---

## Family accounts

The `FamilyGroup` model supports households where members want shared financial visibility without losing individual privacy.

**How linking works:**

1. Group owner creates a family group and sends email invites
2. Invited member receives a link with a one-time token (expires in 48 hours)
3. Member accepts and sets their own `viewScope`:
   - `summary` — others see only your total spend/save numbers
   - `categories` — others see category-level breakdown (₹8,000 on groceries), no transaction descriptions
   - `full` — others see all your transactions including descriptions
4. Default scope on joining is `summary`. Members upgrade voluntarily.

**The shared dashboard** aggregates each member's data at their permitted scope. It never merges accounts — each person still owns their own transactions. The aggregation query in `server/routes/family.js` enforces scope at the database layer, not just the UI.

**What family accounts are not:**

- A joint account — there is no shared wallet or shared budget
- A way to edit another member's transactions — all access is read-only
- Automatic — every data-sharing action requires explicit consent

---

## Investment section

Tracks contributions to wealth-building instruments. Logged as `type: 'investment'` transactions under investment categories (Mutual funds, Stocks/ETF, Fixed deposits, PPF/NPS).

**Projection data** is pulled from [MFAPI.in](https://api.mfapi.in) — a free API for Indian mutual fund NAV history. The app shows historical category returns as context, not as financial advice or personalised predictions. No SEBI-regulated projections are made.

> **Disclaimer shown in the UI:** "Return projections are based on historical data and are for reference only. Past performance does not guarantee future returns. Consult a SEBI-registered advisor before making investment decisions."

---

## Goal-oriented savings

Goals link to transactions. When logging an expense or investment, users can optionally tag it toward a goal.

**How the math works:**

```
monthlyTarget = (targetAmount - currentAmount) / monthsUntilTargetDate
```

Recomputed on every save via a Mongoose `pre('save')` hook. If `currentAmount >= targetAmount`, status auto-updates to `completed`.

**`currentAmount` is kept in sync atomically** using MongoDB sessions (see `models/index.js` for the pattern). Never compute it by summing transactions at read time — that's a full scan on every goal card.

**Goal types:** `emergency_fund`, `purchase` (car, appliance), `travel`, `education`, `retirement`, `other`

**Funding strategies:** `savings` (from leftover income), `investment` (SIP/MF contributions), or `both`

---

## Roadmap

- [ ] Axis Bank and Kotak PDF parsers
- [ ] UPI transaction import via NPCI AA framework
- [ ] Recurring transaction detection (auto-flag monthly rent, Netflix, etc.)
- [ ] Tax summary export (80C investments, HRA, etc.) for ITR filing season
- [ ] Mobile app (React Native)
- [ ] Multi-currency support for NRIs

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing schema conventions (see `models/index.js` for patterns)
4. Add tests for any new service logic
5. Open a pull request with a clear description of what changed and why

**Before submitting:** Run `npm test` in both `client/` and `server/`. Do not submit PRs with failing tests or hardcoded API keys.

---

## License

MIT License. See `LICENSE` for details.

---

> Built with MongoDB, Express, React, Node.js, and Firebase.
> India-first: INR default currency, Indian bank PDF parsers, MFAPI.in for market data.
