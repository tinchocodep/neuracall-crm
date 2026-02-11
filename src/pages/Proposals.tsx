import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, MessageSquare, ExternalLink, DollarSign, Calendar, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Opportunity } from '../types/crm';
import ProposalActionModal from '../components/proposals/ProposalActionModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProposalWithClient extends Opportunity {
    client?: {
        name: string;
    };
}

export default function Proposals() {
    const [proposals, setProposals] = useState<ProposalWithClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
    const [selectedProposal, setSelectedProposal] = useState<ProposalWithClient | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'accept' | 'reject' | 'negotiate'>('accept');

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('opportunities')
                .select('*, client:clients(name)')
                .not('proposal_pdf_url', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProposals(data || []);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (proposal: ProposalWithClient, action: 'accept' | 'reject' | 'negotiate') => {
        setSelectedProposal(proposal);
        setActionType(action);
        setActionModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            'new': { label: 'Pendiente', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            'proposal': { label: 'En Propuesta', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            'negotiation': { label: 'En Negociación', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
            'closed_won': { label: 'Aceptado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
            'closed_lost': { label: 'Rechazado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
        };
        const badge = badges[status as keyof typeof badges] || badges.new;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const filteredProposals = proposals.filter(p => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'pending') return ['new', 'proposal', 'qualification', 'visit'].includes(p.status);
        if (filterStatus === 'accepted') return p.status === 'closed_won';
        if (filterStatus === 'rejected') return p.status === 'closed_lost';
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Cargando presupuestos...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Presupuestos</h1>
                        <p className="text-slate-400">Gestiona las propuestas económicas de tus oportunidades</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todos ({proposals.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'pending'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Pendientes ({proposals.filter(p => ['new', 'proposal', 'qualification', 'visit'].includes(p.status)).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('accepted')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'accepted'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Aceptados ({proposals.filter(p => p.status === 'closed_won').length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'rejected'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Rechazados ({proposals.filter(p => p.status === 'closed_lost').length})
                    </button>
                </div>
            </div>

            {/* Proposals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                {filteredProposals.map(proposal => (
                    <div
                        key={proposal.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <FileText className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white line-clamp-1">{proposal.title}</h3>
                                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                        <Building2 size={14} />
                                        {(proposal as any).client?.name || 'Sin cliente'}
                                    </p>
                                </div>
                            </div>
                            {getStatusBadge(proposal.status)}
                        </div>

                        {/* Pricing Info */}
                        <div className="space-y-3 mb-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Fee Instalación</span>
                                <span className="font-semibold text-white">
                                    ${Number(proposal.setup_fee || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Fee Mensual</span>
                                <span className="font-semibold text-white">
                                    ${Number(proposal.monthly_fee || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                <span className="text-sm text-slate-400">Valor Total</span>
                                <span className="font-bold text-blue-400">
                                    ${Number(proposal.value || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* PDF Link */}
                        {proposal.proposal_pdf_url && (
                            <a
                                href={proposal.proposal_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors"
                            >
                                <ExternalLink size={16} />
                                Ver PDF del Presupuesto
                            </a>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                            {proposal.expected_close_date && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {format(new Date(proposal.expected_close_date), 'dd MMM yyyy', { locale: es })}
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <DollarSign size={12} />
                                {proposal.probability}% prob.
                            </div>
                        </div>

                        {/* Actions */}
                        {!['closed_won', 'closed_lost'].includes(proposal.status) && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(proposal, 'accept')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <CheckCircle size={16} />
                                    Aceptar
                                </button>
                                <button
                                    onClick={() => handleAction(proposal, 'negotiate')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <MessageSquare size={16} />
                                    Negociar
                                </button>
                                <button
                                    onClick={() => handleAction(proposal, 'reject')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <XCircle size={16} />
                                    Rechazar
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filteredProposals.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay presupuestos</p>
                        <p className="text-sm">Los presupuestos con PDF aparecerán aquí</p>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {selectedProposal && (
                <ProposalActionModal
                    isOpen={actionModalOpen}
                    onClose={() => {
                        setActionModalOpen(false);
                        setSelectedProposal(null);
                    }}
                    proposal={selectedProposal}
                    actionType={actionType}
                    onSuccess={() => {
                        fetchProposals();
                        setActionModalOpen(false);
                        setSelectedProposal(null);
                    }}
                />
            )}
        </div>
    );
}
