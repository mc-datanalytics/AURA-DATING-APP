import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------
// IMPORTANT: REPLACE THESE WITH YOUR PROJECT SETTINGS FROM SUPABASE
// -----------------------------------------------------------------
const SUPABASE_URL = 'https://atyjtclfcefgyfcwakdt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp0Y2xmY2VmZ3lmY3dha2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTI2NDgsImV4cCI6MjA3ODk2ODY0OH0.g6JeTdKs_1Oj_oPkGL1Qm7QkdVkP7loNm7pG2J0PbBI';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
