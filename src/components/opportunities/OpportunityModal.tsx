
import React, { useState, useEffect } from 'react';
import { X, UserPlus, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Opportunity } from '../../types/crm';
import type { Contact } from '../../types/crm';
import ContactModal from '../contacts/ContactModal';
import { useAuth } from '../../contexts/AuthContext';
import { useActivityLog } from '../../hooks/useActivityLog';
import { discordService } from '../../services/discord';

interface OpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    opportunity?: Opportunity | null; // If provided, we are editing
}

export default function OpportunityModal({ isOpen, onClose, onSuccess, opportunity }: OpportunityModalProps) {
    const { user, profile } = useAuth();
    const { logActivity } = useActivityLog();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [creatingClient, setCreatingClient] = useState(false);

    // Contact management
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [showContactModal, setShowContactModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        value: 0,
        status: 'new',
        probability: 10,
        expected_close_date: '',
        description: '',
        setup_fee: 0,
        monthly_fee: 0,
        proposal_pdf_url: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            if (opportunity) {
                setFormData({
                    title: opportunity.title,
                    client_id: opportunity.client_id,
                    value: opportunity.value,
                    status: opportunity.status,
                    probability: opportunity.probability,
                    expected_close_date: opportunity.expected_close_date || '',
                    description: opportunity.description || '',
                    setup_fee: opportunity.setup_fee || 0,
                    monthly_fee: opportunity.monthly_fee || 0,
                    proposal_pdf_url: opportunity.proposal_pdf_url || '',
                });
            } else {
                // Reset form for new opportunity
                setFormData({
                    title: '',
                    client_id: '',
                    value: 0,
                    status: 'new',
                    probability: 10,
                    expected_close_date: '',
                    description: '',
                    setup_fee: 0,
                    monthly_fee: 0,
                    proposal_pdf_url: '',
                });
            }
            setShowNewClientForm(false);
            setNewClientName('');
        }
    }, [isOpen, opportunity]);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const createNewClient = async () => {
        if (!newClientName.trim()) return;

        setCreatingClient(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    name: newClientName.trim(),
                    status: 'prospect' // Marcar como prospecto inicialmente
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to clients list and select it
            setClients(prev => [...prev, { id: data.id, name: data.name }]);
            setFormData(prev => ({ ...prev, client_id: data.id }));
            setShowNewClientForm(false);
            setNewClientName('');
        } catch (err) {
            console.error('Error creating client:', err);
            setError('Error al crear el cliente');
        } finally {
            setCreatingClient(false);
        }
    };

    const fetchContactsForClient = async (clientId: string) => {
        if (!clientId) {
            setContacts([]);
            setSelectedContactId('');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('contact_clients')
                .select(`
                    contact:contacts(
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        position
                    )
                `)
                .eq('client_id', clientId);

            if (error) throw error;

            const contactsList = data?.map((cc: any) => cc.contact).filter(Boolean) || [];
            setContacts(contactsList);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['value', 'probability', 'setup_fee', 'monthly_fee'].includes(name)
                ? parseFloat(value) || 0
                : value
        }));

        // Fetch contacts when client changes
        if (name === 'client_id') {
            fetchContactsForClient(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const oldStatus = opportunity?.status;
            let opportunityId = opportunity?.id;
            let clientName = '';

            // Get client name for notifications
            const selectedClient = clients.find(c => c.id === formData.client_id);
            clientName = selectedClient?.name || '';

            if (opportunity) {
                // Update existing opportunity
                const { error } = await supabase
                    .from('opportunities')
                    .update(formData)
                    .eq('id', opportunity.id);

                if (error) throw error;

                // Log activity for update
                await logActivity({
                    activityType: 'opportunity_updated',
                    title: `Oportunidad "${formData.title}" actualizada`,
                    description: `Se han modificado los datos de la oportunidad`,
                    clientId: formData.client_id,
                    relatedToType: 'opportunity',
                    relatedToId: opportunity.id,
                    metadata: {
                        value: formData.value,
                        status: formData.status,
                        probability: formData.probability
                    }
                });

                // Check if status changed
                if (oldStatus && oldStatus !== formData.status) {
                    // Log stage change activity
                    await logActivity({
                        activityType: 'opportunity_stage_changed',
                        title: `Oportunidad "${formData.title}" cambió de etapa`,
                        description: `Etapa anterior: ${oldStatus}, Nueva etapa: ${formData.status}`,
                        clientId: formData.client_id,
                        relatedToType: 'opportunity',
                        relatedToId: opportunity.id,
                        metadata: {
                            old_stage: oldStatus,
                            new_stage: formData.status,
                            value: formData.value
                        }
                    });

                    // Send Discord notification for stage change
                    if (user && profile) {
                        await discordService.notifyOpportunityStageChange(
                            formData.title,
                            clientName,
                            oldStatus,
                            formData.status,
                            profile.full_name || user.email || 'Usuario'
                        );
                    }
                }
            } else {
                // Create new opportunity
                const { data, error } = await supabase
                    .from('opportunities')
                    .insert([formData])
                    .select()
                    .single();

                if (error) throw error;
                opportunityId = data?.id;

                // Log activity for creation
                await logActivity({
                    activityType: 'opportunity_created',
                    title: `Oportunidad "${formData.title}" creada`,
                    description: `Nueva oportunidad por un valor de $${formData.value.toLocaleString()}`,
                    clientId: formData.client_id,
                    relatedToType: 'opportunity',
                    relatedToId: opportunityId,
                    metadata: {
                        value: formData.value,
                        status: formData.status,
                        probability: formData.probability,
                        expected_close_date: formData.expected_close_date || null
                    }
                });

                // Send Discord notification for new opportunity
                if (user && profile) {
                    await discordService.notifyNewOpportunity(
                        formData.title,
                        clientName,
                        formData.value,
                        profile.full_name || user.email || 'Usuario'
                    );
                }
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving opportunity:', err);
            setError(err.message || 'Error al guardar la oportunidad');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Título</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Ej. Implementación CRM"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">Cliente</label>
                                <button
                                    type="button"
                                    onClick={() => setShowNewClientForm(!showNewClientForm)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {showNewClientForm ? 'Cancelar' : '+ Nuevo Cliente'}
                                </button>
                            </div>

                            {showNewClientForm ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                createNewClient();
                                            }
                                        }}
                                        placeholder="Nombre del nuevo cliente"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={createNewClient}
                                        disabled={creatingClient || !newClientName.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {creatingClient ? 'Creando...' : 'Crear y Seleccionar'}
                                    </button>
                                </div>
                            ) : (
                                <select
                                    name="client_id"
                                    required
                                    value={formData.client_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Seleccionar Cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Contact Selection */}
                        {formData.client_id && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300">Contacto</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowContactModal(true)}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                    >
                                        <UserPlus size={14} />
                                        Nuevo Contacto
                                    </button>
                                </div>
                                <select
                                    name="contact_id"
                                    value={selectedContactId}
                                    onChange={(e) => setSelectedContactId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Sin contacto asignado</option>
                                    {contacts.map(contact => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name}
                                            {contact.position ? ` - ${contact.position}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {contacts.length === 0 && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <User size={12} />
                                        No hay contactos para este cliente
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Valor Estimado ($)</label>
                            <input
                                type="number"
                                name="value"
                                min="0"
                                value={formData.value}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Etapa</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="new">Nuevo</option>
                                <option value="qualification">Calificación</option>
                                <option value="visit">Visita</option>
                                <option value="proposal">Propuesta</option>
                                <option value="negotiation">Negociación</option>
                                <option value="closed_won">Ganado</option>
                                <option value="closed_lost">Perdido</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Probabilidad (%)</label>
                            <input
                                type="number"
                                name="probability"
                                min="0"
                                max="100"
                                value={formData.probability}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Fecha Estimada de Cierre</label>
                        <input
                            type="date"
                            name="expected_close_date"
                            value={formData.expected_close_date}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Proposal Pricing Section */}
                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4">💰 Propuesta Económica</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fee de Instalación ($)</label>
                                <input
                                    type="number"
                                    name="setup_fee"
                                    min="0"
                                    step="0.01"
                                    value={formData.setup_fee}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fee Mensual ($)</label>
                                <input
                                    type="number"
                                    name="monthly_fee"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthly_fee}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium text-slate-300">URL del PDF de Presupuesto</label>
                            <input
                                type="url"
                                name="proposal_pdf_url"
                                value={formData.proposal_pdf_url}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="https://ejemplo.com/presupuesto.pdf"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Descripción</label>
                        <textarea
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="Detalles adicionales sobre la oportunidad..."
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
                            {loading ? 'Guardando...' : opportunity ? 'Actualizar' : 'Crear Oportunidad'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Contact Modal */}
            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                onSuccess={() => {
                    setShowContactModal(false);
                    fetchContactsForClient(formData.client_id);
                }}
                preselectedClientId={formData.client_id}
            />
        </div>
    );
}
