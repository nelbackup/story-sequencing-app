// Replace these with your actual credentials from Supabase Project Settings -> API
const SUPABASE_URL = "https://pkbjhkqzhmnqkjiytsvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYmpoa3F6aG1ucWtqaXl0c3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzcyOTcsImV4cCI6MjEwNDQ1MzI5N30.andegTlNaFr9J2INSePA49LPxRC96XWiIA0LJdN8I_w";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);