const AnnualCalendar = ({ issues }) => {
    const maintenanceTasks = issues.filter(i => i.type === 'maintenance' || i.status === 'scheduled');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} /> Annual Maintenance Calendar (2025)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
                {months.map((month, idx) => {
                    // Find tasks for this month
                    const tasksForMonth = maintenanceTasks.filter(t => {
                        const d = new Date(t.scheduledDate || t.reportedAt);
                        return d.getMonth() === idx;
                    });

                    const isPast = idx < currentMonth;
                    const isCurrent = idx === currentMonth;

                    return (
                        <div key={month} style={{
                            border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            background: isPast ? '#f1f5f9' : 'white',
                            opacity: isPast ? 0.7 : 1,
                            minHeight: '100px',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', color: isCurrent ? 'var(--color-primary)' : '#64748b' }}>{month}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                {tasksForMonth.map(task => (
                                    <div key={task.id} title={task.title} style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        background: SECTORS.find(s => s.id === task.sector)?.color || '#ccc',
                                        color: 'white',
                                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                        cursor: 'pointer'
                                    }}>
                                        {task.title}
                                    </div>
                                ))}
                                {tasksForMonth.length === 0 && !isPast && (
                                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', fontSize: '1.5rem', color: '#f1f5f9' }}>+</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
