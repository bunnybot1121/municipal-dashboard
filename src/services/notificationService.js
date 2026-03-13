/**
 * Notification Service — send and receive citizen notifications via Supabase
 * Table: public.notifications (main app Supabase project)
 */
import { supabase } from '../lib/supabase';

/**
 * Send a notification to citizens.
 * @param {{ title, message, type, target, sector }} payload
 */
export async function sendNotification({ title, message, type = 'info', target = 'all', sector = null }) {
    const { data, error } = await supabase
        .from('notifications')
        .insert([{ title, message, type, target, sector, created_by: 'admin' }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Fetch all notifications (admin history view), newest first.
 */
export async function fetchNotifications(limit = 50) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Delete a notification by id.
 */
export async function deleteNotification(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
}

/**
 * Subscribe to new notifications in real-time (citizen side).
 * @param {function} callback - called with new notification row
 * @returns unsubscribe function
 */
export function subscribeToNotifications(callback) {
    const channel = supabase
        .channel('notifications_rt')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
        }, (payload) => callback(payload.new))
        .subscribe();

    return () => supabase.removeChannel(channel);
}

/** Notification type config (colour + icon) */
export const NOTIFICATION_TYPES = {
    info: { label: 'Info', color: '#3B82F6', bg: '#EFF6FF', icon: 'ℹ️' },
    warning: { label: 'Warning', color: '#F59E0B', bg: '#FFFBEB', icon: '⚠️' },
    critical: { label: 'Critical', color: '#EF4444', bg: '#FEF2F2', icon: '🚨' },
    success: { label: 'Success', color: '#10B981', bg: '#ECFDF5', icon: '✅' },
};

/** Pre-built templates */
export const TEMPLATES = [
    { label: '✅ Issue Resolved', title: 'Your Issue Has Been Resolved', message: 'We are pleased to inform you that the reported issue in your area has been resolved. Thank you for helping us improve your city.', type: 'success' },
    { label: '🔧 Maintenance Alert', title: 'Planned Maintenance Work', message: 'Scheduled maintenance work will be carried out in your area. We apologise for any inconvenience.', type: 'warning' },
    { label: '🚨 Emergency Alert', title: 'Emergency: Immediate Action', message: 'An emergency situation has been detected in your area. Please follow safety guidelines and stay alert.', type: 'critical' },
    { label: '📢 Announcement', title: 'Important Announcement', message: 'We have an important update for residents in your area. Please read the details carefully.', type: 'info' },
];
