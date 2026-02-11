import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Play,
    Pause,
    Plus,
    Clock,
    Calendar,
    FolderKanban,
    Edit,
    Trash2,
    Bell,
    BellOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { TimeEntry } from '../types/crm';
import TimeEntryModal from '../components/time-tracking/TimeEntryModal';

interface TimeEntryWithProject extends TimeEntry {
    project?: { id: string; name: string };
}

export default function TimeTracking() {
    const { profile } = useAuth();
    const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeEntry, setActiveEntry] = useState<TimeEntryWithProject | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<TimeEntryWithProject | undefined>(undefined);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const timerInterval = useRef<number | null>(null);
    const notificationInterval = useRef<number | null>(null);

    useEffect(() => {
        fetchEntries();
        requestNotificationPermission();

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (notificationInterval.current) clearInterval(notificationInterval.current);
        };
    }, [profile]);

    useEffect(() => {
        if (activeEntry) {
            // Update elapsed time every second
            timerInterval.current = setInterval(() => {
                const start = new Date(activeEntry.start_time).getTime();
                const now = Date.now();
                setElapsedTime(Math.floor((now - start) / 1000));
            }, 1000);

            // Send notification every 30 minutes
            if (notificationsEnabled) {
                notificationInterval.current = setInterval(() => {
                    sendNotification('Timer activo', `Llevas ${formatDuration(elapsedTime)} trabajando`);
                }, 30 * 60 * 1000); // 30 minutes
            }

            return () => {
                if (timerInterval.current) clearInterval(timerInterval.current);
                if (notificationInterval.current) clearInterval(notificationInterval.current);
            };
        }
    }, [activeEntry, notificationsEnabled, elapsedTime]);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationsEnabled(permission === 'granted');
        }
    };

    const sendNotification = (title: string, body: string) => {
        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/neuracall-logo.png',
                badge: '/neuracall-logo.png'
            });
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('time_entries')
                .select('*')
                .order('start_time', { ascending: false })
                .limit(50);

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Fetch related projects
            const entriesWithProjects = await Promise.all(
                (data || []).map(async (entry) => {
                    if (entry.project_id) {
                        const { data: project } = await supabase
                            .from('projects')
                            .select('id, name')
                            .eq('id', entry.project_id)
                            .single();

                        return { ...entry, project };
                    }
                    return entry;
                })
            );

            setEntries(entriesWithProjects);

            // Find active entry
            const running = entriesWithProjects.find(e => e.is_running);
            if (running) {
                setActiveEntry(running);
                const start = new Date(running.start_time).getTime();
                const now = Date.now();
                setElapsedTime(Math.floor((now - start) / 1000));
            }
        } catch (error) {
            console.error('Error fetching time entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTimer = async (projectId?: string) => {
        try {
            const { data, error } = await supabase
                .from('time_entries')
                .insert([{
                    tenant_id: profile?.tenant_id,
                    user_id: profile?.id,
                    project_id: projectId || null,
                    start_time: new Date().toISOString(),
                    is_running: true,
                }])
                .select()
                .single();

            if (error) throw error;

            setActiveEntry(data);
            setElapsedTime(0);
            fetchEntries();

            sendNotification('Timer iniciado', 'El contador de tiempo ha comenzado');
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    };

    const handleStopTimer = async () => {
        if (!activeEntry) return;

        try {
            const endTime = new Date().toISOString();
            const start = new Date(activeEntry.start_time).getTime();
            const end = new Date(endTime).getTime();
            const durationMinutes = Math.floor((end - start) / 60000);

            const { error } = await supabase
                .from('time_entries')
                .update({
                    end_time: endTime,
                    duration_minutes: durationMinutes,
                    is_running: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeEntry.id);

            if (error) throw error;

            setActiveEntry(null);
            setElapsedTime(0);
            fetchEntries();

            sendNotification('Timer detenido', `Tiempo registrado: ${formatDuration(elapsedTime)}`);
        } catch (error) {
            console.error('Error stopping timer:', error);
        }
    };

    const handleDeleteEntry = async (entryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;

        try {
            const { error } = await supabase
                .from('time_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatMinutesToHours = (minutes: number | null) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getTotalTime = () => {
        const total = entries.reduce((acc, entry) => {
            if (entry.duration_minutes) {
                return acc + entry.duration_minutes;
            }
            return acc;
        }, 0);
        return formatMinutesToHours(total);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Control de Tiempos</h1>
                    <p className="text-slate-400 mt-1">
                        Registra el tiempo dedicado a tus proyectos.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                            notificationsEnabled
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        )}
                        title={notificationsEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
                    >
                        {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                    </button>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-medium transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Entrada Manual</span>
                    </button>
                </div>
            </div>

            {/* Active Timer */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {activeEntry ? 'Timer Activo' : 'Iniciar Timer'}
                        </h3>
                        {activeEntry && activeEntry.project && (
                            <p className="text-sm text-slate-300 flex items-center gap-2">
                                <FolderKanban size={16} />
                                {activeEntry.project.name}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-mono font-bold text-white">
                                {formatDuration(elapsedTime)}
                            </div>
                            {activeEntry && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Desde {new Date(activeEntry.start_time).toLocaleTimeString()}
                                </p>
                            )}
                        </div>

                        {activeEntry ? (
                            <button
                                onClick={handleStopTimer}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                <Pause size={20} />
                                <span>Detener</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStartTimer()}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                <Play size={20} />
                                <span>Iniciar</span>
                            </button>
                        )}
                    </div>
                </div>

                {activeEntry && notificationsEnabled && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 text-sm text-blue-300">
                        <Bell size={16} />
                        <span>Recibirás notificaciones cada 30 minutos mientras el timer esté activo</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Clock className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Tiempo Total</p>
                            <p className="text-2xl font-bold text-white">{getTotalTime()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <Calendar className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Entradas Hoy</p>
                            <p className="text-2xl font-bold text-white">
                                {entries.filter(e => {
                                    const today = new Date().toDateString();
                                    const entryDate = new Date(e.start_time).toDateString();
                                    return today === entryDate;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <FolderKanban className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Proyectos Activos</p>
                            <p className="text-2xl font-bold text-white">
                                {new Set(entries.filter(e => e.project_id).map(e => e.project_id)).size}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Entries List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Registros Recientes</h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <Clock size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No hay registros</h3>
                        <p className="text-slate-500 mt-2">
                            Inicia el timer o agrega una entrada manual
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-4 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {entry.is_running && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">
                                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                    En curso
                                                </span>
                                            )}
                                            {entry.project && (
                                                <span className="text-sm text-slate-300 flex items-center gap-1">
                                                    <FolderKanban size={14} />
                                                    {entry.project.name}
                                                </span>
                                            )}
                                        </div>

                                        {entry.description && (
                                            <p className="text-sm text-slate-400 mb-2">{entry.description}</p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(entry.start_time).toLocaleDateString()}
                                            </span>
                                            <span>
                                                {new Date(entry.start_time).toLocaleTimeString()} - {entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'En curso'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-white">
                                                {entry.is_running
                                                    ? formatDuration(elapsedTime)
                                                    : formatMinutesToHours(entry.duration_minutes)
                                                }
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEntry(entry);
                                                    setModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteEntry(entry.id, e)}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Entry Modal */}
            <TimeEntryModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedEntry(undefined);
                }}
                onSuccess={() => {
                    fetchEntries();
                    setModalOpen(false);
                    setSelectedEntry(undefined);
                }}
                entry={selectedEntry}
            />
        </div>
    );
}
