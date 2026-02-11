import { useEffect, useState } from 'react';
import { Clock, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface RunningTimer {
    id: string;
    project_name?: string;
    task_title?: string;
    description?: string;
    start_time: string;
}

export default function TimerBar() {
    const { profile } = useAuth();
    const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!profile) return;

        fetchRunningTimer();
        const interval = setInterval(fetchRunningTimer, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [profile]);

    useEffect(() => {
        if (!runningTimer) return;

        const interval = setInterval(() => {
            const start = new Date(runningTimer.start_time).getTime();
            const now = Date.now();
            setElapsed(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [runningTimer]);

    const fetchRunningTimer = async () => {
        try {
            const { data: timeEntry, error } = await supabase
                .from('time_entries')
                .select(`
                    id,
                    description,
                    start_time,
                    project:projects(name),
                    task:tasks(title)
                `)
                .eq('user_id', profile?.id)
                .eq('is_running', true)
                .order('start_time', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching running timer:', error);
                return;
            }

            if (timeEntry) {
                setRunningTimer({
                    id: timeEntry.id,
                    project_name: (timeEntry.project as any)?.name,
                    task_title: (timeEntry.task as any)?.title,
                    description: timeEntry.description,
                    start_time: timeEntry.start_time
                });
            } else {
                setRunningTimer(null);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const stopTimer = async () => {
        if (!runningTimer) return;

        try {
            const endTime = new Date().toISOString();
            const durationMinutes = Math.floor(elapsed / 60);

            const { error } = await supabase
                .from('time_entries')
                .update({
                    end_time: endTime,
                    duration_minutes: durationMinutes,
                    is_running: false
                })
                .eq('id', runningTimer.id);

            if (error) throw error;

            setRunningTimer(null);
            setElapsed(0);
        } catch (error) {
            console.error('Error stopping timer:', error);
            alert('Error al detener el timer');
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!runningTimer) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white shadow-lg animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                {/* Timer Info */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Clock size={20} className="animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <span className="font-mono text-lg font-bold tracking-wider">
                            {formatTime(elapsed)}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-white/30" />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                            {runningTimer.project_name && (
                                <span className="font-medium">{runningTimer.project_name}</span>
                            )}
                            {runningTimer.task_title && (
                                <>
                                    <span className="text-white/60">•</span>
                                    <span className="text-white/90">{runningTimer.task_title}</span>
                                </>
                            )}
                        </div>
                        {runningTimer.description && (
                            <span className="text-xs text-white/70 truncate max-w-md">
                                {runningTimer.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={stopTimer}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
                    >
                        <Square size={16} />
                        Detener
                    </button>
                </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="h-1 bg-white/10 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-white/40 to-white/60 animate-pulse"
                    style={{
                        width: '100%',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                />
            </div>
        </div>
    );
}
