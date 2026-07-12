// Publishable Supabase credentials (safe to expose — access is governed by
// Row Level Security). Env vars take precedence so a different project can
// be wired in without code changes.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://pciyyphxlywzwnptrzmq.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaXl5cGh4bHl3enducHRyem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjQyMTIsImV4cCI6MjA4ODg0MDIxMn0.yHIFtmyjtC8fsvjfBQUGQIYaa8mA0zHhtybnnq_aMSE";
