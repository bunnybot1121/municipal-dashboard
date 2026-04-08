const fs = require('fs');

const STAFF_JSX = `c:/Users/Admin/nagar/src/pages/Staff.jsx`;
let content = fs.readFileSync(STAFF_JSX, 'utf-8');

// 1. Imports
const importsToAdd = `
import { 
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { DateRange, InsertChart, Edit as EditIcon, Assessment } from '@mui/icons-material';
`;
content = content.replace("import { useAuth } from '../contexts/AuthContext';", "import { useAuth } from '../contexts/AuthContext';" + importsToAdd);

// 2. State variables
const stateToAdd = `
    const [allTasks, setAllTasks] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [activeModalTab, setActiveModalTab] = useState('edit');
    const [analysisMonth, setAnalysisMonth] = useState(() => {
        const d = new Date();
        return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
    });
    const [analysisSource, setAnalysisSource] = useState('citizen');
`;
content = content.replace("const [successMsg, setSuccessMsg] = useState('');", "const [successMsg, setSuccessMsg] = useState('');" + stateToAdd);

// 3. Update loadData
const oldLoadDataStart = `            // Fetch tasks for analytics
            let tasksData = [];
            try {
                tasksData = await api.getTasks() || [];
            } catch (err) {
                console.error('Failed to fetch tasks for analytics', err);
            }`;
            
const newLoadData = `            // Fetch both tasks and issues for analytics and charting
            let tasksData = [];
            let issuesData = [];
            try {
                const [tasksRes, issuesRes] = await Promise.all([
                    api.getTasks().catch(() => []),
                    api.getIssues().catch(() => [])
                ]);
                tasksData = tasksRes || [];
                issuesData = issuesRes || [];
                setAllTasks(tasksData);
                setAllIssues(issuesData);
            } catch (err) {
                console.error('Failed to fetch tasks/issues for analytics', err);
            }`;

if (content.includes(oldLoadDataStart)) {
    content = content.replace(oldLoadDataStart, newLoadData);
}

// 4. Update the onClick to reset tab
content = content.replace("onClick={() => { setEditingStaff({...staff}); setError(''); setShowPass({}); }}", "onClick={() => { setEditingStaff({...staff}); setError(''); setShowPass({}); setActiveModalTab('edit'); setAnalysisSource('citizen'); }}");

// 5. Remove the Mini Dashboard and add instead an "Action Hint"
const miniDashboardRegex = /\{\/\*\s*Analytics Mini-Dashboard\s*\*\/\}([\s\S]*?)<\!-- Completion Line -->/gi;
// Wait, the regex might be tricky, let's just do a string replacement.
const stringToRemove = `                                {/* Analytics Mini-Dashboard */}
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                                    {/* Progress background bar effect */}
                                    <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500/5 to-transparent transition-all duration-1000" style={{ width: \`\${staff.completionRate}%\` }} />
                                    
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/50 mb-3 flex items-center gap-1 z-10 relative">
                                        <Assignment sx={{ fontSize: 14 }} /> Staff Activity Analytics
                                    </h4>
                                    
                                    <div className="grid grid-cols-3 gap-2 z-10 relative">
                                        <div className="text-center bg-black/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-inner">
                                            <span className="text-xl font-black text-white drop-shadow-md leading-none mb-1">{staff.totalTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-white/50 flex items-center gap-1"><Assignment sx={{fontSize:9}}/> Total</span>
                                        </div>
                                        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-sm">
                                            <span className="text-xl font-black text-emerald-400 drop-shadow-md leading-none mb-1">{staff.completedTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-emerald-400/80 flex items-center gap-1"><AssignmentTurnedIn sx={{fontSize:9}}/> Done</span>
                                        </div>
                                        <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-sm">
                                            <span className="text-xl font-black text-amber-400 drop-shadow-md leading-none mb-1">{staff.pendingTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-amber-400/80 flex items-center gap-1"><PendingActions sx={{fontSize:9}}/> Pend</span>
                                        </div>
                                    </div>
                                    
                                    {/* Completion Line */}
                                    <div className="mt-3.5 flex items-center gap-2 z-10 relative">
                                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out" style={{ width: \`\${staff.completionRate}%\` }} />
                                        </div>
                                        <span className="text-[10px] font-black tracking-wider text-white/80 w-8 text-right drop-shadow-sm">{staff.completionRate}%</span>
                                    </div>
                                </div>`;

