
/**
 * Parse Markdown schedule file
 * Format:
 *   **Month: February**
 *   **Day 1:**
 *   * Water Supply:
 *     * Inspection: Task description
 */
export async function parseMarkdownSchedule(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                console.log('📄 Parsing markdown file...');

                const tasks = [];
                let currentMonth = '';
                let currentDay = 0;
                let currentSector = '';

                // Helper: Convert month name to number
                function getMonthNumber(monthName) {
                    const months = {
                        'January': '01', 'February': '02', 'March': '03', 'April': '04',
                        'May': '05', 'June': '06', 'July': '07', 'August': '08',
                        'September': '09', 'October': '10', 'November': '11', 'December': '12'
                    };
                    return months[monthName] || '01';
                }

                // Split into lines
                const lines = text.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (!line) continue;

                    // Extract Month: e.g. **Month: February**, ## February, Month: March
                    const monthMatch = line.match(/(?:Month|month)?\s*:?\s*\*?\*?\s*(January|February|March|April|May|June|July|August|September|October|November|December)/i);
                    // Only match if it's acting as a heading or standalone (don't accidentally match a task description containing a month)
                    if (monthMatch && (line.startsWith('#') || line.startsWith('*') || line.toLowerCase().includes('month'))) {
                        currentMonth = monthMatch[1];
                        continue;
                    }

                    // Extract Day: e.g. **Day 1**, ### Day 1:
                    const dayMatch = line.match(/Day\s*(\d+)/i);
                    if (dayMatch && (line.startsWith('#') || line.startsWith('*') || line.toLowerCase().includes('day'))) {
                        currentDay = parseInt(dayMatch[1]);
                        continue;
                    }

                    // A line starting with * could be a Sector or a Task
                    if (line.startsWith('* ') || line.startsWith('- ')) {
                        const withoutAsterisk = line.replace(/^[\*\-]\s*/, '').trim();
                        const colonIndex = withoutAsterisk.indexOf(':');

                        // If it has NO colon, or the colon is at the very end => SECTOR
                        if (colonIndex !== -1 && colonIndex === withoutAsterisk.length - 1) {
                            currentSector = withoutAsterisk.substring(0, colonIndex).trim();
                            continue;
                        }

                        // Otherwise => TASK
                        let taskType = 'Routine';
                        let description = withoutAsterisk;

                        if (colonIndex !== -1) {
                            taskType = withoutAsterisk.substring(0, colonIndex).trim();
                            description = withoutAsterisk.substring(colonIndex + 1).trim();
                        }

                        // Map sector names to standardized format
                        const sectorMapping = {
                            'Water Supply': 'water',
                            'Solid Waste Management': 'waste',
                            'Street Lighting': 'lighting',
                            'Sewerage & Drainage': 'drainage',
                            'Roads & Public Works': 'roads',
                            'Public Sanitation': 'sanitation',
                            'Parks & Green Areas': 'parks'
                        };

                        const standardizedSector = sectorMapping[currentSector] || currentSector.toLowerCase();

                        // Determine priority based on task type
                        let priority = 'medium';
                        const typeLower = taskType.toLowerCase();
                        if (typeLower.includes('emergency')) priority = 'critical';
                        else if (typeLower.includes('inspection') || typeLower.includes('audit')) priority = 'high';
                        else if (typeLower.includes('preventive')) priority = 'medium';
                        else if (typeLower.includes('cleaning')) priority = 'low';

                        // Default to current year
                        const year = new Date().getFullYear();
                        const monthNum = getMonthNumber(currentMonth);
                        const dayStr = String(currentDay).padStart(2, '0');
                        const scheduledDate = `${year}-${monthNum}-${dayStr}`;

                        tasks.push({
                            title: `${taskType}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
                            description: description,
                            sector: standardizedSector,
                            priority: priority,
                            month: currentMonth,
                            day: currentDay,
                            task_type: taskType,
                            status: 'assigned',
                            scheduled_start: scheduledDate, 
                            scheduled_date: scheduledDate,
                            scheduled_time: '09:00:00',
                            scheduled_end: scheduledDate
                        });
                    }
                }

                console.log(`✅ PARSED ${tasks.length} REAL TASKS FROM MARKDOWN FILE`);
                if (tasks.length > 0) {
                    console.log('Sample task:', tasks[0]);
                }

                if (tasks.length === 0) {
                    reject(new Error('No tasks found in markdown file. Check file format.'));
                    return;
                }

                resolve(tasks);

            } catch (error) {
                console.error('❌ MARKDOWN PARSE ERROR:', error);
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file); // Read as TEXT, not ArrayBuffer
    });
}
