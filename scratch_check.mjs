import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const service_key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !service_key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY");
}
const supabase = createClient(url, service_key, { auth: { autoRefreshToken: false, persistSession: false } });

async function checkUserSkills() {
    const { data } = await supabase.from('user_skills').select('*').eq('user_id', '2ed289cb-7226-4f2f-b112-c01c4c2179f0');
    console.log("user_skills for abdalla:", data);
}

checkUserSkills();
