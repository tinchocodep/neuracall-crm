import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Clock,
    MapPin,
    CheckCircle2,
    Circle,
    XCircle,
    Filter,
    Edit,
    Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import type { CalendarEvent } from '../types/crm';
import { cn } from '../lib/utils';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import EventModal from '../components/calendar/EventModal';

const EVENT_COLORS = {
    task: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', dot: 'bg-blue-500' },
    meeting: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', dot: 'bg-purple-500' },
    deadline: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', dot: 'bg-red-500' },
    invoice_due: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    subscription_billing: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', dot: 'bg-orange-500' },
    other: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', dot: 'bg-slate-500' }
};

export default function Calendar() {
    const { profile } = useAuth();
    const { isFounder, isSupervisor, isAdmin } = usePermissions();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'all' | 'mine' | 'user'>('mine');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);

    useEffect(() => {
        if (profile && (isFounder || isSupervisor || isAdmin)) {
            fetchUsers();
        }
    }, [profile, isFounder, isSupervisor, isAdmin]);

    useEffect(() => {
        fetchEvents();
    }, [currentDate, viewMode, selectedUserId, profile]);

    const fetchEvents = async () => {
        if (!profile) return;

        try {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);

            let query = supabase
                .from('calendar_events')
                .select('*')
                .gte('start_date', monthStart.toISOString())
                .lte('start_date', monthEnd.toISOString())
                .order('start_date', { ascending: true });

            // Solo filtrar por tenant_id si NO es cofounder
            if (profile.tenant_id && profile.role !== 'cofounder') {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            // Filter by user based on view mode
            if (viewMode === 'mine') {
                query = query.eq('user_id', profile.id);
            } else if (viewMode === 'user' && selectedUserId) {
                query = query.eq('user_id', selectedUserId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchUsers = async () => {
        if (!profile) return;

        try {
            let usersQuery = supabase
                .from('usuarios')
                .select('id, nombre, email')
                .order('nombre');

            // Solo filtrar por tenant_id si NO es cofounder
            if (profile.tenant_id && profile.role !== 'cofounder') {
                usersQuery = usersQuery.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await usersQuery;

            if (error) throw error;

            const formattedUsers = (data || []).map((u: { id: string; nombre: string; email: string }) => ({
                id: u.id,
                name: u.nombre,
                email: u.email
            }));

            setUsers(formattedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const getCalendarDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    };

    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.start_date);
            return isSameDay(eventDate, date);
        }).filter(event => {
            if (typeFilter === 'all') return true;
            return event.event_type === typeFilter;
        });
    };

    const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            // Refresh events
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error al eliminar el evento');
        }
    };

    const days = getCalendarDays();

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Calendario</h1>
                    <p className="text-slate-400">Gestiona tus eventos y actividades</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle (Only for admin/supervisor) */}
                    {(isFounder || isSupervisor || isAdmin) && (
                        <>
                            <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
                                <button
                                    onClick={() => { setViewMode('mine'); setSelectedUserId(''); }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                        viewMode === 'mine'
                                            ? "bg-purple-600 text-white"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Mis Eventos
                                </button>
                                <button
                                    onClick={() => { setViewMode('all'); setSelectedUserId(''); }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                        viewMode === 'all'
                                            ? "bg-purple-600 text-white"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Todos
                                </button>
                            </div>

                            {/* User Filter Dropdown */}
                            <select
                                value={selectedUserId}
                                onChange={(e) => {
                                    const userId = e.target.value;
                                    setSelectedUserId(userId);
                                    setViewMode(userId ? 'user' : 'all');
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            >
                                <option value="">Filtrar por usuario...</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <button
                        onClick={() => { setSelectedEvent(undefined); setModalOpen(true); }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nuevo Evento
                    </button>

                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Hoy
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Tipo:</span>
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                    <option value="all">Todos</option>
                    <option value="task">Tareas</option>
                    <option value="meeting">Reuniones</option>
                    <option value="deadline">Vencimientos</option>
                    <option value="invoice_due">Facturas</option>
                    <option value="subscription_billing">Suscripciones</option>
                    <option value="other">Otros</option>
                </select>
            </div>

            {/* Calendar */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                {/* Calendar Navigation */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <h2 className="text-2xl font-bold text-white capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>

                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((date, index) => {
                            const dayEvents = getEventsForDate(date);
                            const isCurrentMonth = isSameMonth(date, currentDate);
                            const isTodayDate = isToday(date);
                            const isSelected = selectedDate && isSameDay(date, selectedDate);

                            return (
                                <div
                                    key={index}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "min-h-[100px] p-2 rounded-lg border-2 transition-all cursor-pointer",
                                        isCurrentMonth
                                            ? "bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800"
                                            : "bg-slate-900/30 border-slate-800/50 opacity-50",
                                        isTodayDate && "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20",
                                        isSelected && "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                                    )}
                                >
                                    <div className={cn(
                                        "text-sm font-semibold mb-1",
                                        isTodayDate ? "text-purple-400" : isCurrentMonth ? "text-slate-300" : "text-slate-600"
                                    )}>
                                        {format(date, 'd')}
                                    </div>

                                    {/* Events */}
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map(event => {
                                            const colors = EVENT_COLORS[event.event_type];
                                            return (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "text-xs px-1.5 py-0.5 rounded border-l-2 truncate",
                                                        colors.bg,
                                                        colors.border,
                                                        colors.text
                                                    )}
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-slate-500 px-1.5">
                                                +{dayEvents.length - 2} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white capitalize">
                            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </h3>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {getEventsForDate(selectedDate).length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No hay eventos para este día</p>
                            </div>
                        ) : (
                            getEventsForDate(selectedDate).map(event => {
                                const colors = EVENT_COLORS[event.event_type];
                                return (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "p-4 rounded-lg border-l-4",
                                            colors.bg,
                                            colors.border
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                                                {event.description && (
                                                    <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {format(new Date(event.start_date), 'HH:mm')}
                                                    </div>
                                                    {event.location && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={14} />
                                                            {event.location}
                                                        </div>
                                                    )}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        colors.bg,
                                                        colors.text
                                                    )}>
                                                        {event.event_type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {event.status === 'completed' && <CheckCircle2 size={20} className="text-emerald-400" />}
                                                {event.status === 'pending' && <Circle size={20} className="text-slate-400" />}
                                                {event.status === 'cancelled' && <XCircle size={20} className="text-red-400" />}

                                                {/* Action Buttons */}
                                                <button
                                                    onClick={() => { setSelectedEvent(event); setModalOpen(true); }}
                                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
                                                    title="Editar evento"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                                                    title="Eliminar evento"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Tipos de Eventos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                        <div key={type} className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", colors.dot)} />
                            <span className="text-sm text-slate-400 capitalize">
                                {type.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Event Modal */}
            <EventModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedEvent(undefined); }}
                onSave={() => { fetchEvents(); setModalOpen(false); setSelectedEvent(undefined); }}
                event={selectedEvent}
                initialDate={selectedDate || undefined}
            />
        </div>
    );
}
