-- SQL for creating the scheduled_mails table
CREATE TABLE IF NOT EXISTS scheduled_mails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planner_id BIGINT REFERENCES planner(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    schedule_date DATE NOT NULL,
    schedule_time TIME NOT NULL,
    posters TEXT[] DEFAULT '{}',
    email_content TEXT, -- Optional email body content
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_mails_status ON scheduled_mails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_mails_planner_id ON scheduled_mails(planner_id);
