import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY");
}
const supabase = createClient(url, key);

async function testFetchMatches() {
    console.log("Attempting login...");
    if (!process.env.SCRATCH_TEST_EMAIL || !process.env.SCRATCH_TEST_PASSWORD) {
        throw new Error("Missing SCRATCH_TEST_EMAIL or SCRATCH_TEST_PASSWORD");
    }

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: process.env.SCRATCH_TEST_EMAIL || '',
        password: process.env.SCRATCH_TEST_PASSWORD || ''
    });
    
    if (authErr) {
        console.error("LOGIN FAILED:", authErr.message);
        return;
    }
    
    console.log("Logged in. Fetching matches...");
    
    const { data, error } = await supabase
        .from('matching_results')
        .select(`
            id,
            match_score,
            internships ( title, company_name, location, apply_url ),
            skill_gaps ( skills ( name ) )
        `)
        .eq('student_id', authData.user.id)
        .order('match_score', { ascending: false });

    if (error) {
        console.error("FETCH ERROR:", error);
    } else {
        console.log(`FETCH SUCCEEDED! Retrieved ${data?.length} matches.`);
    }
}

testFetchMatches();
