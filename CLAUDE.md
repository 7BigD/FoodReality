# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**店小乖 (DianXiaoGuai)** — a hackathon demo for a smart restaurant near-field engagement system. Two tablet UIs (customer-facing robot tablet + staff management tablet) communicate through a shared FastAPI backend with SQLite.

## Commands

### Backend
```bash
cd backend
pip3 install -r requirements.txt        # Install dependencies
python3 -m app.seed                      # Initialize seed data (requires empty DB)
python3 -m uvicorn app.main:app --reload --port 8000   # Start API server
# Swagger docs: http://localhost:8000/docs
```

To reset the database: `rm -f backend/food_reality.db && cd backend && python3 -m app.seed`

### Frontend
```bash
cd frontend
pnpm install                             # Install monorepo dependencies
pnpm --filter robot-tablet dev           # C端 customer tablet → localhost:5173
pnpm --filter store-tablet dev           # B端 staff tablet → localhost:5174
```

## Architecture

### Backend (`backend/app/`)

FastAPI + SQLAlchemy 2.0 + SQLite. Single-file DB at `backend/food_reality.db`, auto-created on startup.

- `main.py` — App entry, CORS (allow all), registers 8 routers
- `database.py` — SQLAlchemy engine + `get_db` dependency
- `models.py` — 8 ORM models: Member, Queue, Glasses, Store, Product, Sample, SampleRecord, GameRecord
- `schemas.py` — Pydantic v2 request/response models (`model_config = {"from_attributes": True}`)
- `routers/` — One file per domain (member, queue, glasses, store, product, sample, game, dashboard)
- `seed.py` — Guarded by `if not db.query(Store).first()` — won't re-insert if data exists; delete DB to re-seed

**Key model relationships**: Queue ↔ Glasses has bidirectional FKs (Queue.glasses_id → Glasses.id AND Glasses.current_queue_id → Queue.id). The relationships use explicit `foreign_keys=` to disambiguate.

### Frontend (`frontend/`)

pnpm workspace monorepo with 3 packages:

- `apps/robot-tablet` — Customer-facing kiosk UI (React 18 + Tailwind CSS + Material Symbols). Uses `tablet-viewport` CSS class for device-frame appearance (1024×768 constrained, rounded corners, dark surround). No Ant Design — pure Tailwind.
- `apps/store-tablet` — Staff management dashboard (React 18 + Ant Design 5). Sidebar layout with 7 pages.
- `packages/shared` — Shared TypeScript types (`types/index.ts` mirrors Pydantic schemas) and Axios API client (`api/index.ts`, baseURL `http://localhost:8000`)

Both apps import API functions via `@food-reality/shared/api` and types via `@food-reality/shared/types`.

### Core Business Logic

| Rule | Implementation |
|------|---------------|
| Idempotent member registration | SELECT by phone → exists? return : INSERT |
| Daily 3-take queue limit | COUNT today's queue records per member_id |
| Queue number auto-increment | Query today's MAX queue_number, +1, format `A001` |
| Sample claim deduplication | Check sample_record for member_id + sample_id before INSERT |
| Glasses binding exclusivity | Validate status == "available" before binding |
| Queue state machine | waiting → called → completed; waiting → cancelled |

## Design Docs

- `RequirementDesign.md` — Data models (8 tables), business rules, system roles
- `TechDesign.md` — API endpoint specs, frontend page/route mapping, project structure
- `SoftwareArchitecture.md` — System flow diagrams, module breakdown, third-party dependencies
