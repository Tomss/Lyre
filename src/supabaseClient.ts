// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Remplacez les valeurs ci-dessous par celles de votre projet Supabase
const supabaseUrl = 'https://iptlsrswleozznajpizp.supabase.co'
const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdGxzcnN3bGVvenpuYWpwaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTgyNTUsImV4cCI6MjA3MDczNDI1NX0.k7ylhmfM0EF_BTZzD-WWcfBnbOVJqxCbG0WI5ZA7rxE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)