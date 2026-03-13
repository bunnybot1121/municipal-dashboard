
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
