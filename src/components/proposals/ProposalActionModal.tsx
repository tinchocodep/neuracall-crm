import { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Opportunity } from '../../types/crm';

interface ProposalActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposal: Opportunity;
    actionType: 'accept' | 'reject' | 'negotiate';
    onSuccess: () => void;
}

export default function ProposalActionModal({ isOpen, onClose, proposal, actionType, onSuccess }: ProposalActionModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // For negotiate action
    const [setupFee, setSetupFee] = useState(proposal.setup_fee || 0);
    const [monthlyFee, setMonthlyFee] = useState(proposal.monthly_fee || 0);
    const [newPdfUrl, setNewPdfUrl] = useState(proposal.proposal_pdf_url || '');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let updateData: any = {};

            if (actionType === 'accept') {
                updateData = {
                    status: 'closed_won',
                    probability: 100,
                };
            } else if (actionType === 'reject') {
                updateData = {
                    status: 'closed_lost',
                    probability: 0,
                    loss_reason: notes || 'Presupuesto rechazado',
                };
            } else if (actionType === 'negotiate') {
                updateData = {
                    status: 'negotiation',
                    setup_fee: setupFee,
                    monthly_fee: monthlyFee,
                    proposal_pdf_url: newPdfUrl,
                    value: setupFee + (monthlyFee * 12), // Valor total estimado anual
                };
            }

            const { error: updateError } = await supabase
                .from('opportunities')
                .update(updateData)
                .eq('id', proposal.id);

            if (updateError) throw updateError;

            onSuccess();
        } catch (err: any) {
            console.error('Error updating proposal:', err);
            setError(err.message || 'Error al actualizar el presupuesto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getTitle = () => {
        if (actionType === 'accept') return '✅ Aceptar Presupuesto';
        if (actionType === 'reject') return '❌ Rechazar Presupuesto';
        return '💬 Negociar Presupuesto';
    };

    const getIcon = () => {
        if (actionType === 'accept') return <CheckCircle className="text-green-400" size={24} />;
        if (actionType === 'reject') return <XCircle className="text-red-400" size={24} />;
        return <MessageSquare className="text-yellow-400" size={24} />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-800">
                {/* Header */}
                <div className="border-b border-slate-800 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
                    </div>
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

                    {/* Proposal Info */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2">{proposal.title}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Fee Instalación:</span>
                                <span className="text-white ml-2 font-medium">
                                    ${Number(proposal.setup_fee || 0).toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400">Fee Mensual:</span>
                                <span className="text-white ml-2 font-medium">
                                    ${Number(proposal.monthly_fee || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action-specific fields */}
                    {actionType === 'negotiate' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Nuevo Fee de Instalación ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={setupFee}
                                        onChange={(e) => setSetupFee(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Nuevo Fee Mensual ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={monthlyFee}
                                        onChange={(e) => setMonthlyFee(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nueva URL del PDF</label>
                                <input
                                    type="url"
                                    value={newPdfUrl}
                                    onChange={(e) => setNewPdfUrl(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="https://ejemplo.com/presupuesto-v2.pdf"
                                />
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-400">
                                    💡 El valor total se calculará automáticamente: ${(setupFee + (monthlyFee * 12)).toLocaleString()}
                                </p>
                            </div>
                        </>
                    )}

                    {actionType === 'accept' && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-400">
                                ✅ Al aceptar, la oportunidad se marcará como "Ganado" y la probabilidad será 100%
                            </p>
                        </div>
                    )}

                    {actionType === 'reject' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Motivo del rechazo (opcional)</label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Ej: Precio muy alto, eligieron otra opción..."
                                />
                            </div>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400">
                                    ⚠️ Al rechazar, la oportunidad se marcará como "Perdido"
                                </p>
                            </div>
                        </>
                    )}

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
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${actionType === 'accept'
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : actionType === 'reject'
                                        ? 'bg-red-600 hover:bg-red-500'
                                        : 'bg-yellow-600 hover:bg-yellow-500'
                                } text-white disabled:bg-slate-700 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Procesando...' : actionType === 'accept' ? 'Confirmar Aceptación' : actionType === 'reject' ? 'Confirmar Rechazo' : 'Actualizar Propuesta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
