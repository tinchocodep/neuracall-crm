
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Opportunity } from '../../types/crm';

interface OpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    opportunity?: Opportunity | null; // If provided, we are editing
}

export default function OpportunityModal({ isOpen, onClose, onSuccess, opportunity }: OpportunityModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [creatingClient, setCreatingClient] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        value: 0,
        status: 'new',
        probability: 10,
        expected_close_date: '',
        description: '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'value' || name === 'probability' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (opportunity) {
                // Update existing opportunity
                const { error } = await supabase
                    .from('opportunities')
                    .update(formData)
                    .eq('id', opportunity.id);

                if (error) throw error;
            } else {
                // Create new opportunity
                const { error } = await supabase
                    .from('opportunities')
                    .insert([formData]);

                if (error) throw error;
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
        </div>
    );
}
