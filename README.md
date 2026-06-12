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

## 🚀 Oracle Cloud Free Tier Deployment (`deploy.sh`)

An auto-deployment script is included for deploying to Oracle Cloud or general Ubuntu 22.04 LTS servers. It:
1. Installs Node.js v20, Nginx, Certbot, and Python certificates.
2. Registers/runs services concurrently under **PM2 Process Manager** (`msbt-frontend` and `msbt-backend`).
3. Handles Oracle Cloud Ubuntu firewall (`iptables`) rules.
4. Builds the production Next.js application bundle.
5. Deploys an Nginx reverse proxy routing traffic from Port 80/443 to the backend API (`/api`) and Next.js frontend (`/`).
