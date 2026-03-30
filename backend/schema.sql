-- ============================================================
-- Employee Engagement Tool — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Master Table
CREATE TABLE IF NOT EXISTS master (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region                  TEXT NOT NULL,
  head_count              INTEGER NOT NULL,
  birthday_budget_per_head NUMERIC(12,2) NOT NULL,
  birthday_events         INTEGER NOT NULL,
  birthday_amount         NUMERIC(14,2) NOT NULL,
  festival_budget_per_head NUMERIC(12,2) NOT NULL,
  festival_events         INTEGER NOT NULL,
  festival_amount         NUMERIC(14,2) NOT NULL,
  total_amount            NUMERIC(14,2) NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Planner Table
CREATE TABLE IF NOT EXISTS planner (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region                   TEXT NOT NULL,
  event_type               TEXT NOT NULL CHECK (event_type IN ('Birthday','Special Day','Festival','Webinar')),
  event_category           TEXT,
  event_date               DATE NOT NULL,
  event_name               TEXT NOT NULL,
  timing                   TIME,
  mode                     TEXT CHECK (mode IN ('Online','Offline')),
  meeting_link             TEXT,
  plan_of_activity         TEXT,
  hr_spoc                  TEXT,
  mail_to_employees        DATE,
  poster_required_date     DATE,
  content_mode             TEXT,
  no_of_posters_emails     INTEGER,
  requirement_to_marketing TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Planned vs Actual Table
CREATE TABLE IF NOT EXISTS planned_vs_actual (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  planner_id       UUID NOT NULL REFERENCES planner(id) ON DELETE CASCADE,
  actual_date      DATE,
  actual_time      TIME,
  num_participants INTEGER,
  amount_spent     NUMERIC(14,2),
  supporting_docs  TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table for Login and RBAC
CREATE TABLE IF NOT EXISTS users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  permissions  JSONB NOT NULL DEFAULT '{"master": false, "planner": false, "planned_vs_actual": false, "budget_utilisation": false, "reports": false, "planner_vs_poster": false, "planned_vs_scheduled": false, "scheduled_mails": false}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default admin user (password: admin123)
-- In production, the password should be hashed. 
-- For now, we will hash it in server.js or manually.
-- INSERT INTO users (username, password, role, permissions) 
-- VALUES ('admin', '$2a$10$X8X...', 'admin', '{"master": true, "planner": true, "planned_vs_actual": true, "budget_utilisation": true, "reports": true, "planner_vs_poster": true, "planned_vs_scheduled": true, "scheduled_mails": true}');

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE master ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE planner ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE planned_vs_actual ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for development (restrict in production)
-- CREATE POLICY "Allow all" ON master FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON planner FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON planned_vs_actual FOR ALL USING (true);
