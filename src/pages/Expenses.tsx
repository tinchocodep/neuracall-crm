import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    CreditCard,
    Zap,
    Server,
    Code,
    Package,
    Eye,
    Edit,
    Trash2,
    Play,
    Pause,
    FolderKanban,
    PieChart
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Subscription, Expense, ExpenseAllocation } from '../types/crm';

interface SubscriptionWithAllocations extends Subscription {
    allocations?: ExpenseAllocation[];
}

interface ProjectCostSummary {
    project_id: string;
    project_name: string;
    total_revenue: number;
    total_expenses: number;
    total_earnings: number;
    net_margin: number;
    cost_recovery_percentage: number;
}

export default function Expenses() {
    const { profile } = useAuth();
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithAllocations[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [projectSummaries, setProjectSummaries] = useState<ProjectCostSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [viewMode, setViewMode] = useState<'subscriptions' | 'expenses' | 'projects'>('subscriptions');

    useEffect(() => {
        fetchData();
    }, [profile, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewMode === 'subscriptions') {
                await fetchSubscriptions();
            } else if (viewMode === 'expenses') {
                await fetchExpenses();
            } else {
                await fetchProjectSummaries();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            let query = supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch allocations for each subscription
            const subsWithAllocations = await Promise.all(
                (data || []).map(async (sub: Subscription) => {
                    const { data: allocations } = await supabase
                        .from('expense_allocations')
                        .select('*')
                        .eq('subscription_id', sub.id);

                    return {
                        ...sub,
                        allocations: allocations || []
                    };
                })
            );

            setSubscriptions(subsWithAllocations);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            let query = supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            setExpenses(data || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const fetchProjectSummaries = async () => {
        try {
            // Fetch all projects
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name')
                .eq('tenant_id', profile?.tenant_id);

            if (!projects) return;

            // Calculate summaries for each project
            const summaries = await Promise.all(
                projects.map(async (project: { id: string; name: string }) => {
                    // Get total revenue from invoices
                    const { data: invoices } = await supabase
                        .from('invoices')
                        .select('paid_amount')
                        .eq('project_id', project.id);

                    const total_revenue = (invoices || []).reduce((sum: number, inv: any) => sum + inv.paid_amount, 0);

                    // Get total expenses allocated to this project
                    const { data: allocations } = await supabase
                        .from('expense_allocations')
                        .select('allocated_amount')
                        .eq('project_id', project.id);

                    const total_expenses = (allocations || []).reduce((sum: number, alloc: any) => sum + alloc.allocated_amount, 0);

                    // Get total earnings (what we pay to users)
                    const { data: earnings } = await supabase
                        .from('user_earnings')
                        .select('amount')
                        .eq('project_id', project.id)
                        .in('status', ['approved', 'paid']);

                    const total_earnings = (earnings || []).reduce((sum: number, earn: any) => sum + earn.amount, 0);

                    const net_margin = total_revenue - total_expenses - total_earnings;
                    const total_costs = total_expenses + total_earnings;
                    const cost_recovery_percentage = total_revenue > 0 ? (total_costs / total_revenue) * 100 : 0;

                    return {
                        project_id: project.id,
                        project_name: project.name,
                        total_revenue,
                        total_expenses,
                        total_earnings,
                        net_margin,
                        cost_recovery_percentage
                    };
                })
            );

            setProjectSummaries(summaries);
        } catch (error) {
            console.error('Error fetching project summaries:', error);
        }
    };

    const getCategoryConfig = (category: string) => {
        const configs = {
            ai_engine: {
                label: 'Motor IA',
                icon: Zap,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20'
            },
            infrastructure: {
                label: 'Infraestructura',
                icon: Server,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20'
            },
            software: {
                label: 'Software',
                icon: Code,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20'
            },
            other: {
                label: 'Otro',
                icon: Package,
                color: 'text-slate-400',
                bg: 'bg-slate-500/10',
                border: 'border-slate-500/20'
            }
        };
        return configs[category as keyof typeof configs] || configs.other;
    };

    const getFrequencyLabel = (frequency: string) => {
        const labels = {
            monthly: 'Mensual',
            annual: 'Anual',
            quarterly: 'Trimestral'
        };
        return labels[frequency as keyof typeof labels] || frequency;
    };

    const calculateMonthlyTotal = () => {
        return subscriptions
            .filter(sub => sub.status === 'active')
            .reduce((sum, sub) => {
                if (sub.billing_frequency === 'monthly') return sum + sub.amount;
                if (sub.billing_frequency === 'annual') return sum + (sub.amount / 12);
                if (sub.billing_frequency === 'quarterly') return sum + (sub.amount / 3);
                return sum;
            }, 0);
    };

    const stats = {
        monthlyTotal: calculateMonthlyTotal(),
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        projectsWithCosts: projectSummaries.filter(p => p.total_expenses > 0).length
    };

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.provider?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Gastos</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona suscripciones y distribución de costos
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {/* TODO: Open subscription modal */ }}
                        className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl font-semibold shadow-xl shadow-purple-500/30 transition-all duration-300 active:scale-95"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Nueva Suscripción</span>
                    </button>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-700">
                <button
                    onClick={() => setViewMode('subscriptions')}
                    className={cn(
                        "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                        viewMode === 'subscriptions'
                            ? "bg-purple-600 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                >
                    <CreditCard size={18} className="inline mr-2" />
                    Suscripciones
                </button>
                <button
                    onClick={() => setViewMode('expenses')}
                    className={cn(
                        "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                        viewMode === 'expenses'
                            ? "bg-purple-600 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                >
                    <DollarSign size={18} className="inline mr-2" />
                    Gastos
                </button>
                <button
                    onClick={() => setViewMode('projects')}
                    className={cn(
                        "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                        viewMode === 'projects'
                            ? "bg-purple-600 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                >
                    <PieChart size={18} className="inline mr-2" />
                    Por Proyecto
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6 group hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar className="text-purple-400" size={24} />
                            </div>
                            <TrendingUp className="text-purple-400/50" size={20} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Gasto Mensual</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.monthlyTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6 group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CreditCard className="text-blue-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Suscripciones Activas</p>
                        <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 group hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="text-amber-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Total Gastos</p>
                        <p className="text-2xl font-bold text-white">
                            ${stats.totalExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FolderKanban className="text-emerald-400" size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Proyectos con Costos</p>
                        <p className="text-2xl font-bold text-white">{stats.projectsWithCosts}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {viewMode === 'subscriptions' && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar suscripciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); fetchSubscriptions(); }}
                        className="bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activas</option>
                        <option value="paused">Pausadas</option>
                        <option value="cancelled">Canceladas</option>
                    </select>
                </div>
            )}

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : viewMode === 'subscriptions' ? (
                    filteredSubscriptions.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                            <CreditCard size={48} className="text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-300">No hay suscripciones</h3>
                            <p className="text-slate-500 mt-2">Crea tu primera suscripción para comenzar</p>
                        </div>
                    ) : (
                        filteredSubscriptions.map((subscription) => {
                            const categoryConfig = getCategoryConfig(subscription.category);
                            const CategoryIcon = categoryConfig.icon;
                            const totalAllocated = (subscription.allocations || []).reduce((sum, a) => sum + a.allocation_percentage, 0);

                            return (
                                <div
                                    key={subscription.id}
                                    className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {subscription.name}
                                                    </h3>

                                                    {/* Category Badge */}
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                                                        categoryConfig.color,
                                                        categoryConfig.bg,
                                                        categoryConfig.border
                                                    )}>
                                                        <CategoryIcon size={12} />
                                                        {categoryConfig.label}
                                                    </span>

                                                    {/* Status Badge */}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-xs font-medium",
                                                        subscription.status === 'active' && "bg-emerald-500/10 text-emerald-400",
                                                        subscription.status === 'paused' && "bg-amber-500/10 text-amber-400",
                                                        subscription.status === 'cancelled' && "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {subscription.status === 'active' && '● Activa'}
                                                        {subscription.status === 'paused' && '⏸ Pausada'}
                                                        {subscription.status === 'cancelled' && '✕ Cancelada'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    {subscription.provider && (
                                                        <span>{subscription.provider}</span>
                                                    )}
                                                    <span>{getFrequencyLabel(subscription.billing_frequency)}</span>
                                                    {subscription.next_billing_date && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={14} />
                                                            Próximo: {new Date(subscription.next_billing_date).toLocaleDateString('es-AR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-purple-400">
                                                    ${subscription.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {subscription.currency} / {getFrequencyLabel(subscription.billing_frequency)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Allocation Progress */}
                                        {(subscription.allocations || []).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-slate-400">Distribución a proyectos:</span>
                                                    <span className="text-xs text-slate-300 font-medium">
                                                        {totalAllocated.toFixed(0)}% asignado
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                                                        style={{ width: `${Math.min(totalAllocated, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">
                                                <Eye size={16} />
                                                Ver Distribución
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">
                                                <Edit size={16} />
                                                Editar
                                            </button>
                                            {subscription.status === 'active' ? (
                                                <button className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors text-sm">
                                                    <Pause size={16} />
                                                </button>
                                            ) : subscription.status === 'paused' ? (
                                                <button className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors text-sm">
                                                    <Play size={16} />
                                                </button>
                                            ) : null}
                                            <button className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors text-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : viewMode === 'projects' ? (
                    projectSummaries.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                            <FolderKanban size={48} className="text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-300">No hay proyectos con costos</h3>
                        </div>
                    ) : (
                        projectSummaries.map((summary) => {
                            const isProfit = summary.net_margin > 0;
                            const recoveryColor = summary.cost_recovery_percentage <= 50 ? 'text-emerald-400' :
                                summary.cost_recovery_percentage <= 80 ? 'text-amber-400' : 'text-red-400';

                            return (
                                <div
                                    key={summary.project_id}
                                    className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:border-purple-500/50"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    {summary.project_name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                                                        isProfit ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {isProfit ? 'Rentable' : 'En Pérdida'}
                                                    </span>
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-medium",
                                                        recoveryColor,
                                                        "bg-slate-700/50"
                                                    )}>
                                                        {summary.cost_recovery_percentage.toFixed(1)}% recuperación
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 mb-1">Margen Neto</p>
                                                <p className={cn(
                                                    "text-2xl font-bold",
                                                    isProfit ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    ${summary.net_margin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Ingresos</p>
                                                <p className="text-lg font-bold text-blue-400">
                                                    ${summary.total_revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Gastos</p>
                                                <p className="text-lg font-bold text-amber-400">
                                                    ${summary.total_expenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Personal</p>
                                                <p className="text-lg font-bold text-purple-400">
                                                    ${summary.total_earnings.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <DollarSign size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">Vista de gastos en desarrollo</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
