// Replace these with your own Supabase project values
const SUPABASE_URL = "https://sfehwodlybnvrbotrtyc.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWh3b2RseWJudnJib3RydHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjM4NDMsImV4cCI6MjA5ODY5OTg0M30.UfW_ytOEdFi645m8vtu4aT3J5QXGzUSg4hFkquhcc10";

// Create a global Supabase client
const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
