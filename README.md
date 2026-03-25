# ProtoBoard

> Drag-and-drop dashboard prototyping tool. Build layout mockups in the browser, export to PNG.

## Stack

- **Frontend:** React 18 + Vite, Recharts, Phosphor Icons, html-to-image
- **Backend:** FastAPI + SQLAlchemy, JWT auth (python-jose + bcrypt), SQLite
- **Design:** Nabati-inspired system — chocolate brown primary + antique gold accent

## Features

- 5 component types: KPI Card, Bar Chart, Line Chart, Pie Chart, Data Table
- Drag-and-drop canvas with 8px grid snapping
- Touch-enabled (drag + resize) on mobile
- Save/load/delete layouts per account
- PNG export
- Responsive layout (sidebar collapses on mobile)

## Running locally

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8013

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Production

```bash
# Build frontend
cd frontend && npm install && npm run build

# Run combined server (serves frontend + proxies API)
python combined-server.py
```
