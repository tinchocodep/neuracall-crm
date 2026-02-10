
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Opportunity } from '../../types/crm';
import { useAuth } from '../../contexts/AuthContext';

interface OpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    opportunity?: Opportunity | null; // If provided, we are editing
}

export default function OpportunityModal({ isOpen, onClose, onSuccess, opportunity }: OpportunityModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);

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
            const { error } = opportunity
                ? await supabase
                    .from('opportunities')
                    .update({
                        ...formData,
                        expected_close_date: formData.expected_close_date || null
                    })
                    .eq('id', opportunity.id)
                : await supabase
                    .from('opportunities')
                    .insert([{
                        ...formData,
                        expected_close_date: formData.expected_close_date || null,
                        tenant_id: (await supabase.from('tenant_users').select('tenant_id').eq('user_id', user?.id).single()).data?.tenant_id
                    }]);

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving opportunity:', err);
            setError(err.message || 'Error al guardar la oportunidad');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">
                        {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            <label className="text-sm font-medium text-slate-300">Cliente</label>
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
                                <option value="new">Nuevo / Prospecto</option>
                                <option value="qualification">Calificación</option>
                                <option value="visit">Visita / Reunión</option>
                                <option value="proposal">Propuesta</option>
                                <option value="negotiation">Negociación</option>
                                <option value="closed_won">Cerrado Ganado</option>
                                <option value="closed_lost">Cerrado Perdido</option>
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
                        <label className="text-sm font-medium text-slate-300">Fecha Cierre Estimada</label>
                        <input
                            type="date"
                            name="expected_close_date"
                            value={formData.expected_close_date}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Descripción</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : (opportunity ? 'Actualizar' : 'Crear Oportunidad')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
