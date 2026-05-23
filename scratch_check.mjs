import { createClient } from '@supabase/supabase-js';

const url = "https://frsxpsgshyksykouzbfh.supabase.co";
const service_key = "sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y"; 
const supabase = createClient(url, service_key, { auth: { autoRefreshToken: false, persistSession: false } });

async function checkUserSkills() {
    const { data } = await supabase.from('user_skills').select('*').eq('user_id', '2ed289cb-7226-4f2f-b112-c01c4c2179f0');
    console.log("user_skills for abdalla:", data);
}

checkUserSkills();
