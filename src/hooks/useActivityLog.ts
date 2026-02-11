import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LogActivityParams {
    activityType:
    | 'client_created'
    | 'client_updated'
    | 'contact_created'
    | 'contact_updated'
    | 'opportunity_created'
    | 'opportunity_updated'
    | 'opportunity_stage_changed'
    | 'meeting_scheduled'
    | 'meeting_completed'
    | 'note_added'
    | 'email_sent'
    | 'call_made'
    | 'task_created'
    | 'task_completed'
    | 'file_uploaded'
    | 'status_changed'
    | 'other';
    title: string;
    description?: string;
    clientId?: string;
    relatedToType?: 'client' | 'contact' | 'opportunity' | 'project' | 'task' | 'event';
    relatedToId?: string;
    metadata?: Record<string, any>;
}

export function useActivityLog() {
    const { profile, user } = useAuth();

    const logActivity = async (params: LogActivityParams) => {
        if (!profile?.tenant_id || !user?.id) {
            console.warn('Cannot log activity: missing tenant_id or user_id');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('activity_log')
                .insert({
                    tenant_id: profile.tenant_id,
                    activity_type: params.activityType,
                    title: params.title,
                    description: params.description || null,
                    client_id: params.clientId || null,
                    related_to_type: params.relatedToType || null,
                    related_to_id: params.relatedToId || null,
                    metadata: params.metadata || {},
                    created_by: user.id
                })
                .select()
                .single();

            if (error) {
                console.error('Error logging activity:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Error in logActivity:', err);
            return null;
        }
    };

    return { logActivity };
}
