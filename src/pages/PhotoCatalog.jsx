import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    Search, 
    FilterList, 
    PhotoLibrary, 
    CheckCircle, 
    Refresh,
    LocationOn,
    Schedule,
    Shield
} from '@mui/icons-material';

export default function PhotoCatalog() {
    const { isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth();
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [activeTab, setActiveTab] = useState('Task'); // 'Task' or 'Issue'
    const [sectors, setSectors] = useState([]);

    const fetchCatalog = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch resolved issues
            let queryIssues = supabase.from('issues')
                .select('*')
                .in('status', ['done', 'resolved', 'completed', 'closed']);

            // Fetch completed tasks
            let queryTasks = supabase.from('tasks')
                .select('*')
                .in('status', ['done', 'completed', 'closed']);

            const [resIssues, resTasks] = await Promise.all([queryIssues, queryTasks]);
            
            let allItems = [];
            
            if (resIssues.data) {
                allItems = [...allItems, ...resIssues.data.map(i => ({
                    ...i,
                    isTask: false,
                    title: i.issue_type || 'Citizen Issue',
                    catalogRefId: i.id,
                    typeRef: 'Issue'
                }))];
            }
            
            if (resTasks.data) {
                allItems = [...allItems, ...resTasks.data.map(t => ({
                    ...t,
                    isTask: true,
                    title: t.title || 'Assigned Task',
                    catalogRefId: t.id,
                    typeRef: 'Task'
                }))];
            }

            // Filter for department if needed
            const isDeptScoped = isDepartment || isSeniorEngineer || isJuniorEngineer;
            if (isDeptScoped && department) {
                const dept = department.toLowerCase();
                allItems = allItems.filter(item => {
                    const sectorMatch = (item.sector || '').toLowerCase() === dept;
                    const typeMatch = (item.title || '').toLowerCase().startsWith(dept);
                    return sectorMatch || typeMatch;
                });
            }

            // Filter out items without at least one photo
            allItems = allItems.filter(item => item.before_photo_url || item.after_photo_url);
            
            // Sort by most recent
            allItems.sort((a, b) => new Date(b.created_at || b.updated_at || Date.now()) - new Date(a.created_at || a.updated_at || Date.now()));
            
            // Extract unique sectors
            const uniqueSectors = [...new Set(allItems.map(it => it.sector).filter(Boolean))];
            setSectors(uniqueSectors);

            setCatalogItems(allItems);
        } catch (err) {
            console.error("Failed fetching catalog:", err);
        } finally {
            setLoading(false);
        }
    }, [isDepartment, isSeniorEngineer, isJuniorEngineer, department]);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    const filteredCatalog = useMemo(() => {
        return catalogItems.filter(item => {
            const matchesSearch = searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                String(item.catalogRefId).toLowerCase().includes(searchTerm.toLowerCase());
                
            const matchesSector = sectorFilter === '' || item.sector === sectorFilter;
            const matchesTab = item.typeRef === activeTab;
            
            return matchesSearch && matchesSector && matchesTab;
        });
    }, [catalogItems, searchTerm, sectorFilter, activeTab]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Refresh className="animate-spin text-blue-500" sx={{ fontSize: 40 }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
                        <PhotoLibrary className="text-blue-400" sx={{ fontSize: 40 }} />
                        Verification Catalog
                    </h1>
                    <p className="text-white/70 text-sm mt-2 font-medium max-w-xl">
                        A searchable catalog keeping track of all proofs for completed field work and citizen reports.
                    </p>
                </div>
                <button 
                    onClick={fetchCatalog}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm transition-all"
                >
                    <Refresh sx={{ fontSize: 20 }} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                <button
                    onClick={() => setActiveTab('Task')}
                    className={`pb-2 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'Task' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                >
                    Scheduled Tasks
                </button>
                <button
                    onClick={() => setActiveTab('Issue')}
                    className={`pb-2 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'Issue' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                >
                    Citizen Reports
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 mb-8 shadow-xl flex flex-wrap gap-4 items-center">
                <div className="flex-1 relative min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input 
                        type="text" 
                        placeholder="Search by ID, Title, or Description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-white placeholder-white/40 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="bg-black/20 border border-white/10 text-white rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[150px]"
                    >
                        <option value="">All Sectors</option>
                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Catalog Grid */}
            {filteredCatalog.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg">
                    <FilterList sx={{ fontSize: 60 }} className="text-white/20 mb-4 inline-block" />
                    <h2 className="text-white text-2xl font-bold">No Records Found</h2>
                    <p className="text-white/50 mt-2">Try adjusting your search criteria or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalog.map(item => (
                        <div key={item.catalogRefId} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col group">
                            
                            {/* Header Info */}
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-md border shadow-sm ${item.typeRef === 'Task' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                        {item.typeRef}
                                    </span>
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                        ID: {String(item.catalogRefId).substring(0,6)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white drop-shadow-sm line-clamp-1">{item.title}</h3>
                            </div>

                            {/* Image Comparison */}
                            <div className="flex flex-1 divide-x divide-white/10 border-b border-white/10 min-h-[160px] bg-black/40">
                                <div className="w-1/2 relative overflow-hidden">
                                    <div className="absolute top-1 left-1 z-10 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2 py-0.5 rounded shadow border border-white/10">
                                        BEFORE
                                    </div>
                                    {item.before_photo_url ? (
                                        <img src={item.before_photo_url} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-bold">No Photo</div>
                                    )}
                                </div>
                                <div className="w-1/2 relative overflow-hidden">
                                    <div className="absolute top-1 right-1 z-10 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2 py-0.5 rounded shadow border border-white/10">
                                        AFTER
                                    </div>
                                    {item.after_photo_url ? (
                                        <img src={item.after_photo_url} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-bold">No Photo</div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Metadata */}
                            <div className="p-4 bg-black/10 text-xs text-white/60 font-medium flex flex-wrap gap-x-4 gap-y-2">
                                {item.sector && (
                                    <span className="flex items-center gap-1">
                                        <LocationOn sx={{ fontSize: 14 }} className="text-white/40" /> {item.sector}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Schedule sx={{ fontSize: 14 }} className="text-white/40" /> 
                                    {new Date(item.created_at || item.updated_at).toLocaleDateString()}
                                </span>
                                {(item.status === 'closed' || item.status === 'resolved' || item.status === 'done' || item.status === 'completed') && (
                                    <span className="flex items-center gap-1 text-emerald-400 font-bold ml-auto">
                                        <CheckCircle sx={{ fontSize: 14 }} /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
