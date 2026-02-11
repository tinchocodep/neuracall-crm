import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Zap, Server, Code, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Subscription } from '../../types/crm';
import { cn } from '../../lib/utils';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscription?: Subscription;
    onSave: () => void;
}

const CATEGORIES = [
    { value: 'ai_engine', label: 'Motor IA', icon: Zap, color: 'purple' },
    { value: 'infrastructure', label: 'Infraestructura', icon: Server, color: 'blue' },
    { value: 'software', label: 'Software', icon: Code, color: 'emerald' },
    { value: 'other', label: 'Otro', icon: Package, color: 'slate' }
];

const FREQUENCIES = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'annual', label: 'Anual' }
];

export default function SubscriptionModal({ isOpen, onClose, subscription, onSave }: SubscriptionModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'ai_engine' as 'ai_engine' | 'infrastructure' | 'software' | 'other',
        provider: '',
        amount: 0,
        currency: 'USD',
        billing_frequency: 'monthly' as 'monthly' | 'annual' | 'quarterly',
        status: 'active' as 'active' | 'paused' | 'cancelled',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        next_billing_date: '',
        notes: ''
    });

    useEffect(() => {
        if (subscription) {
            setFormData({
                name: subscription.name,
                description: subscription.description || '',
                category: subscription.category,
                provider: subscription.provider || '',
                amount: subscription.amount,
                currency: subscription.currency,
                billing_frequency: subscription.billing_frequency,
                status: subscription.status,
                start_date: subscription.start_date,
                end_date: subscription.end_date || '',
                next_billing_date: subscription.next_billing_date || '',
                notes: subscription.notes || ''
            });
        } else {
            // Reset form for new subscription
            setFormData({
                name: '',
                description: '',
                category: 'ai_engine',
                provider: '',
                amount: 0,
                currency: 'USD',
                billing_frequency: 'monthly',
                status: 'active',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                next_billing_date: '',
                notes: ''
            });
        }
    }, [subscription, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                tenant_id: profile?.tenant_id,
                end_date: formData.end_date || null,
                next_billing_date: formData.next_billing_date || null,
                notes: formData.notes || null,
                created_by: profile?.id
            };

            if (subscription) {
                // Update existing
                const { error } = await supabase
                    .from('subscriptions')
                    .update(dataToSave)
                    .eq('id', subscription.id);

                if (error) throw error;
            } else {
                // Create new
                const { error } = await supabase
                    .from('subscriptions')
                    .insert([dataToSave]);

                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving subscription:', error);
            alert('Error al guardar la suscripción');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-slate-700 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {subscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
                        </h2>
                        <p className="text-slate-400 mt-1">
                            Gestiona tus gastos recurrentes
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name & Provider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: OpenAI API"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Proveedor
                            </label>
                            <input
                                type="text"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                placeholder="Ej: OpenAI"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Categoría *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: cat.value as any })}
                                        className={cn(
                                            "p-3 rounded-xl border-2 transition-all duration-200",
                                            formData.category === cat.value
                                                ? `border-${cat.color}-500 bg-${cat.color}-500/10 text-${cat.color}-400`
                                                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                        )}
                                    >
                                        <Icon size={20} className="mx-auto mb-1" />
                                        <div className="text-xs font-medium">{cat.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <DollarSign size={16} className="text-purple-400" />
                                Monto *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Moneda
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            >
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Billing Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Frecuencia de Facturación *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {FREQUENCIES.map((freq) => (
                                <button
                                    key={freq.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, billing_frequency: freq.value as any })}
                                    className={cn(
                                        "p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                                        formData.billing_frequency === freq.value
                                            ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                            : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-400" />
                                Fecha de Inicio *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Próxima Facturación
                            </label>
                            <input
                                type="date"
                                value={formData.next_billing_date}
                                onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha de Fin
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            placeholder="Descripción de la suscripción..."
                            className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Notas adicionales..."
                            className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold shadow-xl shadow-purple-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : subscription ? 'Actualizar' : 'Crear Suscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
