import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Extract env vars
const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const supabaseUrlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const serviceKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch[1].trim();
// Use service role if available to bypass RLS for debugging
const supabaseKey = (serviceKeyMatch && serviceKeyMatch[1]) ? serviceKeyMatch[1].trim() : supabaseKeyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  console.log("Users:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

checkUsers();
