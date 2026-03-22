# 🎯 Employee Engagement Tool

A full-stack web application for managing employee engagement activities — with a **Master** configuration page and an **Event Planner** page.

---

## 🏗️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router, Axios     |
| Backend   | Node.js, Express                  |
| Database  | Supabase (PostgreSQL)             |
| Styling   | Custom CSS (dark dashboard theme) |
| Export    | SheetJS (xlsx)                    |

---

## 📁 Project Structure

```
employee-engagement/
├── backend/
│   ├── server.js          # Express API server
│   ├── schema.sql         # Supabase DB schema
│   ├── .env.example       # Environment variable template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── MasterPage.js    # Master config table + modal
    │   │   └── PlannerPage.js   # Event planner table + form
    │   ├── utils/
    │   │   ├── api.js           # Axios API calls
    │   │   └── export.js        # Excel export helper
    │   ├── App.js               # Router + sidebar layout
    │   ├── index.js
    │   └── index.css            # Full design system
    └── package.json
```

---

## 🚀 Quick Start

### Step 1 — Set up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free project
2. Open the **SQL Editor** in your Supabase dashboard
3. Paste and run the contents of `backend/schema.sql`
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

> ⚠️ **Important**: In Supabase, go to **Authentication → Policies** and either disable RLS for both tables (for development) or add policies to allow public read/write. The easiest way for development:
> ```sql
> ALTER TABLE master DISABLE ROW LEVEL SECURITY;
> ALTER TABLE planner DISABLE ROW LEVEL SECURITY;
> ```

---

### Step 2 — Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
PORT=5000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Install dependencies and start:

```bash
npm install
npm start
# OR for hot-reload during development:
npm run dev
```

The backend will run at: **http://localhost:5001**

---

### Step 3 — Start the Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at: **http://localhost:3000**

---

## 🚀 Deploying to Vercel

### Option 1 — Unified Deployment (Recommended)

This project is configured for a single-project deployment on Vercel.

1. Import this repository into Vercel.
2. In the **Project Settings**, add the following **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase anon key.
   - `REACT_APP_API_URL`: `/api` (this tells the frontend to use the serverless backend).
3. Vercel will use the `vercel.json` file to build both the frontend and the backend.

### Option 2 — Separate Deployments

If you want to deploy the frontend and backend as separate projects:

#### 1. Backend Deployment
- Create a new project in Vercel.
- Point it to the `backend/` directory.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the backend environment variables.
- The backend will have its own URL (e.g., `https://my-backend.vercel.app`).

#### 2. Frontend Deployment
- Create a new project in Vercel.
- Point it to the `frontend/` directory.
- Add `REACT_APP_API_URL`: `https://my-backend.vercel.app` (your backend URL).
- The frontend will then connect to your deployed backend.

### CLI Deployment

```bash
# Deploy entire project (unified)
vercel

# Deploy backend only
cd backend && vercel

# Deploy frontend only
cd frontend && vercel
```

---

> The frontend is pre-configured to proxy API calls to `localhost:5001`.

---

## 🔌 API Endpoints

| Method | Endpoint       | Description                     |
|--------|----------------|---------------------------------|
| GET    | /master        | Fetch all master records        |
| POST   | /master        | Add a new master record         |
| PUT    | /master/:id    | Update a master record          |
| DELETE | /master/:id    | Delete a master record          |
| GET    | /regions       | Fetch distinct region names     |
| GET    | /planner       | Fetch all planner records       |
| POST   | /planner       | Add a new event plan            |
| PUT    | /planner/:id   | Update an event plan            |
| DELETE | /planner/:id   | Delete an event plan            |
| GET    | /health        | Server health check             |

---

## 📋 Database Schema

### `master` table
| Column          | Type      | Notes                                          |
|-----------------|-----------|------------------------------------------------|
| id              | UUID      | Primary key (auto-generated)                   |
| region          | TEXT      | Region name                                    |
| head_count      | INTEGER   | Number of employees                            |
| budget_per_head | NUMERIC   | Per-person budget                              |
| birthday_amount | NUMERIC   | Birthday allowance                             |
| festival_amount | NUMERIC   | Festival allowance                             |
| total_amount    | NUMERIC   | Auto-calculated: HC × (Budget + B-day + Fest)  |
| created_at      | TIMESTAMP | Auto-set                                       |

### `planner` table
| Column               | Type | Notes                                      |
|----------------------|------|--------------------------------------------|
| id                   | UUID | Primary key                                |
| region               | TEXT | Links to master region                     |
| event_type           | TEXT | Birthday / Special Day / Festival / Webinar|
| event_date           | DATE | Date of event                              |
| event_name           | TEXT | Name/title of the event                    |
| timing               | TIME | Time of event                              |
| mode                 | TEXT | Online / Offline                           |
| meeting_link         | TEXT | Only for Online mode                       |
| plan_of_activity     | TEXT | Agenda/activities                          |
| hr_spoc              | TEXT | HR point of contact                        |
| mail_to_employees    | DATE | When to send the employee email            |
| poster_required_date | DATE | Deadline for poster/mail content           |
| content_mode         | TEXT | PPT / Video / PDF etc.                     |
| created_at           | TIMESTAMP | Auto-set                               |

---

## ✨ Features

### Master Page
- ✅ View all region records in a sortable table
- ✅ Add new records via modal form
- ✅ Auto-calculate Total Amount
- ✅ Edit existing records inline
- ✅ Delete with confirmation dialog
- ✅ Search by region name
- ✅ Export to Excel
- ✅ Live stats (total regions, head count, budget)

### Planner Page
- ✅ Full event planning form with 12 fields
- ✅ Dynamic Region dropdown (from Master table)
- ✅ Conditional Meeting Link field (Online mode only)
- ✅ Search across event name, region, HR SPOC
- ✅ Filter by event type and region
- ✅ View full event details in modal
- ✅ Edit and delete events
- ✅ Export to Excel
- ✅ Past events shown with reduced opacity

---

## 🔧 Environment Variables

| Variable         | Description                    |
|------------------|--------------------------------|
| PORT             | Backend server port (default 5000) |
| SUPABASE_URL     | Your Supabase project URL      |
| SUPABASE_ANON_KEY| Your Supabase anon/public key  |

For the frontend, optionally create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🛠️ Troubleshooting

**CORS errors** — Make sure the backend is running on port 5000 and the frontend proxy is set correctly in `package.json`.

**Supabase 401/403 errors** — Check that RLS is disabled or policies are correctly set up.

**"relation does not exist"** — Make sure you've run `schema.sql` in the Supabase SQL editor.

**Port conflicts** — Change `PORT` in backend `.env`, and update `REACT_APP_API_URL` in frontend `.env` accordingly.
