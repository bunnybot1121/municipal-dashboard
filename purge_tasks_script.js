import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const isServiceRole = !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log(`Using Key: ${isServiceRole ? 'SERVICE_ROLE (Admin)' : 'ANON (Public)'}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeTasks() {
    console.log('Purging tasks...');

    // Step 1: Fetch all task IDs
    // Limit is default 1000, we looped to get more if needed, but let's start simple
    const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .limit(10000); // Should cover the 1000

    if (fetchError) {
        console.error('Error fetching tasks:', fetchError);
        return;
    }

    console.log(`Found ${tasks.length} tasks to delete.`);

    if (tasks.length === 0) {
        console.log('No tasks found (or RLS hidden them from this script).');
        return;
    }

    const ids = tasks.map(t => t.id);

    // Step 2: Delete by ID
    const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error('Error deleting tasks:', deleteError);
    } else {
        console.log(`Successfully deleted ${ids.length} tasks.`);

        // Check if more remain (could happen if > 10000 or RLS quirk)
        const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true });
        console.log(`Remaining tasks: ${count}`);
    }
}

purgeTasks();
