
import * as XLSX from 'xlsx';

/**
 * Parses a Markdown schedule file into structured task objects.
 * (Preserved from original implementation - Verified to work with 2307 tasks)
 */
export const parseSchedule = (markdownText) => {
    const lines = markdownText.split('\n');
    const tasks = [];

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // Default to CURRENT MONTH (not 0/Jan)
    let currentDay = null; // 1-31
    let currentSector = 'general';

    const monthMap = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };

    console.log("Starting Schedule Parse (Markdown)...");

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 1. Detect Month/Year
        const monthMatch = trimmed.match(/(?:Month:?\s*)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[^\d]*(\d{4})?/i);
        if (monthMatch) {
            const mName = monthMatch[1].toLowerCase();
            const fullMonth = Object.keys(monthMap).find(k => k.startsWith(mName));

            if (fullMonth) {
                currentMonth = monthMap[fullMonth];
                if (monthMatch[2]) {
                    currentYear = parseInt(monthMatch[2]);
                }
                console.log(`Matched Month: ${fullMonth} (${currentMonth}), Year: ${currentYear}`);
            }
        }

        // 2. Detect Day
        const dayMatch = trimmed.match(/(?:Day\s*|^|\*|\#)(\d{1,2})(?:st|nd|rd|th|:)?(?:\*|\s|$)/i);
        if (dayMatch) {
            const dayVal = parseInt(dayMatch[1]);
            if (dayVal > 0 && dayVal <= 31) {
                currentDay = dayVal;
                // console.log(`Matched Day: ${currentDay}`);
                return;
            }
        }

        // 3. Detect Sector
        const sectorMatch = line.match(/^\s*[\*\-]\s+(?:\*\*)?([a-zA-Z\s&]+)(?:\*\*)?:?$/);
        if (sectorMatch && !trimmed.toLowerCase().startsWith('day')) {
            const sectorRaw = sectorMatch[1].trim();
            if (!sectorRaw.includes(':') && currentDay !== null) {
                currentSector = mapSector(sectorRaw);
                // console.log(`Matched Sector: ${currentSector}`);
                return;
            }
        }

        // 4. Detect Task
        const taskMatch = line.match(/^\s*[\*\-]\s+(?:\*\*)?([^:]+)(?:\*\*)?:\s+(.+)$/);
        if (taskMatch) {
            const type = taskMatch[1].trim();
            const description = taskMatch[2].trim();
            if (currentMonth !== null && currentDay !== null) {
                const maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                const validDay = Math.min(currentDay, maxDays);

                const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}T09:00:00.000Z`;
                const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}T17:00:00.000Z`;

                const newTask = {
                    title: `${type}: ${description}`,
                    description: description,
                    sector: currentSector,
                    priority: mapPriority(type),
                    status: 'assigned',
                    scheduled_start: startStr,
                    scheduled_date: startStr,
                    scheduled_time: '09:00:00',
                    scheduled_end: endStr,
                    month: Object.keys(monthMap).find(key => monthMap[key] === currentMonth), // Add helpful metadata
                    week: Math.ceil(currentDay / 7),
                    created_at: new Date().toISOString()
                };

                tasks.push(newTask);
            }
        }
    });

    console.log(`✅ PARSED ${tasks.length} REAL TASKS (Markdown)`);
    return tasks;
};

const mapSector = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('water')) return 'water';
    if (lower.includes('waste') || lower.includes('solid')) return 'waste';
    if (lower.includes('light')) return 'lighting';
    if (lower.includes('sewer') || lower.includes('drain')) return 'drainage';
    if (lower.includes('road') || lower.includes('work')) return 'roads';
    if (lower.includes('park') || lower.includes('green')) return 'parks';
    if (lower.includes('sanit')) return 'sanitation';
    return 'other';
};

const mapPriority = (type) => {
    const lower = type.toLowerCase();
    if (lower.includes('emergency')) return 'critical';
    if (lower.includes('corrective')) return 'high';
    if (lower.includes('inspect')) return 'medium';
    if (lower.includes('cleaning')) return 'low';
    return 'medium';
};

/**
 * Main entry point: Parses Excel/CSV OR Markdown/Text files
 * @param {File} file - The uploaded file
 * @returns {Promise<Array>} - Array of parsed tasks
 */
export async function parseScheduleFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const isText = file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt');

        reader.onload = (e) => {
            try {
                console.log('📄 Starting file parse...', file.name, file.type);

                if (isText) {
                    // Handle Markdown/Text
                    const text = new TextDecoder("utf-8").decode(new Uint8Array(e.target.result));
                    const tasks = parseSchedule(text);
                    if (tasks.length === 0) throw new Error("No tasks found in text file.");
                    resolve(tasks);
                    return;
                }

                // Handle Excel (Buffer)
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData || jsonData.length === 0) {
                    throw new Error('File is empty. No tasks found.');
                }

                console.log(`📊 Found ${jsonData.length} rows in Excel file`);

                const tasks = jsonData.map((row, index) => {
                    const getColumn = (name) => row[name] || row[name.toLowerCase()] || '';

                    return {
                        title: getColumn('Activity') || `Task ${index + 1}`,
                        description: getColumn('Description') || getColumn('Notes') || '',
                        sector: getColumn('Sector'),
                        priority: getColumn('Priority') || 'medium',
                        month: getColumn('Month'),
                        week: parseInt(getColumn('Week')) || 1,
                        status: 'assigned',
                        scheduled_start: new Date().toISOString(), // Default
                        scheduled_date: new Date().toISOString(),
                        scheduled_time: '09:00:00',
                        scheduled_end: new Date().toISOString(),   // Default
                        raw_data: JSON.stringify(row)
                    };
                });

                console.log(`✅ SUCCESSFULLY PARSED ${tasks.length} REAL TASKS (Excel)`);
                resolve(tasks);

            } catch (error) {
                console.error('❌ PARSE ERROR:', error.message);
                reject(error);
            }
        };

        reader.onerror = () => {
            const error = new Error('Failed to read file');
            console.error('❌ FILE READ ERROR:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}
