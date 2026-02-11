import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Contact } from '../../types/crm';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    contact?: Contact;
    preselectedClientId?: string; // For when creating from opportunity
}

export default function ContactModal({ isOpen, onClose, onSuccess, contact, preselectedClientId }: ContactModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        notes: '',
        is_primary: false,
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            if (contact) {
                setFormData({
                    first_name: contact.first_name || '',
                    last_name: contact.last_name || '',
                    email: contact.email || '',
                    phone: contact.phone || '',
                    position: contact.position || '',
                    department: contact.department || '',
                    notes: contact.notes || '',
                    is_primary: contact.is_primary || false,
                });
                // Fetch existing client associations
                fetchContactClients(contact.id);
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    position: '',
                    department: '',
                    notes: '',
                    is_primary: false,
                });
                setSelectedClientIds(preselectedClientId ? [preselectedClientId] : []);
            }
        }
    }, [isOpen, contact, preselectedClientId]);

    const fetchClients = async () => {
        try {
            let query = supabase
                .from('clients')
                .select('id, name, status')
                .order('name');

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const fetchContactClients = async (contactId: string) => {
        try {
            const { data, error } = await supabase
                .from('contact_clients')
                .select('client_id')
                .eq('contact_id', contactId);

            if (error) throw error;
            setSelectedClientIds(data?.map((cc: { client_id: string }) => cc.client_id) || []);
        } catch (err) {
            console.error('Error fetching contact clients:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleClient = (clientId: string) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const contactData = {
                ...formData,
                tenant_id: profile?.tenant_id,
                created_by: profile?.id,
            };

            let contactId: string;

            if (contact) {
                // Update existing contact
                const { error } = await supabase
                    .from('contacts')
                    .update(contactData)
                    .eq('id', contact.id);

                if (error) throw error;
                contactId = contact.id;

                // Delete existing associations
                await supabase
                    .from('contact_clients')
                    .delete()
                    .eq('contact_id', contactId);
            } else {
                // Create new contact
                const { data, error } = await supabase
                    .from('contacts')
                    .insert([contactData])
                    .select()
                    .single();

                if (error) throw error;
                contactId = data.id;
            }

            // Create client associations
            if (selectedClientIds.length > 0) {
                const associations = selectedClientIds.map(clientId => ({
                    contact_id: contactId,
                    client_id: clientId,
                    tenant_id: profile?.tenant_id,
                }));

                const { error: assocError } = await supabase
                    .from('contact_clients')
                    .insert(associations);

                if (assocError) throw assocError;
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving contact:', err);
            setError(err.message || 'Error al guardar el contacto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">
                        {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Información Personal</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nombre *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Juan"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Apellido *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Pérez"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="juan@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Cargo</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Gerente de Ventas"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Departamento</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Ventas"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_primary"
                                name="is_primary"
                                checked={formData.is_primary}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                            />
                            <label htmlFor="is_primary" className="text-sm text-slate-300">
                                Marcar como contacto principal
                            </label>
                        </div>
                    </div>

                    {/* Client Association */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Building2 size={20} />
                            Vincular a Clientes/Prospectos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
                            {clients.map(client => (
                                <label
                                    key={client.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedClientIds.includes(client.id)
                                        ? 'bg-blue-500/10 border-blue-500/50'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClientIds.includes(client.id)}
                                        onChange={() => toggleClient(client.id)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{client.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{client.status}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {selectedClientIds.length > 0 && (
                            <p className="text-sm text-blue-400">
                                {selectedClientIds.length} cliente{selectedClientIds.length > 1 ? 's' : ''} seleccionado{selectedClientIds.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 pt-4 border-t border-slate-800">
                        <label className="text-sm font-medium text-slate-300">Notas</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="Notas adicionales sobre el contacto..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Guardando...' : contact ? 'Actualizar' : 'Crear Contacto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
