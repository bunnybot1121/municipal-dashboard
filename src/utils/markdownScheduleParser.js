
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

                    // Extract Month: **Month: February**
                    if (line.startsWith('**Month:')) {
                        currentMonth = line.replace('**Month:', '').replace('**', '').trim();
                        console.log(`📅 Found month: ${currentMonth}`);
                        continue;
                    }

                    // Extract Day: **Day 1:**
                    if (line.startsWith('**Day')) {
                        const dayMatch = line.match(/Day (\d+)/);
                        if (dayMatch) {
                            currentDay = parseInt(dayMatch[1]);
                        }
                        continue;
                    }

                    // Extract Sector: * Water Supply:
                    // Fix: Ensure we don't accidentally match task lines if they look similar
                    if (line.startsWith('* ') && line.endsWith(':') &&
                        !line.includes('Inspection:') &&
                        !line.includes('Maintenance:') &&
                        !line.includes('Cleaning:') &&
                        !line.includes('Emergency') &&
                        !line.includes('Preventive') &&
                        !line.includes('Corrective') &&
                        !line.includes('Audit:') &&
                        !line.includes('Survey:')) {

                        currentSector = line.replace('*', '').replace(':', '').trim();
                        continue;
                    }

                    // Extract Task: * Inspection: Check valve...
                    if (line.includes('Inspection:') || line.includes('Maintenance:') ||
                        line.includes('Cleaning:') || line.includes('Emergency') ||
                        line.includes('Preventive') || line.includes('Corrective') ||
                        line.includes('Audit:') || line.includes('Survey:')) {

                        // Extract task type and description
                        let taskType = '';
                        let description = '';

                        if (line.includes('Inspection:')) {
                            taskType = 'Inspection';
                            description = line.split('Inspection:')[1].trim();
                        } else if (line.includes('Maintenance:')) {
                            taskType = 'Maintenance';
                            description = line.split('Maintenance:')[1].trim();
                        } else if (line.includes('Cleaning:')) {
                            taskType = 'Cleaning';
                            description = line.split('Cleaning:')[1].trim();
                        } else if (line.includes('Emergency readiness:')) {
                            taskType = 'Emergency';
                            description = line.split('Emergency readiness:')[1].trim();
                        } else if (line.includes('Preventive maintenance:')) {
                            taskType = 'Preventive';
                            description = line.split('Preventive maintenance:')[1].trim();
                        } else if (line.includes('Corrective maintenance:')) {
                            taskType = 'Corrective';
                            description = line.split('Corrective maintenance:')[1].trim();
                        } else if (line.includes('Audit:')) {
                            taskType = 'Audit';
                            description = line.split('Audit:')[1].trim();
                        } else if (line.includes('Survey:')) {
                            taskType = 'Survey';
                            description = line.split('Survey:')[1].trim();
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
                        if (taskType === 'Emergency') priority = 'critical';
                        else if (taskType === 'Inspection') priority = 'high';
                        else if (taskType === 'Preventive') priority = 'medium';
                        else if (taskType === 'Cleaning') priority = 'low';

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
                            scheduled_start: scheduledDate, // Map to DB field
                            scheduled_date: scheduledDate,
                            scheduled_time: '09:00:00',
                            scheduled_end: scheduledDate    // Map to DB field
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
