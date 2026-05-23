import { createClient } from '@supabase/supabase-js';

const url = "https://frsxpsgshyksykouzbfh.supabase.co";
const service_key = "sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y"; 
const supabase = createClient(url, service_key, { auth: { autoRefreshToken: false, persistSession: false } });

async function fixUserSkillsAndMatch() {
    console.log("Fetching all student profiles...");
    const { data: users, error: fetchErr } = await supabase.from('users').select('*').eq('role', 'student');
    if (fetchErr) {
        console.error("Fetch err:", fetchErr);
        return;
    }
    
    for (const u of users) {
        console.log(`Processing ${u.email}...`);
        
        // Populate user_skills
        const skills = u.skills || [];
        for (const s of skills) {
            const { data: sid, error: rpcErr } = await supabase.rpc('get_or_create_skill', { p_name: s });
            if (rpcErr) {
                console.error("Error creating skill", s, rpcErr.message);
                continue;
            }
            if (sid) {
                await supabase.from('user_skills').upsert({ user_id: u.id, skill_id: sid }, { onConflict: 'user_id,skill_id' });
            }
        }
        
        // Generate matches
        console.log(`Generating matches for ${u.email}...`);
        const { error: mErr } = await supabase.rpc('generate_internship_matches', { p_student_id: u.id });
        if (mErr) {
            console.error("Match error:", mErr.message);
        } else {
            console.log("Matches generated successfully.");
        }
    }
    
    const { count: mCount } = await supabase.from('matching_results').select('*', { count: 'exact', head: true });
    console.log("Total matching results in DB now:", mCount);
}

fixUserSkillsAndMatch();
