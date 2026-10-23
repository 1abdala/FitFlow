import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY");
}
const supabase = createClient(url, key);

async function testLogin() {
    console.log("Attempting login...");
    if (!process.env.SCRATCH_TEST_EMAIL || !process.env.SCRATCH_TEST_PASSWORD) {
        throw new Error("Missing SCRATCH_TEST_EMAIL or SCRATCH_TEST_PASSWORD");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: process.env.SCRATCH_TEST_EMAIL || '',
        password: process.env.SCRATCH_TEST_PASSWORD || ''
    });
    
    if (error) {
        console.error("LOGIN FAILED:", error.message);
    } else {
        console.log("LOGIN SUCCEEDED! User ID:", data.user.id);
    }
}

testLogin();
