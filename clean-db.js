import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clean() {
    console.log("Cleaning up previously added worker profiles...");
    const { error: pError } = await supabase.from('profiles').delete().eq('role', 'worker');
    if (pError) console.error("Error deleting profiles:", pError);
    else console.log("Removed field worker profiles.");

    console.log("Removing staff_id mappings from tasks...");
    const { error: tError } = await supabase.from('tasks').update({ staff_id: null }).neq('status', 'resolved');
    if (tError) console.error("Error updating tasks:", tError);
    else console.log("Unlinked staff from tasks.");

    console.log("Done.");
}

clean();
