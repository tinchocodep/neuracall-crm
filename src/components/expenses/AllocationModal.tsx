import { useState, useEffect } from 'react';
import { X, PieChart, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Subscription, ExpenseAllocation } from '../../types/crm';
import { cn } from '../../lib/utils';

interface AllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscription: Subscription;
    onSave: () => void;
}

interface Project {
    id: string;
    name: string;
}

interface AllocationRow {
    project_id: string;
    percentage: number;
    amount: number;
}

export default function AllocationModal({ isOpen, onClose, subscription, onSave }: AllocationModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [allocations, setAllocations] = useState<AllocationRow[]>([]);
    const [existingAllocations, setExistingAllocations] = useState<ExpenseAllocation[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchExistingAllocations();
        }
    }, [isOpen, subscription]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .eq('tenant_id', profile?.tenant_id)
                .order('name');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchExistingAllocations = async () => {
        try {
            const { data, error } = await supabase
                .from('expense_allocations')
                .select('*')
                .eq('subscription_id', subscription.id);

            if (error) throw error;

            setExistingAllocations(data || []);

            // Convert to allocation rows
            const rows = (data || []).map((alloc: ExpenseAllocation) => ({
                project_id: alloc.project_id,
                percentage: alloc.allocation_percentage,
                amount: alloc.allocated_amount
            }));

            setAllocations(rows.length > 0 ? rows : [{ project_id: '', percentage: 0, amount: 0 }]);
        } catch (error) {
            console.error('Error fetching allocations:', error);
            setAllocations([{ project_id: '', percentage: 0, amount: 0 }]);
        }
    };

    const calculateMonthlyAmount = () => {
        if (subscription.billing_frequency === 'monthly') return subscription.amount;
        if (subscription.billing_frequency === 'annual') return subscription.amount / 12;
        if (subscription.billing_frequency === 'quarterly') return subscription.amount / 3;
        return subscription.amount;
    };

    const monthlyAmount = calculateMonthlyAmount();

    const addAllocation = () => {
        setAllocations([...allocations, { project_id: '', percentage: 0, amount: 0 }]);
    };

    const removeAllocation = (index: number) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const updateAllocation = (index: number, field: 'project_id' | 'percentage', value: string | number) => {
        const newAllocations = [...allocations];

        if (field === 'project_id') {
            newAllocations[index].project_id = value as string;
        } else if (field === 'percentage') {
            const percentage = parseFloat(value as string) || 0;
            newAllocations[index].percentage = percentage;
            newAllocations[index].amount = (monthlyAmount * percentage) / 100;
        }

        setAllocations(newAllocations);
    };

    const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    const totalAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate
            if (totalPercentage > 100) {
                alert('El total de porcentajes no puede exceder el 100%');
                setLoading(false);
                return;
            }

            // Delete existing allocations
            if (existingAllocations.length > 0) {
                const { error: deleteError } = await supabase
                    .from('expense_allocations')
                    .delete()
                    .eq('subscription_id', subscription.id);

                if (deleteError) throw deleteError;
            }

            // Insert new allocations
            const validAllocations = allocations.filter(alloc => alloc.project_id && alloc.percentage > 0);

            if (validAllocations.length > 0) {
                const dataToInsert = validAllocations.map(alloc => ({
                    tenant_id: profile?.tenant_id,
                    subscription_id: subscription.id,
                    expense_id: null,
                    project_id: alloc.project_id,
                    allocation_percentage: alloc.percentage,
                    allocated_amount: alloc.amount,
                    created_by: profile?.id
                }));

                const { error: insertError } = await supabase
                    .from('expense_allocations')
                    .insert(dataToInsert);

                if (insertError) throw insertError;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving allocations:', error);
            alert('Error al guardar la distribución');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-slate-700 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <PieChart className="text-purple-400" size={28} />
                            Distribuir Gasto
                        </h2>
                        <p className="text-slate-400 mt-1">
                            {subscription.name} - ${monthlyAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}/mes
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
                    {/* Summary */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Monto Mensual</p>
                                <p className="text-lg font-bold text-white">
                                    ${monthlyAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Total Asignado</p>
                                <p className={cn(
                                    "text-lg font-bold",
                                    totalPercentage > 100 ? "text-red-400" : "text-emerald-400"
                                )}>
                                    {totalPercentage.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Monto Asignado</p>
                                <p className="text-lg font-bold text-blue-400">
                                    ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300",
                                        totalPercentage > 100
                                            ? "bg-gradient-to-r from-red-600 to-rose-600"
                                            : "bg-gradient-to-r from-purple-600 to-blue-600"
                                    )}
                                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Allocations */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300">
                                Distribución por Proyecto
                            </label>
                            <button
                                type="button"
                                onClick={addAllocation}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Agregar
                            </button>
                        </div>

                        {allocations.map((allocation, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                {/* Project Select */}
                                <div className="flex-1">
                                    <select
                                        value={allocation.project_id}
                                        onChange={(e) => updateAllocation(index, 'project_id', e.target.value)}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    >
                                        <option value="">Seleccionar proyecto...</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Percentage Input */}
                                <div className="w-32">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={allocation.percentage || ''}
                                            onChange={(e) => updateAllocation(index, 'percentage', e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 pr-8 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                                    </div>
                                </div>

                                {/* Amount Display */}
                                <div className="w-40">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm">
                                        ${allocation.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Delete Button */}
                                {allocations.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAllocation(index)}
                                        className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Warning */}
                    {totalPercentage > 100 && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-sm text-red-400">
                                ⚠️ El total de porcentajes ({totalPercentage.toFixed(1)}%) excede el 100%
                            </p>
                        </div>
                    )}

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
                            disabled={loading || totalPercentage > 100}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold shadow-xl shadow-purple-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Guardar Distribución'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
