# SQUID PROTOCOL — SURVIVE THE SYSTEM
### High-Stakes Inter-College Technology Survival Tournament Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Node](https://img.shields.io/badge/Node-v22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)

---

## 1. Event & Platform Architecture

**SQUID PROTOCOL — SURVIVE THE SYSTEM** is an authoritative live event tournament platform built for 60 participants (20 teams of 3) competing across 3 progressive survival rounds:

1. **Round 1 — The Signal Protocol (15 min)**:
   - Exactly 10 medium-level technical MCQs delivered strictly **one question at a time**.
   - Server-authoritative timer (15 mins) with reliable **Pause** and **Resume** support.
   - Mutually exclusive live **Red Light** and **Green Light** signal states controlled by administrators.
   - **Double Points is an ADMIN-ONLY modifier**: When active, all rewards and penalties are doubled across all teams.
   - **Green Light**: Correct answer awards +100 (+200 Double Points); wrong answer deducts 50 (100 Double Points).
   - **Red Light**: Submissions remain available. Submitting during Red Light incurs an immediate deduction of -50 (-100 Double Points) regardless of answer correctness. No positive points are ever awarded during Red Light.
2. **Round 2 — The Logic Protocol (20 min)**:
   - Locked until explicitly activated by the administrator.
   - **Stage 1**: Interactive 6×6 **Shape Sudoku** using 6 geometric symbols (Square, Triangle, Circle, Umbrella, Star, Diamond). Mathematically validated against row, column, 2×3 box constraints, and authoritative solution (+100 pts).
   - **Stage 2**: **Broken Logic** technical puzzle (+200 pts). Unlocked exclusively after successful Sudoku completion.
3. **Round 3 — The Final Breach (30 min)**:
   - **Offline Physical Activities**: Cup-transfer challenge and Broken QR code reconstruction conducted and judged physically at the arena venue.
   - **Online Team PIN Gate**: Eligible teams scan their team's QR to display its PIN, then enter it on the signed-in laptop. The debugging challenge stays hidden until verified.
   - **Final Online Debugging Challenge**: Advanced firmware challenge with equivalent **Java**, **Python**, and **C** implementations containing an operator precedence bug (`+` taking precedence over `<<`). Correctly derived final key (`PROTOCOL_BREACH_1040`) awards +200 points once and stamps the final breach timestamp.
4. **Confidential Standings (Admin-Only Leaderboard)**:
   - In accordance with event regulations, the full leaderboard is strictly restricted to tournament administrators.
   - Ordinary participants track their own cumulative score on their squad terminal and cannot access the leaderboard API or standings view.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Canvas Confetti, Web Audio API Sound Synthesizer.
- **Backend**: Node.js, Express, TypeScript, REST API (`/api/v1`), PostgreSQL, Prisma ORM, Server-Sent Events (SSE) live telemetry, Helmet, Rate Limiting, bcrypt, Zod.
- **Infrastructure**: Docker, Docker Compose.

---

## 3. Local Development Quickstart

### Step 1: Install Dependencies
```bash
# In the root repository directory
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Ensure `backend/.env` has:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://squid_user:squid_secret@localhost:5433/squid_protocol?schema=public"
TEST_DATABASE_URL="postgresql://squid_user:squid_secret@localhost:5433/squid_protocol_test?schema=public"
TEST_RESET_ENABLED="false"
SESSION_SECRET="squid-protocol-ultra-secure-session-key-dev-32chars"
JWT_SECRET="squid-protocol-ultra-secure-jwt-key-dev-32chars"
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
```

### Step 3: Start Local Database Container
```bash
docker compose up -d squid-postgres
```

### Step 4: Apply Schema & Load Seed Data
```bash
# Apply schema to local PostgreSQL
npm run db:migrate

# Seed 20 teams, admin account, questions, Sudoku, Broken Logic, and QR tokens
npm run db:seed
```

### Step 5: Start Development Servers
Run backend and frontend concurrently:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:frontend
```

---

## 4. Development Accounts & Default Credentials

The repeatable seed script (`npm run db:seed`) creates all necessary tournament entities:

### Administrator Account
- **URL**: `http://localhost:5173/admin/login` (or access via navbar when logged in)
- **Username**: `admin`
- **Password**: `Admin#2026`

### Participant Team Accounts (20 Teams)
- **URL**: `http://localhost:5173/login`
- **Usernames**: `team01`, `team02`, ..., `team20`
- **PINs / Passwords**:
  - `TEAM01`: `team01#2026`
  - `TEAM02`: `team02#2026`
  - ...
  - `TEAM20`: `team20#2026`

### Round 3 Team PIN Access
After Round 2 eligibility is met, scan the team's Round 3 QR code. It displays that team's PIN (for example, `TEAM01#2026`); enter the same value in Round 3 on the team's signed-in laptop. The server verifies it for that team before revealing the final debugging challenge. Final answer scoring and finishing order are unchanged.

The administrator Question Matrix includes the Round 2 debugging question and Round 3 final debugging challenge, expected answers, and reference solutions. Those values are available only through admin-protected endpoints; participant APIs expose challenge content only after its required stage and access checks.

### Admin Game Reset and Winner Board
The admin dashboard provides a two-step **Reset Game** flow (checkbox confirmation, then the exact text `RESET GAME`). It clears gameplay progress and scores in one transaction, clears Round 3 authorization and the finalized winner snapshot, and restores round controls while preserving accounts, teams, QR tokens, puzzles, questions, and event setup. Every reset attempt is audited.

To prevent accidental data loss, reset is disabled by default. In production, it is available only when `ENABLE_GAME_RESET=true` is explicitly configured. Outside production, it is allowed only for a local database whose name contains `test` or `dev`, or a local development database when the flag is explicitly enabled. The admin Winner Board shows the backend-calculated standings for all non-disqualified teams and can save a finalized snapshot.

### Isolated Test Accounts

The production tournament seed does not create TEST accounts. To create or refresh TEST01–TEST10, use the dedicated development command from `backend/`:

```bash
npm run db:seed:dev
```

It refuses non-local database hosts and database names that do not contain `test` or `dev`. It resets only those ten named test teams and their associated game data.

| Username | Password |
|---|---|
| TEST01–TEST10 | `team01#2026` through `team10#2026` respectively |

---

## 5. Exact Scoring Matrix

| Event Situation | Normal Mode | Double Points Mode (Admin Enabled) |
|---|---:|---:|
| **Green Light — Correct Answer** | **+100** | **+200** |
| **Green Light — Wrong Answer** | **−50** | **−100** |
| **Red Light — Any Submission** | **−50** | **−100** |
| **Round 2 — Shape Sudoku Solved** | **+100** | N/A |
| **Round 2 — Broken Logic Solved** | **+200** | N/A |
| **Round 3 — Team PIN Verified** | Unlocks Challenge | N/A |
| **Round 3 — Final Key Solved** | **+200** | N/A |

---

## 6. Running Tests

```bash
# Run backend regression tests
npm run test:backend

# Run frontend unit tests
npm run test:frontend
```
