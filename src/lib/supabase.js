import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded credentials for GitHub Pages deployment where .env is not present
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://itflkttrcrtxfxdrqysn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZmxrdHRyY3J0eGZ4ZHJxeXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzI4MjgsImV4cCI6MjA4NjMwODgyOH0.dVOZuI1luH7KvgSfwK3cNyP7AVDjtzYLjE1hvIEvrAo';

// VALIDATE credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials! Check .env file.');
}

// CREATE Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TEST connection (Async checking)
// We use a lightweight query to check connection status without blocking
const checkConnection = async () => {
    try {
        const { count, error } = await supabase
            .from('tasks')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
        } else {
            console.log('✅ Supabase connected successfully. Task count:', count);
        }
    } catch (err) {
        console.error('❌ Supabase connection error:', err);
    }
};

// Initiate check (non-blocking)
checkConnection();
