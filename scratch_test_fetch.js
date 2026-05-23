import { createClient } from '@supabase/supabase-js';

const url = "https://frsxpsgshyksykouzbfh.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyc3hwc2dzaHlrc3lrb3V6YmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzI5MzksImV4cCI6MjA5MDg0ODkzOX0.ywDV-QRMIXQqpZrTrm2hqMymzJdasKtWXZ8qQEnGmNo";
const supabase = createClient(url, key);

async function testFetchMatches() {
    console.log("Attempting login...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'abullahageep@gmail.com',
        password: 'Bb20192019.'
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
