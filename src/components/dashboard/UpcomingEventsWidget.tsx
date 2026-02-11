import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { CalendarEvent } from '../../types/crm';
import { format, isToday, isTomorrow, isPast, differenceInDays, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const EVENT_COLORS = {
    task: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', dot: 'bg-blue-500' },
    meeting: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', dot: 'bg-purple-500' },
    deadline: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', dot: 'bg-red-500' },
    invoice_due: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    subscription_billing: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', dot: 'bg-orange-500' },
    other: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', dot: 'bg-slate-500' }
};

export default function UpcomingEventsWidget() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        urgent: 0,
        today: 0,
        thisWeek: 0,
        overdue: 0
    });

    useEffect(() => {
        if (profile) {
            fetchUpcomingEvents();
        }
    }, [profile]);

    const fetchUpcomingEvents = async () => {
        if (!profile) return;

        try {
            setLoading(true);
            const today = startOfDay(new Date());
            const nextWeek = addDays(today, 7);

            // Fetch events for the next 7 days and overdue events
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', profile.id)
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .or(`start_date.lte.${nextWeek.toISOString()},start_date.lt.${today.toISOString()}`)
                .order('start_date', { ascending: true })
                .limit(10);

            if (error) throw error;

            const eventList = data || [];
            setEvents(eventList);

            // Calculate stats
            const todayEvents = eventList.filter((e: CalendarEvent) => isToday(new Date(e.start_date)));
            const urgentEvents = eventList.filter((e: CalendarEvent) => e.priority === 'urgent');
            const weekEvents = eventList.filter((e: CalendarEvent) => {
                const eventDate = new Date(e.start_date);
                return eventDate >= today && eventDate <= nextWeek;
            });
            const overdueEvents = eventList.filter((e: CalendarEvent) => isPast(new Date(e.start_date)) && !isToday(new Date(e.start_date)));

            setStats({
                urgent: urgentEvents.length,
                today: todayEvents.length,
                thisWeek: weekEvents.length,
                overdue: overdueEvents.length
            });
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateLabel = (date: string) => {
        const eventDate = new Date(date);
        if (isPast(eventDate) && !isToday(eventDate)) {
            const days = Math.abs(differenceInDays(eventDate, new Date()));
            return `Vencido hace ${days} día${days > 1 ? 's' : ''}`;
        }
        if (isToday(eventDate)) return 'Hoy';
        if (isTomorrow(eventDate)) return 'Mañana';
        const days = differenceInDays(eventDate, new Date());
        if (days <= 7) return `En ${days} día${days > 1 ? 's' : ''}`;
        return format(eventDate, "d 'de' MMM", { locale: es });
    };

    const getDateColor = (date: string) => {
        const eventDate = new Date(date);
        if (isPast(eventDate) && !isToday(eventDate)) return 'text-red-400';
        if (isToday(eventDate)) return 'text-orange-400';
        if (isTomorrow(eventDate)) return 'text-yellow-400';
        return 'text-slate-400';
    };

    if (loading) {
        return (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Próximos Vencimientos</h3>
                        <p className="text-sm text-slate-400">Cargando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Próximos Vencimientos</h3>
                        <p className="text-sm text-slate-400">
                            {events.length} evento{events.length !== 1 ? 's' : ''} pendiente{events.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                    Ver todo
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-red-400" />
                        <span className="text-xs text-slate-400">Vencidos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-orange-400" />
                        <span className="text-xs text-slate-400">Hoy</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.today}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-yellow-400" />
                        <span className="text-xs text-slate-400">Esta Semana</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-purple-400" />
                        <span className="text-xs text-slate-400">Urgentes</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.urgent}</p>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-3">
                {events.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-400 opacity-50" />
                        <p className="text-slate-400">¡Todo al día! No hay eventos pendientes.</p>
                    </div>
                ) : (
                    events.map(event => {
                        const colors = EVENT_COLORS[event.event_type];
                        const isOverdue = isPast(new Date(event.start_date)) && !isToday(new Date(event.start_date));

                        return (
                            <div
                                key={event.id}
                                className={cn(
                                    "p-4 rounded-lg border-l-4 transition-all cursor-pointer hover:bg-slate-800/50",
                                    isOverdue ? 'bg-red-500/10 border-red-500' : colors.bg + ' ' + colors.border
                                )}
                                onClick={() => navigate('/calendar')}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={cn("w-2 h-2 rounded-full", isOverdue ? 'bg-red-500' : colors.dot)} />
                                            <h4 className="font-semibold text-white truncate">{event.title}</h4>
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-1">{event.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className={cn("font-medium", getDateColor(event.start_date))}>
                                                {getDateLabel(event.start_date)}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full capitalize",
                                                isOverdue ? 'bg-red-500/20 text-red-400' : colors.bg + ' ' + colors.text
                                            )}>
                                                {event.event_type.replace('_', ' ')}
                                            </span>
                                            {event.priority === 'urgent' && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                                    Urgente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isOverdue && (
                                        <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {events.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                        onClick={() => navigate('/calendar')}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Calendar size={18} />
                        Ir al Calendario
                    </button>
                </div>
            )}
        </div>
    );
}
