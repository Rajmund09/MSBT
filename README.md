# Mahalaxmi Samprat Behara Traders (MSBT) - Digital Operating System & ERP

Welcome to the enterprise-grade Digital Operating System and ERP platform for **MAHALAXMI SAMPRAT BEHARA TRADERS (MSBT)**. 

This system completely digitizes manual ledger keeping, trip sheets, registers, and receipts into a modern, robust, mobile-first dashboard and business intelligence platform.

---

## 🏗️ Project Architecture & File Structure

This project is structured as a professional, monorepo-style codebase separating concerns cleanly:

```
MSBT/
├── package.json                   # Root orchestrator (run frontend & backend concurrently)
├── README.md                      # Core documentation and guide
├── database/                      # DB schemas and migrations
│   ├── schema.sql                 # Production PostgreSQL schema
│   └── seed.sql                   # Initial master & testing seeds
├── server/                        # Express API Backend
│   ├── package.json               # Backend dependencies
│   ├── server.js                  # Express API Server entrypoint
│   ├── config/                    # DB adapters (Auto-switching SQLite / Postgres)
│   ├── controllers/               # Business logic & actions
│   ├── middleware/                # Auth (JWT), RBAC, input sanitization
│   └── routes/                    # API Routing definitions
└── client/                        # PWA Frontend (Vite + React)
    ├── package.json               # Client dependencies
    ├── vite.config.js             # Vite configurations
    ├── index.html                 # PWA HTML Entrypoint
    └── src/                       # Frontend source files
        ├── main.jsx               # React Entry
        ├── App.jsx                # Layout, Router, & Contexts
        ├── styles/                # Variables, global and modular CSS
        ├── components/            # Reusable UI widgets, loaders, charts
        └── pages/                 # Full screen modules (Dashboard, Ledger, etc.)
```

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM

### 1. Install Dependencies
Run the install command from the root directory to automatically resolve packages in both client and server:
```bash
npm run install:all
```

### 2. Development Run
Start both backend API server and Vite development frontend concurrently with a single command:
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🛡️ Security Features
- **RBAC (Role-Based Access Control)**: Enforces specific permission checks for Owner, Co-Owner, Manager, Accountant, and Employee roles.
- **Parametrized Queries**: Full protection against SQL injection.
- **Audit Logs**: Automatic, immutable activity tracing for all modification operations.
- **Input Verification**: Schema-driven validation using `express-validator`.
