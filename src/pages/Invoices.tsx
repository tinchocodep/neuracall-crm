import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    FileText,
    DollarSign,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Eye,
    Edit,
    Trash2,
    Receipt,
    CreditCard,
    Building2,
    FolderKanban
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usePermissions } from '../hooks/usePermissions';
import type { Invoice } from '../types/crm';
import InvoiceModal from '../components/invoices/InvoiceModal';
import PaymentModal from '../components/invoices/PaymentModal';

interface InvoiceWithRelations extends Invoice {
    project?: { id: string; name: string };
    client?: { id: string; name: string };
    payments?: any[];
}

export default function Invoices() {
    const { profile } = useAuth();
    const { canViewFinancials } = usePermissions();
    const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | undefined>(undefined);

    useEffect(() => {
        fetchInvoices();
    }, [profile]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('invoices')
                .select('*')
                .order('issue_date', { ascending: false });

            // Solo filtrar por tenant_id si NO es cofounder
            if (profile?.tenant_id && profile?.role !== 'cofounder') {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch related data
            const invoicesWithRelations = await Promise.all(
                (data || []).map(async (invoice: Invoice) => {
                    const [projectRes, clientRes, paymentsRes] = await Promise.all([
                        invoice.project_id
                            ? supabase.from('projects').select('id, name').eq('id', invoice.project_id).single()
                            : Promise.resolve({ data: null }),
                        invoice.client_id
                            ? supabase.from('clients').select('id, name').eq('id', invoice.client_id).single()
                            : Promise.resolve({ data: null }),
                        supabase.from('invoice_payments').select('*').eq('invoice_id', invoice.id)
                    ]);

                    return {
                        ...invoice,
                        project: projectRes.data || undefined,
                        client: clientRes.data || undefined,
                        payments: paymentsRes.data || []
                    };
                })
            );

            setInvoices(invoicesWithRelations);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
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
                glow: 'shadow-amber-500/20',
                dot: 'bg-amber-400'
            },
            partial: {
                label: 'Parcial',
                icon: TrendingUp,
                gradient: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-500/30',
                text: 'text-blue-400',
                glow: 'shadow-blue-500/20',
                dot: 'bg-blue-400'
            },
            paid: {
                label: 'Pagada',
                icon: CheckCircle2,
                gradient: 'from-emerald-500/20 to-green-500/20',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                glow: 'shadow-emerald-500/20',
                dot: 'bg-emerald-400'
            },
            overdue: {
                label: 'Vencida',
                icon: AlertCircle,
                gradient: 'from-red-500/20 to-rose-500/20',
                border: 'border-red-500/30',
                text: 'text-red-400',
                glow: 'shadow-red-500/20',
                dot: 'bg-red-400'
            }
        };
        return configs[status as keyof typeof configs] || configs.pending;
    };

    const getTypeConfig = (type: string) => {
        const configs = {
            installation: {
                label: 'Instalación',
                icon: Building2,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20'
            },
            monthly: {
                label: 'Mensual',
                icon: Calendar,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20'
            },
            other: {
                label: 'Otro',
                icon: FileText,
                color: 'text-slate-400',
                bg: 'bg-slate-500/10',
                border: 'border-slate-500/20'
            }
        };
        return configs[type as keyof typeof configs] || configs.other;
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || invoice.payment_status === statusFilter;
        const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = {
        total: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        paid: invoices.reduce((sum, inv) => sum + inv.paid_amount, 0),
        pending: invoices.reduce((sum, inv) => sum + inv.pending_amount, 0),
        count: invoices.length
    };

    // Access denied for regular users
    if (!canViewFinancials) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="text-red-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
                    <p className="text-slate-400">
                        No tienes permisos para ver información de facturación.
                        Contacta a un administrador si necesitas acceso.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Facturación</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona facturas y pagos de proyectos
                    </p>
                </div>

                <button
                    onClick={() => { setSelectedInvoice(undefined); setModalOpen(true); }}
                    className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-xl font-semibold shadow-xl shadow-blue-500/30 transition-all duration-300 active:scale-95 hover:shadow-2xl hover:shadow-blue-500/40"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nueva Factura</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Facturado */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6 group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="text-blue-400" size={24} />
                            </div>
                            <TrendingUp className="text-blue-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Total Facturado</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Total Cobrado */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="text-emerald-400" size={24} />
                            </div>
                            <TrendingUp className="text-emerald-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Total Cobrado</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.paid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                            <AlertCircle className="text-amber-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Pendiente</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.pending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Total Facturas */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6 group hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="text-purple-400" size={24} />
                            </div>
                            <Receipt className="text-purple-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Total Facturas</p>
                        <p className="text-2xl font-bold text-white">{stats.count}</p>
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
                        placeholder="Buscar por número, cliente o proyecto..."
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
                    <option value="partial">Parcial</option>
                    <option value="paid">Pagada</option>
                    <option value="overdue">Vencida</option>
                </select>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                    <option value="all">Todos los tipos</option>
                    <option value="installation">Instalación</option>
                    <option value="monthly">Mensual</option>
                    <option value="other">Otro</option>
                </select>
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <FileText size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No hay facturas</h3>
                        <p className="text-slate-500 mt-2">
                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'No se encontraron facturas con los filtros aplicados'
                                : 'Crea tu primera factura para comenzar'}
                        </p>
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => {
                        const statusConfig = getStatusConfig(invoice.payment_status);
                        const typeConfig = getTypeConfig(invoice.invoice_type);
                        const TypeIcon = typeConfig.icon;

                        return (
                            <div
                                key={invoice.id}
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
                                                    {invoice.invoice_number || 'Sin número'}
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

                                                {/* Type Badge */}
                                                <span className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                                                    typeConfig.color,
                                                    typeConfig.bg,
                                                    typeConfig.border
                                                )}>
                                                    <TypeIcon size={12} />
                                                    {typeConfig.label}
                                                </span>

                                                {/* Tax Badge */}
                                                <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs">
                                                    {invoice.tax_type === 'with_vat' ? 'Con IVA' : 'Sin IVA'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                {invoice.client && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 size={14} />
                                                        {invoice.client.name}
                                                    </span>
                                                )}
                                                {invoice.project && (
                                                    <span className="flex items-center gap-1.5">
                                                        <FolderKanban size={14} />
                                                        {invoice.project.name}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {new Date(invoice.issue_date).toLocaleDateString('es-AR')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {/* TODO: View invoice */ }}
                                                className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedInvoice(invoice); setModalOpen(true); }}
                                                className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => {/* TODO: Delete invoice */ }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amounts */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-xl">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Total</p>
                                            <p className="text-lg font-bold text-white">
                                                ${invoice.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Pagado</p>
                                            <p className="text-lg font-bold text-emerald-400">
                                                ${invoice.paid_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Pendiente</p>
                                            <p className="text-lg font-bold text-amber-400">
                                                ${invoice.pending_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payments */}
                                    {invoice.payments && invoice.payments.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                                <CreditCard size={14} />
                                                {invoice.payments.length} pago{invoice.payments.length !== 1 ? 's' : ''} registrado{invoice.payments.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}

                                    {/* Register Payment Button */}
                                    {invoice.payment_status !== 'paid' && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => { setSelectedInvoiceForPayment(invoice); setPaymentModalOpen(true); }}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 hover:from-emerald-600/30 hover:to-blue-600/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                            >
                                                <CreditCard size={18} />
                                                <span>Registrar Pago</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedInvoice(undefined); }}
                invoice={selectedInvoice}
                onSave={fetchInvoices}
            />

            {/* Payment Modal */}
            {selectedInvoiceForPayment && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => { setPaymentModalOpen(false); setSelectedInvoiceForPayment(undefined); }}
                    invoice={selectedInvoiceForPayment}
                    onSave={fetchInvoices}
                />
            )}
        </div>
    );
}
