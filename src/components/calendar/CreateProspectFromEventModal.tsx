import { useState } from 'react';
import { X, Building2, User, Mail, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreateProspectFromEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (prospectId: string) => void;
    eventTitle: string;
    eventNotes?: string;
    eventFeedback?: string;
    attendees?: string[];
}

export default function CreateProspectFromEventModal({
    isOpen,
    onClose,
    onSuccess,
    eventTitle,
    eventNotes,
    eventFeedback,
    attendees
}: CreateProspectFromEventModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [contactName, setContactName] = useState(attendees?.[0] || '');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [industry, setIndustry] = useState('');
    const [notes, setNotes] = useState(
        `Primer contacto: ${eventTitle}\n\n${eventNotes ? `Agenda:\n${eventNotes}\n\n` : ''}${eventFeedback ? `Feedback:\n${eventFeedback}` : ''}`
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setLoading(true);
        setError(null);

        try {
            // Create client (prospect)
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    tenant_id: profile.tenant_id,
                    name: contactName,
                    company_name: companyName,
                    email: email || null,
                    phone: phone || null,
                    industry: industry || null,
                    status: 'prospect',
                    source: 'meeting',
                    notes: notes,
                    created_by: profile.id
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // Create contact if we have contact details
            if (contactName && clientData) {
                const { error: contactError } = await supabase
                    .from('contacts')
                    .insert([{
                        tenant_id: profile.tenant_id,
                        name: contactName,
                        email: email || null,
                        phone: phone || null,
                        position: 'Contacto Principal',
                        is_primary: true,
                        created_by: profile.id
                    }]);

                if (contactError) {
                    console.error('Error creating contact:', contactError);
                    // Don't throw, contact is optional
                }

                // Link contact to company
                if (!contactError) {
                    const { data: contactData } = await supabase
                        .from('contacts')
                        .select('id')
                        .eq('tenant_id', profile.tenant_id)
                        .eq('email', email)
                        .single();

                    if (contactData) {
                        await supabase
                            .from('contact_companies')
                            .insert([{
                                tenant_id: profile.tenant_id,
                                contact_id: contactData.id,
                                company_id: clientData.id
                            }]);
                    }
                }
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess(clientData.id);
                handleClose();
            }, 1500);
        } catch (err: any) {
            console.error('Error creating prospect:', err);
            setError(err.message || 'Error al crear el prospecto');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCompanyName('');
        setContactName('');
        setEmail('');
        setPhone('');
        setIndustry('');
        setNotes('');
        setError(null);
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Crear Prospecto</h2>
                        <p className="text-sm text-slate-400 mt-1">Desde reunión: {eventTitle}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="m-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                        <CheckCircle2 size={24} />
                        <div>
                            <p className="font-medium">¡Prospecto creado exitosamente!</p>
                            <p className="text-sm text-emerald-400/80">Redirigiendo...</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                {!success && (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                                <AlertCircle size={20} />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Building2 size={16} className="inline mr-1" />
                                Nombre de la Empresa *
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                placeholder="Ej: Acme Corp"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        {/* Contact Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <User size={16} className="inline mr-1" />
                                Nombre del Contacto *
                            </label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                required
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                            {attendees && attendees.length > 1 && (
                                <div className="mt-2">
                                    <p className="text-xs text-slate-400 mb-1">Otros participantes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {attendees.slice(1).map((attendee, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setContactName(attendee)}
                                                className="px-2 py-1 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded text-xs text-slate-300 hover:text-white transition-colors"
                                            >
                                                {attendee}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Email and Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Mail size={16} className="inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="contacto@empresa.com"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Phone size={16} className="inline mr-1" />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+54 11 1234-5678"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Industria
                            </label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Tecnología">Tecnología</option>
                                <option value="Finanzas">Finanzas</option>
                                <option value="Salud">Salud</option>
                                <option value="Educación">Educación</option>
                                <option value="Retail">Retail</option>
                                <option value="Manufactura">Manufactura</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Inmobiliaria">Inmobiliaria</option>
                                <option value="Construcción">Construcción</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Notas
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={6}
                                placeholder="Información adicional sobre el prospecto..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Las notas incluyen automáticamente la información de la reunión
                            </p>
                        </div>
                    </form>
                )}

                {/* Footer */}
                {!success && (
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
                            disabled={loading || !companyName || !contactName}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none"
                        >
                            {loading ? 'Creando...' : 'Crear Prospecto'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
