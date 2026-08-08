# Expense Tracker

A full-stack expense tracking application.

**Backend:** NestJS, TypeORM, PostgreSQL, JWT auth, Swagger
**Frontend:** React 19, TypeScript, MUI v7, React Query, Recharts, Vite

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env and set real JWT secrets + a DB password
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3000/api/v1
- Swagger docs: http://localhost:3000/api/v1/docs

The `backend` container automatically runs pending TypeORM migrations before starting.

## Deploying for free (Neon + Render)

### 1. Push this repo to GitHub
```bash
# from the expense-tracker/ folder (already a git repo with one commit)
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
If you don't have a GitHub repo yet: go to github.com → New repository → don't initialize with a README (this project already has one) → copy the URL it gives you into the command above.

### 2. Create a free Postgres database on Neon
1. Sign up at neon.tech (no credit card needed)
2. Create a project → copy the **connection string** it gives you (starts with `postgresql://...`)
3. Keep this tab open, you'll paste it into Render next

### 3. Deploy the backend on Render
1. Sign up at render.com and connect your GitHub account
2. New → Blueprint → select this repo. Render will read `render.yaml` and set up both services automatically
   - If you'd rather do it manually: New → Web Service → select the repo → set **Root Directory** to `backend`, Render will detect the Dockerfile
3. On the backend service, set these environment variables:
   - `DATABASE_URL` → paste the Neon connection string from step 2
   - `CORS_ORIGIN` → your frontend's Render URL (you'll get this in step 4, can update after)
   - `FRONTEND_URL` → same as above
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` → Render's Blueprint auto-generates these; if deploying manually, generate your own with `openssl rand -hex 32`
4. Deploy. Render builds the Docker image and runs migrations automatically (see `dockerCommand` in `render.yaml`)

### 4. Deploy the frontend on Render
1. New → Static Site → same repo → **Root Directory** `frontend`, build command `npm install && npm run build`, publish directory `dist`
2. Set `VITE_API_URL` to your backend's Render URL + `/api/v1` (e.g. `https://expense-tracker-backend.onrender.com/api/v1`)
3. Deploy, then go back to the backend service and update `CORS_ORIGIN`/`FRONTEND_URL` to match this frontend's actual URL

### Notes on the free tier
- The backend spins down after 15 minutes of inactivity and takes 30-50 seconds to wake on the next request — expected on Render's free plan, not a bug
- The frontend (static site) has no sleep penalty and stays instantly responsive
- Neon's free tier caps storage around 0.5GB and may suspend compute when idle, which is fine for a personal/demo app

## Local development (without Docker)

### Backend
```bash
cd backend
cp .env.example .env   # edit DB credentials
npm install
npm run migration:run
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Requires a local PostgreSQL instance matching the `backend/.env` credentials.

## What's implemented

- **Auth:** register (with password confirmation + strength rules), login, refresh-token rotation, remember-me, forgot/reset password, change password, JWT guards
- **Default data seeding:** every new user gets their own independent copy of 12 default categories (Income, Food, Transport, Home, Shopping, Health, Entertainment, Education, Family, Bills, Savings, Other) with subcategories, 6 payment methods, and a default account
- **Categories & Subcategories:** full CRUD, archive/unarchive, move subcategory between categories, protected from deletion while in use
- **Transactions:** CRUD, soft delete, bulk update/delete, duplicate, search/filter/sort/paginate, CSV import, CSV/Excel/PDF export, receipt attachment upload
- **Dashboard:** 10 summary cards + 6 chart endpoints (expenses/income by category, monthly income vs expense, balance trend, savings trend, payment method breakdown)
- **Reports:** daily/weekly/monthly/quarterly/yearly/custom-range reports in PDF, Excel, or CSV
- **Settings:** profile, currency/language/timezone/theme preferences, password change
- **Security:** Helmet, rate limiting, bcrypt (12 rounds), parameterized queries via TypeORM, class-validator on every DTO, global exception filter

## What's not yet done

- CI/CD pipeline (GitHub Actions)
- Automated test suite (unit/integration/e2e)
- ER diagram / relationship diagram images
- Email verification flow (token is generated but no real email provider is wired — see `backend/src/modules/auth/mailer.service.ts`, which logs to console and documents where to plug in SES/SendGrid/etc.)

## Project structure

```
expense-tracker/
├── backend/          NestJS API (see backend/src/modules for feature modules)
├── frontend/          React SPA (see frontend/src/features for pages)
├── docker-compose.yml
└── .env.example
```