content = content.replace(stringToRemove, \`                                <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/30 group-hover:text-white/70 transition-colors">
                                    <span>Click to manage</span>
                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10"><Assessment sx={{fontSize: 12}} /> Dashboard Options</span>
                                </div>\`);

// 6. Rewrite the Edit Staff Modal block to support the Tabs and Analytics UI
// Find the exact form snippet to preserve it
const editFormRegex = /(<form onSubmit=\{handleEditStaff\} className="p-6 space-y-4">[\s\S]*?<\/form>)/;
const match = editFormRegex.exec(content);
if (!match) throw new Error("Could not find edit form snippet");
const editFormHtml = match[1];

// Function to generate the chart logic inside the component.
// We need to inject a pure helper inside the component to filter tasks.
const checkMatchesAssignment = \`
    const isMatched = (t, profile) => {
        const explicit = (
            t.assigned_to === profile.id || 
            t.assignedToId === profile.id ||
            t.staffId === profile.id ||
            t.staff_id === profile.id
        );
        const tSector = (t.sector || '').toLowerCase();
        const sSector = (profile.sector || '').toLowerCase();
        const tZone = t.assigned_zone;
        const sZone = profile.assigned_zone;
        const isUnassigned = !t.assigned_to && !t.staff_id && !t.assignedToId && !t.user_id;

        let implicit = false;
        if (isUnassigned || (t.type && t.type === 'issue')) { // issues often don't have explicit assigned_to
            if (sZone && sSector && sSector !== 'other') {
                implicit = (tSector === sSector && tZone === sZone);
            } else if (sSector && sSector !== 'other') {
                implicit = (tSector === sSector);
            } else if (sZone) {
                implicit = (tZone === sZone);
            }
        }
        return explicit || implicit;
    };
\`;

content = content.replace("const filtered = staffList.filter(s => {", checkMatchesAssignment + "\\n\\n    const filtered = staffList.filter(s => {");

// Analytics Tab UI HTML string
// We compute graph data inside the render directly for simplicity
const analyticsTabContent = \`
                            <div className="p-6 space-y-6 animate-fade-in text-white h-[65vh] overflow-y-auto">
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="flex gap-2">
                                        <button onClick={() => setAnalysisSource('citizen')} className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${analysisSource === 'citizen' ? 'bg-blue-500/30 text-blue-200 border-blue-500/50' : 'bg-transparent text-white/50 hover:bg-white/5 border-transparent'} border\`}>Citizen</button>
                                        <button onClick={() => setAnalysisSource('schedule')} className={\`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${analysisSource === 'schedule' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50' : 'bg-transparent text-white/50 hover:bg-white/5 border-transparent'} border\`}>Schedule</button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DateRange sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                                        <input type="month" value={analysisMonth} onChange={e => setAnalysisMonth(e.target.value)} className="bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none" />
                                    </div>
                                </div>
                                {(() => {
                                    const sourceData = analysisSource === 'citizen' ? allIssues : allTasks;
                                    const matchedData = sourceData.map(d => ({ ...d, type: analysisSource === 'citizen' ? 'issue' : 'task' })).filter(d => isMatched(d, editingStaff));
                                    
                                    // filter by month
                                    const [y, m] = analysisMonth.split('-');
                                    const filteredByMonth = matchedData.filter(d => {
                                        const dtStr = d.created_at || d.createdAt || d.scheduled_start || d.scheduledStart;
                                        if (!dtStr) return false;
                                        const date = new Date(dtStr);
                                        return date.getFullYear() === parseInt(y) && (date.getMonth() + 1) === parseInt(m);
                                    });

                                    if (filteredByMonth.length === 0) {
                                        return <div className="flex items-center justify-center h-48 text-white/50 flex-col gap-2">
                                            <InsertChart sx={{fontSize:40, opacity:0.5}} />
                                            <span>No \${analysisSource === 'citizen' ? 'Citizen Reports' : 'Scheduled Tasks'} found for \${analysisMonth}</span>
                                        </div>;
                                    }

                                    // Aggregate by day
                                    const dayMap = {};
                                    let completedCount = 0;
                                    let pendingCount = 0;

                                    filteredByMonth.forEach(d => {
                                        const dtStr = d.created_at || d.createdAt || d.scheduled_start || d.scheduledStart;
                                        const day = new Date(dtStr).getDate();
                                        if(!dayMap[day]) dayMap[day] = { day: \`\${day}\`, created: 0, completed: 0 };
                                        dayMap[day].created += 1;
                                        
                                        const isCompleted = ['completed', 'resolved', 'closed'].includes((d.status || '').toLowerCase());
                                        if (isCompleted) {
                                            dayMap[day].completed += 1;
                                            completedCount++;
                                        } else {
                                            pendingCount++;
                                        }
                                    });

                                    const chartData = Object.values(dayMap).sort((a,b) => parseInt(a.day) - parseInt(b.day));
                                    const pieData = [
                                        { name: 'Completed', value: completedCount, color: '#10b981' }, // emerald
                                        { name: 'Pending', value: pendingCount, color: '#f59e0b' } // amber
                                    ];

                                    return (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/20 border border-white/10 p-4 rounded-xl text-center shadow-inner">
                                                    <div className="text-3xl font-black text-white">{filteredByMonth.length}</div>
                                                    <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">Total Assigned</div>
                                                </div>
                                                <div className="bg-black/20 border border-white/10 p-4 rounded-xl flex justify-around shadow-inner">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
                                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Done</div>
                                                    </div>
                                                    <div className="w-[1px] bg-white/10 h-full mx-2"></div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
                                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Pend</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Daily Task Volume</h4>
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                                                            <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                                                            <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                                            <Legend wrapperStyle={{fontSize: '10px'}} />
                                                            <Bar dataKey="created" name="Assigned" fill="#3b82f6" radius={[4,4,0,0]} barSize={12} />
                                                            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4,4,0,0]} barSize={12} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Status Breakdown</h4>
                                                <div className="h-40 w-full flex items-center justify-center relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                                                {pieData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={entry.color} />)}
                                                            </Pie>
                                                            <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', padding: '4px 8px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-xl font-bold text-white leading-none">{Math.round((completedCount/filteredByMonth.length)*100) || 0}%</span>
                                                        <span className="text-[8px] text-white/50 uppercase tracking-widest">Rate</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
\`;

const newEditModal = \`            {/* Edit Staff Modal */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-fade-in relative">
                        {/* Tab Headers */}
                        <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2 pr-12">
                            <button onClick={() => setActiveModalTab('edit')} className={\`flex-1 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 \${activeModalTab === 'edit' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}\`}>
                                <EditIcon sx={{fontSize: 16}} /> Edit Profile
                            </button>
                            <button onClick={() => setActiveModalTab('analytics')} className={\`flex-1 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 \${activeModalTab === 'analytics' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}\`}>
                                <Assessment sx={{fontSize: 16}} /> Data Analysis
                            </button>
                            <button onClick={() => setEditingStaff(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 p-2 rounded-full hover:bg-white/10 transition-colors z-10"><Close /></button>
                        </div>
                        
                        {activeModalTab === 'edit' ? (
                            \` + editFormHtml.replace(/\$\{/g, "\\$\\{").replace(/\`/g, "\\`") + `
                        ) : (
` + analyticsTabContent + `
                        )}
                    </div>
                </div>
            )}`;

content = content.replace(/({\/\* Edit Staff Modal \*\/}[\s\S]*?<\/div>\s*<\/div>\s*\)})\s*<\/div>\s*\);\s*};/g, newEditModal + "\n        </div>\n    );\n};\n");

// If for some reason the replace missed it, try a broader regex:
if (!content.includes('Data Analysis')) {
    const editModalFullRegex = /\{\/\* Edit Staff Modal \*\/\}[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*\)}/;
    content = content.replace(editModalFullRegex, newEditModal);
}

fs.writeFileSync(STAFF_JSX, content, 'utf-8');
console.log('Patched Staff.jsx successfully');
