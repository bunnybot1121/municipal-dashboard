import { ISSUES, SENSORS } from './src/services/mockData.js';

console.log('Successfully imported mockData.js');
console.log('ISSUES count:', ISSUES.length);
console.log('SENSORS count:', SENSORS.length);

// Check new scheduled tasks
const scheduled = ISSUES.filter(i => i.id.startsWith('SCH'));
console.log('Scheduled tasks count:', scheduled.length);
scheduled.forEach(t => {
    console.log(`Task ${t.id}: Start=${t.scheduledStart}, End=${t.scheduledEnd}`);
});
