import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, AlertCircle, Link as LinkIcon, Users, Building2, FileText, CheckCircle2 } from 'lucide-react';
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

interface Client {
    id: string;
    name: string;
}

interface Contact {
    id: string;
    name: string;
    email: string | null;
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
    const [activeTab, setActiveTab] = useState<'details' | 'meeting' | 'feedback'>('details');

    // Form state - Basic
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState<string>('other');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [priority, setPriority] = useState<string>('medium');

    // Form state - Meeting
    const [meetingUrl, setMeetingUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [attendees, setAttendees] = useState('');

    // Form state - Relations
    const [relatedClientId, setRelatedClientId] = useState<string>('');
    const [relatedContactId, setRelatedContactId] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);

    // Form state - Feedback
    const [feedback, setFeedback] = useState('');
    const [eventStatus, setEventStatus] = useState<'pending' | 'completed' | 'cancelled'>('pending');

    useEffect(() => {
        if (profile) {
            fetchClientsAndContacts();
        }
    }, [profile]);

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
            setMeetingUrl(event.meeting_url || '');
            setNotes(event.notes || '');
            setFeedback(event.feedback || '');
            setRelatedClientId(event.related_client_id || '');
            setRelatedContactId(event.related_contact_id || '');
            setEventStatus(event.status);
            if (event.attendees && Array.isArray(event.attendees)) {
                setAttendees(event.attendees.join(', '));
            }
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

    const fetchClientsAndContacts = async () => {
        if (!profile) return;

        try {
            // Fetch clients
            const { data: clientsData } = await supabase
                .from('clients')
                .select('id, name')
                .eq('tenant_id', profile.tenant_id)
                .order('name');

            setClients(clientsData || []);

            // Fetch contacts
            const { data: contactsData } = await supabase
                .from('contacts')
                .select('id, name, email')
                .eq('tenant_id', profile.tenant_id)
                .order('name');

            setContacts(contactsData || []);
        } catch (error) {
            console.error('Error fetching clients/contacts:', error);
        }
    };

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

            // Parse attendees
            const attendeesArray = attendees
                ? attendees.split(',').map(a => a.trim()).filter(Boolean)
                : [];

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
                status: eventStatus,
                meeting_url: meetingUrl || null,
                notes: notes || null,
                feedback: feedback || null,
                attendees: attendeesArray,
                related_client_id: relatedClientId || null,
                related_contact_id: relatedContactId || null,
                created_by: profile.id,
                ...(eventStatus === 'completed' && !event?.completed_at ? {
                    completed_at: new Date().toISOString(),
                    completed_by: profile.id
                } : {})
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
        setMeetingUrl('');
        setNotes('');
        setFeedback('');
        setAttendees('');
        setRelatedClientId('');
        setRelatedContactId('');
        setEventStatus('pending');
        setError(null);
        setActiveTab('details');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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

                {/* Tabs */}
                <div className="flex gap-2 px-6 pt-4 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={cn(
                            "px-4 py-2 font-medium transition-colors border-b-2",
                            activeTab === 'details'
                                ? "text-purple-400 border-purple-400"
                                : "text-slate-400 border-transparent hover:text-white"
                        )}
                    >
                        Detalles
                    </button>
                    <button
                        onClick={() => setActiveTab('meeting')}
                        className={cn(
                            "px-4 py-2 font-medium transition-colors border-b-2",
                            activeTab === 'meeting'
                                ? "text-purple-400 border-purple-400"
                                : "text-slate-400 border-transparent hover:text-white"
                        )}
                    >
                        Reunión
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={cn(
                            "px-4 py-2 font-medium transition-colors border-b-2",
                            activeTab === 'feedback'
                                ? "text-purple-400 border-purple-400"
                                : "text-slate-400 border-transparent hover:text-white"
                        )}
                    >
                        Feedback
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

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <>
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

                            {/* Date and Priority */}
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
                                    placeholder="Ej: Oficina, Dirección física..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </>
                    )}

                    {/* Meeting Tab */}
                    {activeTab === 'meeting' && (
                        <>
                            {/* Meeting URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <LinkIcon size={16} className="inline mr-1" />
                                    Link de Reunión
                                </label>
                                <input
                                    type="url"
                                    value={meetingUrl}
                                    onChange={(e) => setMeetingUrl(e.target.value)}
                                    placeholder="https://zoom.us/j/... o https://meet.google.com/..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                                {meetingUrl && (
                                    <a
                                        href={meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block"
                                    >
                                        Abrir link →
                                    </a>
                                )}
                            </div>

                            {/* Attendees */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Users size={16} className="inline mr-1" />
                                    Participantes
                                </label>
                                <input
                                    type="text"
                                    value={attendees}
                                    onChange={(e) => setAttendees(e.target.value)}
                                    placeholder="Nombres separados por comas: Juan Pérez, María García..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>

                            {/* Related Client */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Building2 size={16} className="inline mr-1" />
                                    Cliente Relacionado
                                </label>
                                <select
                                    value={relatedClientId}
                                    onChange={(e) => setRelatedClientId(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                >
                                    <option value="">Ninguno</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Related Contact */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Users size={16} className="inline mr-1" />
                                    Contacto Principal
                                </label>
                                <select
                                    value={relatedContactId}
                                    onChange={(e) => setRelatedContactId(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                >
                                    <option value="">Ninguno</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.name} {contact.email ? `(${contact.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Pre-meeting Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FileText size={16} className="inline mr-1" />
                                    Notas / Agenda
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Puntos a tratar, objetivos de la reunión..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                />
                            </div>
                        </>
                    )}

                    {/* Feedback Tab */}
                    {activeTab === 'feedback' && (
                        <>
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <CheckCircle2 size={16} className="inline mr-1" />
                                    Estado del Evento
                                </label>
                                <select
                                    value={eventStatus}
                                    onChange={(e) => setEventStatus(e.target.value as 'pending' | 'completed' | 'cancelled')}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="completed">Completado</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FileText size={16} className="inline mr-1" />
                                    Feedback Post-Reunión
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={6}
                                    placeholder="¿Qué se discutió? ¿Cuáles fueron los resultados? ¿Próximos pasos?..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                />
                            </div>

                            {eventStatus === 'completed' && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-sm text-emerald-400">
                                        ✓ Este evento será marcado como completado
                                    </p>
                                </div>
                            )}
                        </>
                    )}
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
