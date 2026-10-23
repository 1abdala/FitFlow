import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const service_key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !service_key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY");
}
const supabase = createClient(url, service_key);

async function testFetch() {
    // 1. Get student profile for abdalla
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', '%abdalla%');
        
    if (pErr) {
        console.error("Error fetching profile:", pErr);
        return;
    }
    
    if (!profiles || profiles.length === 0) {
        console.error("No profile found for abdalla");
        return;
    }
    
    const student = profiles[0];
    console.log(`Found student: ${student.full_name} (${student.email}) with ID: ${student.id}`);
    
    // 2. Fetch matches using the exact query from Dashboard.jsx
    const { data: matchesData, error: matchesErr } = await supabase
        .from('matching_results')
        .select(`
          id,
          match_score,
          internships ( id, title, company_name, location, apply_url, description, created_at, last_seen_at, company_logo_url, internship_skills ( skills ( name ) ) ),
          skill_gaps ( skills ( name ) )
        `)
        .eq('student_id', student.id)
        .order('match_score', { ascending: false })
        .limit(5);

    if (matchesErr) {
        console.error("Query Error:", matchesErr);
        return;
    }
    
    console.log("\nMatches returned to frontend query:");
    matchesData.forEach((m, idx) => {
        console.log(`\nMatch ${idx + 1}:`);
        console.log(`  Score: ${m.match_score}%`);
        console.log(`  Internship Title: ${m.internships?.title}`);
        console.log(`  Company: ${m.internships?.company_name}`);
        console.log(`  Logo URL: ${m.internships?.company_logo_url}`);
    });
}

testFetch();
