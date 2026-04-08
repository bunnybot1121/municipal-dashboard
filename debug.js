import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data } = await supabase.from('tasks').select('*');
    fs.writeFileSync('output.json', JSON.stringify(data, null, 2));
    const { data: profiles } = await supabase.from('profiles').select('*');
    fs.writeFileSync('profiles.json', JSON.stringify(profiles, null, 2));
}
run();
