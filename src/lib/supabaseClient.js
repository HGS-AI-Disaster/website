import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://vmnpufbubicxnqzjzqhp.supabase.co" // ganti dengan project kamu
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnB1ZmJ1YmljeG5xemp6cWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjc0MTIsImV4cCI6MjA2OTkwMzQxMn0.65INmilWlVb_7Kj3aR_7dmjzAmsJoEN2Int4ZOYfsJU" // pakai anon key dari Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)
