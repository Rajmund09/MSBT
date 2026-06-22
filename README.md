# Mahalaxmi Samprat Behara Traders (MSBT) - Digital Operating System & ERP

Welcome to the enterprise-grade Digital Operating System and ERP platform for **MAHALAXMI SAMPRAT BEHARA TRADERS (MSBT)**.

This system completely digitizes manual ledger keeping, trip sheets, registers, and receipts into a modern, robust, mobile-first dashboard and business intelligence platform designed specifically for agricultural trading and service environments.

---

## 🏗️ Project Architecture & File Structure

This project is structured as a professional, monorepo-style codebase separating concerns cleanly:

```
MSBT/
├── package.json                   # Root orchestrator (runs frontend & backend concurrently)
├── README.md                      # Core documentation and guide
├── deploy.sh                      # Ubuntu + Oracle Cloud Free Tier deployment script
├── database/                      # DB schemas and migrations
│   ├── schema.sql                 # Production PostgreSQL schema
│   ├── sqlite_schema.sql          # Local SQLite development schema
│   └── seed.sql                   # Initial master & testing seeds
├── server/                        # Express.js API Backend
│   ├── package.json               # Backend dependencies
│   ├── server.js                  # Express API Server entrypoint
│   ├── config/                    # DB adapters (Auto-switching SQLite / Postgres)
│   ├── controllers/               # Business logic & controllers
│   ├── middleware/                # Auth (JWT), RBAC, input validation
│   └── routes/                    # API Routing definitions
└── client/                        # Next.js Frontend (App Router)
    ├── package.json               # Client dependencies
    └── src/                       # Frontend source files
        ├── app/                   # Next.js App Router pages & layouts
        ├── components/            # Reusable UI widgets, layouts, and animations
        ├── contexts/              # Global state (Auth, Interaction, Toast)
        └── utils/                 # API integrations, export, and canvas utilities
```

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM (v9 or higher)

### 1. Install Dependencies
Run the install command from the root directory to automatically resolve packages in both client and server:
```bash
npm run install:all
```

### 2. Run Local Development (Zero-Config)
By default, the server switches to a local SQLite database if no database environment variables are set. Simply run:
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:3000` (Next.js dev server)
- **Backend API**: `http://localhost:5000` (Express server)

