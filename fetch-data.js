import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://itflkttrcrtxfxdrqysn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZmxrdHRyY3J0eGZ4ZHJxeXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzI4MjgsImV4cCI6MjA4NjMwODgyOH0.dVOZuI1luH7KvgSfwK3cNyP7AVDjtzYLjE1hvIEvrAo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
    const { data: tasks } = await supabase.from('tasks').select('*');
    const fs = await import('fs/promises');
    await fs.writeFile('db_output.json', JSON.stringify({ profiles, tasks }, null, 2));
}
run();
