import { useState, useEffect } from 'react';
import { supabase, type TimeEntry, type AIProject } from '../lib/supabase';

export function useTimeTracking(projectId?: string) {
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch active time entry
    useEffect(() => {
        fetchActiveEntry();
        fetchEntries();
    }, [projectId]);

    const fetchActiveEntry = async () => {
        try {
            const query = supabase
                .from('time_entries')
                .select('*')
                .eq('is_active', true)
                .single();

            if (projectId) {
                query.eq('ai_project_id', projectId);
            }

            const { data, error } = await query;

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching active entry:', error);
                return;
            }

            setActiveEntry(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchEntries = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('time_entries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (projectId) {
                query = query.eq('ai_project_id', projectId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching entries:', error);
                return;
            }

            setEntries(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTimer = async (projectId: string, description?: string) => {
        try {
            // Stop any active timers first
            if (activeEntry) {
                await stopTimer();
            }

            const { data, error } = await supabase
                .from('time_entries')
                .insert({
                    ai_project_id: projectId,
                    start_time: new Date().toISOString(),
                    description: description || null,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;

            setActiveEntry(data);
            await fetchEntries();
            return data;
        } catch (error) {
            console.error('Error starting timer:', error);
            throw error;
        }
    };

    const stopTimer = async () => {
        if (!activeEntry) return;

        try {
            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    end_time: new Date().toISOString(),
                    is_active: false,
                })
                .eq('id', activeEntry.id)
                .select()
                .single();

            if (error) throw error;

            setActiveEntry(null);
            await fetchEntries();
            return data;
        } catch (error) {
            console.error('Error stopping timer:', error);
            throw error;
        }
    };

    const getTotalHours = () => {
        return entries.reduce((total, entry) => {
            return total + (entry.duration_minutes || 0);
        }, 0) / 60;
    };

    return {
        activeEntry,
        entries,
        loading,
        startTimer,
        stopTimer,
        getTotalHours,
        refresh: fetchEntries,
    };
}

export function useProjects() {
    const [projects, setProjects] = useState<AIProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ai_projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    return { projects, loading, refresh: fetchProjects };
}
