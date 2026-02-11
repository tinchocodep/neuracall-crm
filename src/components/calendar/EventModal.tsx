import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { CalendarEvent } from '../../types/crm';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    event?: CalendarEvent;
    initialDate?: Date;
}

const EVENT_TYPES = [
    { value: 'task', label: 'Tarea', color: 'blue' },
    { value: 'meeting', label: 'Reunión', color: 'purple' },
    { value: 'deadline', label: 'Vencimiento', color: 'red' },
    { value: 'invoice_due', label: 'Factura por Vencer', color: 'emerald' },
    { value: 'subscription_billing', label: 'Facturación Suscripción', color: 'orange' },
    { value: 'other', label: 'Otro', color: 'slate' }
];

const PRIORITIES = [
    { value: 'low', label: 'Baja', color: 'text-slate-400' },
    { value: 'medium', label: 'Media', color: 'text-blue-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400' }
];

export default function EventModal({ isOpen, onClose, onSave, event, initialDate }: EventModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState<string>('other');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [priority, setPriority] = useState<string>('medium');

    useEffect(() => {
        if (event) {
            // Edit mode
            setTitle(event.title);
            setDescription(event.description || '');
            setEventType(event.event_type);
            setStartDate(format(new Date(event.start_date), 'yyyy-MM-dd'));
            setStartTime(format(new Date(event.start_date), 'HH:mm'));
            if (event.end_date) {
                setEndTime(format(new Date(event.end_date), 'HH:mm'));
            }
            setAllDay(event.all_day);
            setLocation(event.location || '');
            setPriority(event.priority);
        } else if (initialDate) {
            // New event with initial date
            setStartDate(format(initialDate, 'yyyy-MM-dd'));
            setStartTime('09:00');
            setEndTime('10:00');
        } else {
            // New event
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setStartTime('09:00');
            setEndTime('10:00');
        }
    }, [event, initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setLoading(true);
        setError(null);

        try {
            // Construct start_date
            const startDateTime = allDay
                ? new Date(startDate).toISOString()
                : new Date(`${startDate}T${startTime}`).toISOString();

            // Construct end_date
            const endDateTime = allDay || !endTime
                ? null
                : new Date(`${startDate}T${endTime}`).toISOString();

            const eventData = {
                tenant_id: profile.tenant_id,
                user_id: profile.id,
                title,
                description: description || null,
                event_type: eventType,
                start_date: startDateTime,
                end_date: endDateTime,
                all_day: allDay,
                location: location || null,
                priority,
                status: 'pending',
                created_by: profile.id
            };

            if (event) {
                // Update existing event
                const { error: updateError } = await supabase
                    .from('calendar_events')
                    .update(eventData)
                    .eq('id', event.id);

                if (updateError) throw updateError;
            } else {
                // Create new event
                const { error: insertError } = await supabase
                    .from('calendar_events')
                    .insert([eventData]);

                if (insertError) throw insertError;
            }

            onSave();
            handleClose();
        } catch (err: any) {
            console.error('Error saving event:', err);
            setError(err.message || 'Error al guardar el evento');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setTitle('');
        setDescription('');
        setEventType('other');
        setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setStartTime('09:00');
        setEndTime('10:00');
        setAllDay(false);
        setLocation('');
        setPriority('medium');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            <AlertCircle size={20} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Ej: Reunión con cliente"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Detalles del evento..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Tag size={16} className="inline mr-1" />
                            Tipo de Evento *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {EVENT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setEventType(type.value)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm",
                                        eventType === type.value
                                            ? `border-${type.color}-500 bg-${type.color}-500/20 text-${type.color}-400`
                                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Prioridad
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* All Day Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="allDay"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="w-5 h-5 bg-slate-800 border-slate-700 rounded text-purple-600 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <label htmlFor="allDay" className="text-sm font-medium text-slate-300 cursor-pointer">
                            Todo el día
                        </label>
                    </div>

                    {/* Time Range (if not all day) */}
                    {!allDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Clock size={16} className="inline mr-1" />
                                    Hora Inicio
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Clock size={16} className="inline mr-1" />
                                    Hora Fin
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <MapPin size={16} className="inline mr-1" />
                            Ubicación
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ej: Oficina, Zoom, Google Meet..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none"
                    >
                        {loading ? 'Guardando...' : event ? 'Actualizar' : 'Crear Evento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
