// Publishable Supabase credentials (safe to expose — access is governed by
// Row Level Security). Env vars take precedence so a different project can
// be wired in without code changes.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://wxllqckypgfqlhslhkkw.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bGxxY2t5cGdmcWxoc2xoa2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDQ2MTEsImV4cCI6MjA5OTcyMDYxMX0.GM2HFMAhFVIgFJLTtKJL9FV8UKFvi4aUYYT3vYA5Pjk";
