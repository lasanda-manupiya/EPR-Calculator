# SustainZone EPR Packaging Estimation and Reporting System (MVP)

## Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: SQLite (production-ready schema for PostgreSQL migration)
- Auth: JWT + bcrypt password hashing

## Features
- User registration and login
- Protected dashboard routes
- Product creation with packaging components
- Material and packaging type based reference matching
- EPR weight estimation, confidence levels, and method notes
- Dashboard summary report
- CSV and PDF report export
- Seeded reference packaging library and demo user

## Run locally
```bash
cd backend && npm install && npm run seed && npm run dev
# new terminal
cd frontend && npm install && npm run dev
```

Demo login:
- Email: demo@sustainzone.co.uk
- Password: DemoPass123!

## Production notes
- Set `JWT_SECRET` and `DATABASE_URL` via environment variables.
- Replace SQLite connection with PostgreSQL adapter while keeping model structure.
