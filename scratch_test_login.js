import { createClient } from '@supabase/supabase-js';

const url = "https://frsxpsgshyksykouzbfh.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyc3hwc2dzaHlrc3lrb3V6YmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzI5MzksImV4cCI6MjA5MDg0ODkzOX0.ywDV-QRMIXQqpZrTrm2hqMymzJdasKtWXZ8qQEnGmNo";
const supabase = createClient(url, key);

async function testLogin() {
    console.log("Attempting login...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'abullahageep@gmail.com',
        password: 'Bb20192019.'
    });
    
    if (error) {
        console.error("LOGIN FAILED:", error.message);
    } else {
        console.log("LOGIN SUCCEEDED! User ID:", data.user.id);
    }
}

testLogin();
