import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    DollarSign,
    Users,
    TrendingUp,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Check,
    X,
    FolderKanban,
    Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

interface UserEarning {
    id: string;
    tenant_id: string;
    project_id: string;
    user_id: string;
    invoice_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    user?: { id: string; full_name: string; email: string };
    project?: { id: string; name: string };
    invoice?: { id: string; invoice_number: string | null };
}

export default function Transactions() {
    const { profile } = useAuth();
    const [transactions, setTransactions] = useState<UserEarning[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTransactions();
    }, [profile]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('user_earnings')
                .select('*')
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch related data
            const transactionsWithRelations = await Promise.all(
                (data || []).map(async (transaction: any) => {
                    const [userRes, projectRes, invoiceRes] = await Promise.all([
                        supabase.from('users').select('id, full_name, email').eq('id', transaction.user_id).single(),
                        transaction.project_id
                            ? supabase.from('projects').select('id, name').eq('id', transaction.project_id).single()
                            : Promise.resolve({ data: null }),
                        transaction.invoice_id
                            ? supabase.from('invoices').select('id, invoice_number').eq('id', transaction.invoice_id).single()
                            : Promise.resolve({ data: null })
                    ]);

                    return {
                        ...transaction,
                        user: userRes.data || undefined,
                        project: projectRes.data || undefined,
                        invoice: invoiceRes.data || undefined
                    };
                })
            );

            setTransactions(transactionsWithRelations);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTransactionStatus = async (transactionId: string, newStatus: 'approved' | 'rejected' | 'paid') => {
        try {
            const { error } = await supabase
                .from('user_earnings')
                .update({ status: newStatus })
                .eq('id', transactionId);

            if (error) throw error;
            fetchTransactions();
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Error al actualizar la transacción');
        }
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            pending: {
                label: 'Pendiente',
                icon: Clock,
                gradient: 'from-amber-500/20 to-orange-500/20',
                border: 'border-amber-500/30',
                text: 'text-amber-400',
                dot: 'bg-amber-400'
            },
            approved: {
                label: 'Aprobada',
                icon: CheckCircle2,
                gradient: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-500/30',
                text: 'text-blue-400',
                dot: 'bg-blue-400'
            },
            paid: {
                label: 'Pagada',
                icon: CheckCircle2,
                gradient: 'from-emerald-500/20 to-green-500/20',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                dot: 'bg-emerald-400'
            },
            rejected: {
                label: 'Rechazada',
                icon: XCircle,
                gradient: 'from-red-500/20 to-rose-500/20',
                border: 'border-red-500/30',
                text: 'text-red-400',
                dot: 'bg-red-400'
            }
        };
        return configs[status as keyof typeof configs] || configs.pending;
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch =
            transaction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.invoice?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
        pending: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
        approved: transactions.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0),
        paid: transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0),
        count: transactions.length
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Transacciones</h1>
                    <p className="text-slate-400 mt-1">
                        Distribución de ganancias por usuario
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6 group hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="text-purple-400" size={24} />
                            </div>
                            <TrendingUp className="text-purple-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Total</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Pendiente */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 group hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="text-amber-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Pendiente</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.pending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Aprobada */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6 group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="text-blue-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Aprobada</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.approved.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Pagada */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="text-emerald-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Pagada</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.paid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por usuario, proyecto o factura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="paid">Pagada</option>
                    <option value="rejected">Rechazada</option>
                </select>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <Users size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No hay transacciones</h3>
                        <p className="text-slate-500 mt-2">
                            {searchTerm || statusFilter !== 'all'
                                ? 'No se encontraron transacciones con los filtros aplicados'
                                : 'Las transacciones se crearán automáticamente al registrar pagos'}
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => {
                        const statusConfig = getStatusConfig(transaction.status);

                        return (
                            <div
                                key={transaction.id}
                                className={cn(
                                    "group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10",
                                    statusConfig.border
                                )}
                            >
                                {/* Animated gradient background on hover */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                    statusConfig.gradient
                                )} />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {transaction.user?.full_name || 'Usuario desconocido'}
                                                </h3>

                                                {/* Status Badge */}
                                                <span className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                                                    statusConfig.text,
                                                    statusConfig.border,
                                                    `bg-gradient-to-r ${statusConfig.gradient}`
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusConfig.dot)} />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Users size={14} />
                                                    {transaction.user?.email}
                                                </span>
                                                {transaction.project && (
                                                    <span className="flex items-center gap-1.5">
                                                        <FolderKanban size={14} />
                                                        {transaction.project.name}
                                                    </span>
                                                )}
                                                {transaction.invoice && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Eye size={14} />
                                                        {transaction.invoice.invoice_number || 'Sin número'}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {new Date(transaction.created_at).toLocaleDateString('es-AR')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-emerald-400">
                                                ${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {transaction.status === 'pending' && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                            <button
                                                onClick={() => updateTransactionStatus(transaction.id, 'approved')}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                            >
                                                <Check size={18} />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => updateTransactionStatus(transaction.id, 'rejected')}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                            >
                                                <X size={18} />
                                                Rechazar
                                            </button>
                                        </div>
                                    )}

                                    {transaction.status === 'approved' && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <button
                                                onClick={() => updateTransactionStatus(transaction.id, 'paid')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600/30 hover:to-green-600/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                            >
                                                <CheckCircle2 size={18} />
                                                Marcar como Pagada
                                            </button>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {transaction.notes && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <p className="text-xs text-slate-500 mb-1">Notas:</p>
                                            <p className="text-sm text-slate-300">{transaction.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