> **Note:** The root `dev` script uses `next dev --webpack` (not Turbopack). See the [Development Performance Diagnosis](#-development-performance-diagnosis-report) section below for the full rationale.

---

## 🔌 Core Tech Stack & Infrastructure Features

### 🔀 Auto-Switching Database Adapter (`db.js`)
The database module (`server/config/db.js`) provides an intelligent database interface:
- **SQLite (Local Development)**: Fallback database using local file storage (`database/msbt.db`) enabling developers to get started immediately without installing databases.
- **PostgreSQL (Production/Vercel)**: Automatically engages when `DB_TYPE=postgres` is set. Optimized for serverless environments (e.g. Vercel) by maintaining a strict connection limit (`max: 2`), rapid idle timeouts (`15s`), and short connection timeouts (`3s`) to prevent Supabase/PostgreSQL connection pool exhaustion.
- **Dynamic Query Translation**: Translates SQL syntax in real time. Plural `?` placeholders are dynamically rewritten to indexed `$1, $2` parameters for Postgres, and SQLite `strftime` calls are automatically translated into `TO_CHAR` functions.
- **Exponential Backoff Connection Retry**: Retries PostgreSQL connections with exponential backoff on serverless cold starts.

### 🏗️ Auto-Migrations & Verification
The database adapter automatically audits and runs table creation and update operations on startup:
- Validates that the core tables (`users`, `seasons`, `customers`, `entries`, `payments`, `invoices`, `audit_logs`, `tasks`) exist.
- Dynamically performs table alterations if columns (like `permissions` or `profile_photo` in `users`) are missing.
- Automatically updates entries' check constraints to seamlessly support newer entry types.

---

## ✨ Business Operations & Ledger Features

### ⏱️ Per-Minute Billing Engine & Calculations
To accommodate diverse machinery and labor logging, the system supports highly granular calculation modes for entries:
- **Trip**: Used for transportation services (e.g., tractor trips). Total = `Quantity (No. of Trips) * Rate per Trip`.
- **Trade**: Used for commodities and trade goods. Total = `Quantity (Quintals/Units) * Rate per Unit`.
- **Minute**: Used for precise machine or labor logging in minutes. Total = `Quantity (Minutes) * Rate per Minute`.
- **Hour**: Used for hourly equipment leases where rate is recorded per minute. Total = `Quantity (Hours) * Rate per Minute * 60`.
This ensures billing transparency down to the exact minute.

### 👥 Inline Customer Creation
Operators can register and auto-select a new customer inline directly inside the **New Entry** dialog modal without interrupting the ledger creation flow.

### 📞 Optional Customer Contacts
The customer phone number is optional (`phone` value defaults to an empty string `""` if not provided), accommodating rural farmers and traders who may not have active contact details.

### 📄 Devotional Billing Receipts (A4 Print & PDF)
- **जय श्री श्याम Header**: Renders a professional, standard invoice layout with a traditional devotional invocation header ("॥ जय श्री श्याम ॥") honoring trading custom.
- **A4 PDF Download**: Utilizes Client-side `html2canvas` and `jsPDF` for pixel-perfect generation of invoice sheets.
- **Tailored CSS Print Stylesheet**: Includes page-break controls and elements visibility styling so using standard browser print (`Ctrl+P`) isolates the invoice container on clean A4 printable pages with signature fields.

---

## 🎨 Premium UI/UX & Interaction Design

- **Adaptive Tooltip System**: The custom `AdaptiveTooltip` component intelligently shifts styles based on the user's hardware:
  - **Desktop (Hover)**: Displays a lightweight, floating tooltip text balloon.
  - **Mobile (Touch)**: Displays an elegant, bottom-sheet slide-up panel triggered by long-pressing an element, complying with mobile gestures.
- **Warm Alabaster & Midnight Obsidian Themes**: Uses custom eye-friendly canvas backdrops: `#f6f5f0` (warm alabaster linen) and `#0a0b10` (midnight obsidian) rather than raw black and white to increase depth.
- **Cinematic Pixel Wipes**: Canvas-based transition animations engineered to run at a hardware-accelerated 60fps without causing layout shifts or double scrollbars.
- **Data Export Center**: Exports entries dynamically through a wizard supporting Full Exports, Customer-wise Exports, and Season-wise Exports to formatted CSV or Excel files.

---

## 🛡️ Security Features
- **RBAC (Role-Based Access Control)**: Enforces specific permission checks for Owner, Co-Owner, Manager, Accountant, and Employee roles.
- **Parametrized Queries**: Fully protects the application against SQL injection.
- **Audit Logs**: Immutable activity tracing logs logged to the `audit_logs` table for all modifications (creating/deleting entries, updating payments, altering customers).
- **Helmet Security**: Integrated Helmet middleware to set secure HTTP headers.

---

## 🆕 Recent Performance & UX Upgrades

- **⚡ N+1 Database Resolution:** Optimized the customer listing endpoint (`/api/customers`) by aggregating customer revenue and collections into bulk SQL queries, dropping database connections from `1 + 8*N` down to a flat 5 queries, eliminating Vercel's 5-second serverless execution timeouts.
- **📅 Dashboard Season Filtering:** Added an interactive season selector to the main dashboard. Users can filter counters, active customer summaries, and metrics cards (Total Revenue, Collected, and Outstanding) by season, defaulting to a unified global "All Seasons" view.
- **⌨️ Keyboard-Driven Select Dropdowns:** Enhanced the custom `Select` component with a type-ahead keyboard filtering mechanism. Without an intrusive visible search bar, users can type options to search, navigate with `Enter` / `Backspace`, and clear their typed query automatically after 1.5 seconds of inactivity.
- **📊 Adaptive Chart Themeing & Layouts:** Refactored the Analytics dashboard widgets using dynamic CSS theme variables (`var(--fg)`, `var(--fg-muted)`, `var(--border)`). Ensured the Pie Chart container utilizes block-allocated dimensions to prevent responsive container width collapses.
- **📌 Standing Entry Modals:** Modified "Add Entry" modals to remain open for rapid, repetitive entries. Submitting a new record updates the data grid in the background and clears only `quantity` and `description` fields, while preserving chosen metadata (customer, season, rate, and entry date) until dismissed.
- **🔐 Auth Session Persistence Fix:** Fixed a critical bug where any server-side error (HTTP 500) would silently call `clearSession()` and wipe the user's "Keep Me Signed In" token from `localStorage`. The fix now discriminates between genuine auth failures (`401`/`403`) which correctly force re-login, and transient server errors (`500`, network failures) which preserve the session and cached user state.
- **🎞️ Dashboard Number Scramble Animation:** Added a text-decryption/scramble effect on all seven metric numbers (Total Revenue, Collected, Outstanding, Today Revenue, Today Collected, Customers, Total Entries). The animation fires exclusively on the number content — not the card, border, label, or icon — whenever the season filter changes, providing clear visual feedback that data is refreshing.

---

## 🚀 Oracle Cloud Free Tier Deployment (`deploy.sh`)

An auto-deployment script is included for deploying to Oracle Cloud or general Ubuntu 22.04 LTS servers. It:
1. Installs Node.js v20, Nginx, Certbot, and Python certificates.
2. Registers/runs services concurrently under **PM2 Process Manager** (`msbt-frontend` and `msbt-backend`).
3. Handles Oracle Cloud Ubuntu firewall (`iptables`) rules.
4. Builds the production Next.js application bundle.
5. Deploys an Nginx reverse proxy routing traffic from Port 80/443 to the backend API (`/api`) and Next.js frontend (`/`).

---

## 🩺 Development Performance Diagnosis Report

> **Classification:** Internal Engineering Record  
> **Project:** MSBT ERP  
> **Date:** 01 July 2026  
> **Framework:** Next.js 16.2.7 → 16.2.9 + React 19 + Express + SQLite  
> **Environment:** Windows 11, Node.js v24.14.0  
> **Hardware:** ASUS Vivobook 16X (Intel Core i5-13420H, 16 GB RAM, NVIDIA RTX 3050)  
> **Diagnosis Confidence:** ≈ 95% (based on controlled A/B test)

---

### Executive Summary

After extensive investigation, testing, and analysis, the root cause was identified as a **development-environment issue** rather than a hardware or application logic failure.

The critical discovery:

> Switching the development server from Turbopack to Webpack (`next dev --webpack`) **immediately and completely eliminated the severe lag.**

This confirms that the application's production code is fundamentally healthy and that the primary issue lies in the interaction between Turbopack, the project's workspace structure, and the local development environment.

---

### Symptoms Observed

The following symptoms occurred exclusively during `npm run dev` (local development):

| Symptom | Observed |
|---|---|
| Severe system-wide lag | ✅ Yes |
| Chrome unresponsive ("Rendering...") | ✅ Yes |
| Windows RAM usage at 100% | ✅ Yes |
| Disk I/O at 100% | ✅ Yes |
| Node.js memory spiking to several GB | ✅ Yes |
| Turbopack cache/memory-mapping errors | ✅ Yes |
| Epic Games Launcher crashing (memory pressure) | ✅ Yes |

**Notably absent in production:**

| Scenario | Performance |
|---|---|
| Production deployment (Vercel) | ✅ Normal |
| Local production build (`next build`) | ✅ Normal |
| AAA games (Hogwarts Legacy) | ✅ Normal |
| GPU & CPU temperatures | ✅ Within spec |

The contrast between production health and development failure immediately ruled out hardware as the cause.

---

### Root Cause Analysis

#### Primary Root Cause — Turbopack Development Server

The definitive evidence was a single controlled variable change:

**Before (Turbopack — default):**
```json
"dev": "next dev"
```
→ System became extremely laggy and nearly unusable.

**After (Webpack):**
```json
"dev": "next dev --webpack"
```
→ Lag disappeared immediately. System returned to full responsiveness.

**Conclusion:** The bottleneck was the development bundler (Turbopack), not the React application, hardware, or any business logic.

---

#### Contributing Factor 1 — Project Located Inside OneDrive

```
C:\Users\prabh\OneDrive\Desktop\MSBT
```

Turbopack performs aggressive file-watching and continuously writes thousands of incremental cache files into `.next/`. OneDrive simultaneously indexes, synchronizes, and holds file handles on those same files. This creates a compounding I/O feedback loop where:

- Turbopack writes → OneDrive re-indexes → Turbopack re-reads → repeat.

**Recommendation:** Move the active project to a non-synced location:
```
C:\Dev\MSBT
```
or
```
D:\Projects\MSBT
```

#### Contributing Factor 2 — Multiple Lockfiles Detected

Next.js reported:
```
Multiple lockfiles detected
```

This forced Turbopack to spend additional cycles determining the workspace root on every startup. While not the primary cause, it added unnecessary overhead.

**Recommendation:** Maintain a single `package-lock.json` at the root level. Remove orphaned lockfiles.

#### Contributing Factor 3 — Oversized `.next` Development Cache

The `.next` development cache had grown large over time, increasing:
- Cold-start time
- Cache invalidation and lookup time
- Hot-reload rebuild time

**Recommendation:** Periodically delete `client/.next` when development performance degrades. The cache rebuilds automatically on the next `npm run dev`.

#### Contributing Factor 4 — Animation-Heavy Frontend

The frontend includes:
- Framer Motion (page transitions, metric cards, scroll animations)
- Custom canvas-based pixel wipe transitions
- Custom cursor with magnetic hover effects
- Lenis smooth scroll

These are correct architectural choices for the design goals. However, they increase the volume of modules Turbopack must track and recompile on every hot reload. Webpack handles this category of project more efficiently in the current Next.js 16 release.

---

### What Was Ruled Out

| Candidate | Verdict | Evidence |
|---|---|---|
| Hardware (CPU/RAM/GPU) | ❌ Not the cause | AAA games ran normally |
| Chrome browser | ❌ Not the cause | Chrome RAM was within normal range |
| Express backend | ❌ Not the cause | Backend alone used minimal resources |
| SQLite database | ❌ Not the cause | Database behaved normally in isolation |
| React application code | ❌ Not the cause | Production builds executed correctly |
| Network/API latency | ❌ Not the cause | Local-only reproduction |

---

### Solution Applied

**File changed:** `client/package.json`

```diff
- "dev": "next dev",
+ "dev": "next dev --webpack",
```

**Observed results after the change:**

| Metric | Before | After |
|---|---|---|
| System lag | Severe | None |
| Chrome rendering | Unresponsive | Smooth |
| RAM usage | ~100% | Normal |
| Disk I/O | ~100% | Normal |
| Node.js memory | Spikes to ~6 GB | Stable ~400 MB |
| Development usability | Nearly unusable | Fully responsive |

---

### Additional Fixes Applied on 01 July 2026

#### Fix 1 — Auth Session Persistence (`client/src/contexts/AuthContext.jsx`)

**Problem:** The `catch` block in the startup token validation called `clearSession()` unconditionally on any error, including transient HTTP 500 server errors. This silently wiped the user's "Keep Me Signed In" `localStorage` token, causing forced re-login on every page refresh even when the token was perfectly valid.

**Root Cause:** A local database reset triggered a server 500 error during startup, which the client incorrectly treated as an authentication failure.

**Fix Applied:**
```diff
- .catch(() => {
-   clearSession();
-   setUser(null);
- })
+ .catch((err) => {
+   // Only clear session on true auth failures (401/403)
+   // Preserve session on server errors (500) or network failures
+   if (err.status === 401 || err.status === 403) {
+     clearSession();
+     setUser(null);
+   } else {
+     if (!cached) setUser(null);
+   }
+ })
```

#### Fix 2 — Dashboard Number Scramble Animation (`client/src/app/page.js`)

**Enhancement:** Added a text-decryption scramble effect that fires exclusively on the seven metric number values when the season filter changes. The animation cycles through random numeric characters left-to-right over 18 frames (~630 ms), resolving to the real value. Cards, borders, labels, and icons are completely unaffected.

**Affected values:** Total Revenue · Collected · Outstanding · Today Revenue · Today Collected · Customers · Total Entries

---

### Recommended Preventive Actions

| Priority | Action |
|---|---|
| 🔴 High | Move project to `C:\Dev\MSBT` outside OneDrive |
| 🔴 High | Remove `client-gsap-backup/` and other backup folders from the workspace |
| 🟡 Medium | Periodically delete `client/.next` when development performance degrades |
| 🟡 Medium | Keep a single `package-lock.json`; remove duplicate lockfiles |
| 🟢 Low | Migrate to Node.js 20 LTS when Next.js version compatibility requires it |

---

### Lessons Learned

1. **Production and development behave differently.** A project can perform perfectly in production while development mode is unusable, because dev tooling performs hot reload, file watching, source map generation, and incremental compilation — all simultaneously.

2. **Isolate one variable at a time.** Changing only the bundler flag (`--webpack`) immediately identified the root cause. Shotgun-style changes would have obscured the diagnosis.

3. **Cloud-synced folders conflict with modern build tools.** OneDrive, Dropbox, Google Drive, and similar services interfere with any bundler that performs high-frequency filesystem writes (Turbopack, Vite, webpack-dev-server). Always develop in a local, non-synced directory.

4. **Hardware is rarely the bottleneck.** Before optimizing code or upgrading hardware, always verify that the development toolchain itself is not the constraint.

5. **Measure before optimizing.** The A/B test (Turbopack vs. Webpack) took under two minutes and provided 95% confidence in the diagnosis. Controlled testing is more valuable than speculative code changes.

---

*This report is maintained as part of the MSBT ERP internal engineering record.*

