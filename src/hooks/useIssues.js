
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useIssues = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIssues = async () => {
        try {
            setLoading(true);

            // Try with profiles join first; fall back to plain select if join fails
            let data, error;

            ({ data, error } = await supabase
                .from('issues')
                .select('*, profiles:user_id(full_name)')
                .order('created_at', { ascending: false }));

            if (error) {
                console.warn('⚠️ useIssues: profiles join failed, falling back to plain select:', error.message);
                ({ data, error } = await supabase
                    .from('issues')
                    .select('*')
                    .order('created_at', { ascending: false }));
            }

            if (error) throw error;

            console.log(`✅ useIssues: fetched ${data?.length ?? 0} issues`);

            const formattedIssues = (data || []).map(issue => ({
                ...issue,
                location: issue.location || {
                    address: issue.location_address || issue.address,
                    lat: issue.latitude || issue.lat,
                    lng: issue.longitude || issue.lng
                },
                aiAnalysis: issue.ai_analysis || null,
                reportedBy: issue.profiles?.full_name || issue.citizen_name || 'Anonymous',
                calculatedPriority: {
                    label: issue.priority || 'low',
                    score: issue.ai_priority_score || 0,
                    advancedAnalysis: issue.ai_analysis || {}
                }
            }));

            setIssues(formattedIssues);
        } catch (err) {
            console.error('❌ useIssues: fetch error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();

        // Real-time subscription
        const channel = supabase
            .channel('issues_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'issues' },
                (payload) => {
                    console.log('Real-time change received!', payload);
                    fetchIssues(); // Simplest way: refresh all on change. 
                    // Optimization: handle INSERT/UPDATE/DELETE locally to avoid full refetch
                    // But for now, ensuring data consistency is safer.
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { issues, loading, error, refresh: fetchIssues };
};
