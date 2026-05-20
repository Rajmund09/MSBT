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
└── client/                        # Modern Next.js Frontend (App Router)
    ├── package.json               # Client dependencies
    └── src/                       # Frontend source files
        ├── app/                   # Next.js App Router pages & layouts
        ├── components/            # Reusable UI widgets, layout, animations
        ├── contexts/              # Global state and contexts
        └── utils/                 # API integrations, utilities (export, audio)
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

---

## ✨ Recent Features & Enhancements
- **Advanced UI/UX**: Custom cursors, floating navigation, and hardware-accelerated page transitions for a fluid, app-like feel.
- **Cinematic Pixel Wipes**: Highly optimized canvas-based pixel wipe animations engineered to run at a flawless 60fps without layout shifts or double scrollbars.
- **Global Search**: Instantly find customers, entries, and records across the entire platform.
- **Analytics & Billing**: Dedicated modules for deep financial insights and streamlined invoice management.
- **Authentication & User Management**: Secure login flow, AuthContext for robust session state management, and user administration pages.
- **Audio Feedback & Export Utilities**: Subtle audio cues for interactions and robust data export capabilities (CSV/Excel).
- **Interactive Components**: Comprehensive set of reusable UI elements including Modals, Toasts, and Confirm Dialogs.
- **Interactive Calendar & Operations Timeline**: Fully integrated `/calendar` dashboard showing a visual mini-calendar with event indicators and a daily timeline detailing tasks, payments (collections), and work entries (trips/hours).
- **Apple-Style Quick Actions Grid**: Dashboard quick links redesigned with squircle icon slots, left-aligned typographic hierarchy, and dynamic color-matched glowing hover indicators.
- **Warm Alabaster & Midnight Obsidian Themes**: Premium color palette replacing standard black and white with eye-friendly warm alabaster linen (`#f6f5f0`) and rich midnight obsidian (`#0a0b10`) to enhance visual depth and contrast.

