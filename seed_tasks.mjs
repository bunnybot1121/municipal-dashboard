import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const sectors = [
    { name: 'water', label: 'Water Supply' },
    { name: 'waste', label: 'Solid Waste Management' },
    { name: 'lighting', label: 'Street Lighting' },
    { name: 'drainage', label: 'Sewerage & Drainage' },
    { name: 'roads', label: 'Roads & Public Works' },
    { name: 'sanitation', label: 'Public Sanitation' },
    { name: 'parks', label: 'Parks & Green Areas' }
];

const taskTypes = [
    { type: 'Inspection', priority: 'high', descriptions: [
        'Check valve functionality at water treatment plant',
        'Inspect drainage channels for blockages',
        'Review street light installations along main road',
        'Assess road surface conditions in residential zones',
        'Survey park equipment for safety compliance',
        'Examine waste collection point infrastructure',
        'Audit public toilet sanitation standards'
    ]},
    { type: 'Cleaning', priority: 'low', descriptions: [
        'Sanitize public toilets near railway station',
        'Clear debris from storm drains',
        'Clean overhead tank filters',
        'Sweep and wash market area roads',
        'Remove litter from park boundaries',
        'Clear blocked sewer lines in sector 5',
        'Wash and disinfect community hall floors'
    ]},
    { type: 'Maintenance', priority: 'medium', descriptions: [
        'Repair leaking water pipelines in Zone A',
        'Replace damaged road signage',
        'Fix broken street lights on MG Road',
        'Patch potholes on highway connector',
        'Service water pump motors at station 3',
        'Trim overgrown trees near power lines',
        'Repair park fencing and gate mechanisms'
    ]},
    { type: 'Emergency readiness', priority: 'critical', descriptions: [
        'Test backup pump systems at distribution center',
        'Verify emergency flood drainage capacity',
        'Check fire hydrant water pressure levels',
        'Test emergency lighting backup systems',
        'Inspect emergency road barriers and signs',
        'Verify waste overflow containment systems',
        'Test park emergency evacuation routes'
    ]},
    { type: 'Preventive', priority: 'medium', descriptions: [
        'Apply anti-corrosion treatment to water pipes',
        'Lubricate drainage gate mechanisms',
        'Replace aging electrical cables on light poles',
        'Seal road cracks before monsoon season',
        'Apply pesticide treatment in park areas',
        'Service waste compactor machinery',
        'Waterproof public toilet roofing'
    ]},
    { type: 'Audit', priority: 'high', descriptions: [
        'Compile operational performance report for municipal review',
        'Document water quality test results for all zones',
        'Review contractor compliance for waste management',
        'Analyze monthly road maintenance expenditure',
        'Assess park visitor footfall and maintenance costs',
        'Review drainage system upgrade project progress',
        'Evaluate public sanitation satisfaction survey results'
    ]}
];

const locations = [
    'Kharghar', 'Belapur', 'Vashi', 'Airoli', 'Koparkhairane',
    'Nerul', 'Panvel', 'Sanpada', 'Turbhe', 'Ghansoli',
    'Sector 5', 'Sector 12', 'Sector 15', 'Sector 20', 'Sector 7',
    'MG Road', 'Station Road', 'Palm Beach Road', 'NH4 Connector'
];

function generateTasks() {
    const tasks = [];
    const year = 2026;
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            // Generate 5-8 tasks per day
            const tasksPerDay = 5 + Math.floor(Math.random() * 4);
            
            for (let t = 0; t < tasksPerDay; t++) {
                const sector = sectors[Math.floor(Math.random() * sectors.length)];
                const taskTypeObj = taskTypes[Math.floor(Math.random() * taskTypes.length)];
                const desc = taskTypeObj.descriptions[Math.floor(Math.random() * taskTypeObj.descriptions.length)];
                const location = locations[Math.floor(Math.random() * locations.length)];
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const startDate = new Date(year, month, day, 9, 0, 0);
                const endDate = new Date(year, month, day, 17, 0, 0);

                tasks.push({
                    title: `${taskTypeObj.type}: ${desc.substring(0, 60)}`,
                    description: `${desc} at ${location}`,
                    sector: sector.name,
                    priority: taskTypeObj.priority,
                    status: 'assigned',
                    scheduled_start: startDate.toISOString(),
                    scheduled_date: dateStr,
                    scheduled_time: '09:00:00',
                    scheduled_end: endDate.toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }
    }
    return tasks;
}

async function seed() {
    console.log('🌱 Generating tasks...');
    const tasks = generateTasks();
    console.log(`📊 Generated ${tasks.length} tasks across 12 months`);
    
    // Show distribution
    const byMonth = {};
    tasks.forEach(t => {
        const m = t.scheduled_start.substring(0, 7);
        byMonth[m] = (byMonth[m] || 0) + 1;
    });
    console.log('📅 Distribution:', byMonth);

    // Insert in batches
    const batchSize = 200;
    let inserted = 0;
    
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const { data, error } = await supabase.from('tasks').insert(batch).select('id');
        
        if (error) {
            console.error(`❌ Batch ${Math.floor(i/batchSize)+1} failed:`, error.message);
            return;
        }
        
        inserted += data.length;
        process.stdout.write(`\r⏳ Inserted ${inserted}/${tasks.length} tasks...`);
    }
    
    console.log(`\n✅ Done! ${inserted} tasks inserted into database.`);
    
    // Verify
    const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    console.log(`🔍 Verified: ${count} tasks in database`);
}

seed();
