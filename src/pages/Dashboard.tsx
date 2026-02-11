import { useState } from 'react';
import {
    Wallet,
    Building2,
    ArrowUpRight,
    MoreHorizontal,
    Brain,
    Zap,
    Code,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { usePermissions } from '../hooks/usePermissions';
import UpcomingEventsWidget from '../components/dashboard/UpcomingEventsWidget';

const stats = [
    {
        label: 'Proyectos IA Activos',
        value: '12',
        change: '+3 este mes',
        trend: 'up',
        icon: Brain,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        chartColor: '#60a5fa'
    },
    {
        label: 'Ingresos Mensuales',
        value: '$15,000 USD',
        subValue: '$16,050,000 ARS',
        change: '+18.2%',
        trend: 'up',
        icon: Wallet,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        chartColor: '#34d399'
    },
    {
        label: 'Clientes Activos',
        value: '24',
        change: '+5 nuevos',
        trend: 'up',
        icon: Building2,
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        chartColor: '#22d3ee'
    },
    {
        label: 'Oportunidades',
        value: '8',
        change: '$450K pipeline',
        trend: 'up',
        icon: Zap,
        color: 'text-violet-400',
        bg: 'bg-violet-400/10',
        chartColor: '#a78bfa'
    }
];

const chartData = [
    { name: 'Ene', revenue: 65000, projects: 8 },
    { name: 'Feb', revenue: 59000, projects: 7 },
    { name: 'Mar', revenue: 80000, projects: 10 },
    { name: 'Abr', revenue: 81000, projects: 9 },
    { name: 'May', revenue: 95000, projects: 11 },
    { name: 'Jun', revenue: 110000, projects: 12 },
    { name: 'Jul', revenue: 128000, projects: 12 },
];

const recentActivity = [
    {
        type: 'project',
        title: 'Nuevo Proyecto IA',
        description: 'Chatbot con NLP para TechCorp',
        time: 'Hace 2h',
        icon: Brain,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10'
    },
    {
        type: 'client',
        title: 'Cliente Nuevo',
        description: 'InnovateSoft se unió a Neuracall',
        time: 'Hace 5h',
        icon: Building2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
    },
    {
        type: 'opportunity',
        title: 'Oportunidad Caliente',
        description: 'Sistema de recomendación ML - $85K',
        time: 'Hace 1d',
        icon: Zap,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10'
    },
    {
        type: 'code',
        title: 'Deploy Exitoso',
        description: 'API de análisis predictivo v2.1',
        time: 'Hace 2d',
        icon: Code,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10'
    },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-xl">
                <p className="text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground capitalize">{entry.name}:</span>
                        <span className="font-bold font-mono">
                            {entry.name === 'revenue' ? `$${entry.value.toLocaleString()}` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function Dashboard() {
    const { canViewFinancials, isFounder } = usePermissions();
    const [showFinancials, setShowFinancials] = useState(true);

    // Filter stats based on permissions and showFinancials toggle
    const visibleStats = stats.filter(stat => {
        // Regular users can't see financial data
        if (!canViewFinancials && stat.label === 'Ingresos Mensuales') {
            return false;
        }
        // Founder can toggle financial visibility
        if (isFounder && !showFinancials && stat.label === 'Ingresos Mensuales') {
            return false;
        }
        return true;
    });

    return (
        <div className="min-h-full bg-muted/5 pb-12">
            {/* Hero Header con branding Neuracall */}
            <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] pt-12 pb-32 px-6 md:px-10 rounded-br-[60px] md:rounded-br-[80px] shadow-2xl overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                {/* Brain wave pattern */}
                <div className="absolute inset-0 opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-blue-400" />
                        <path d="M0,55 Q25,35 50,55 T100,55" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-cyan-400" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-blue-400" />
                            <h2 className="text-blue-400 font-medium tracking-wide text-sm uppercase">AI-Powered Dashboard</h2>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Martin</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg max-w-xl">
                            Gestiona tus proyectos de IA, clientes y operaciones desde un solo lugar.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex gap-3"
                    >
                        {/* Eye Toggle Button (Only for Founder) */}
                        {isFounder && canViewFinancials && (
                            <button
                                onClick={() => setShowFinancials(!showFinancials)}
                                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors flex items-center gap-2"
                                title={showFinancials ? "Ocultar datos financieros" : "Mostrar datos financieros"}
                            >
                                {showFinancials ? <Eye size={16} /> : <EyeOff size={16} />}
                                {showFinancials ? 'Ocultar $' : 'Mostrar $'}
                            </button>
                        )}
                        <button className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
                            Ver Reportes
                        </button>
                        <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25">
                            + Nuevo Proyecto IA
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Content Overlap */}
            <div className="px-6 md:px-10 -mt-20 relative z-20 max-w-7xl mx-auto space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className="group relative p-6 rounded-2xl bg-card/80 border border-border/50 shadow-lg hover:shadow-xl hover:bg-card/90 transition-all duration-300 hover:scale-[1.02]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-xl transition-all group-hover:scale-110", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
                                    "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                                )}>
                                    <ArrowUpRight size={12} />
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</h3>
                            {stat.subValue && (
                                <p className="text-lg font-semibold text-muted-foreground/80 mt-0.5">{stat.subValue}</p>
                            )}
                            <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>

                            {/* Decorative gradient */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 pointer-events-none overflow-hidden rounded-br-2xl">
                                <div className={cn("w-full h-full", stat.bg, "blur-2xl")} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-2 p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Crecimiento Neuracall</h3>
                                <p className="text-sm text-slate-400 mt-1">Ingresos y proyectos activos</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow shadow-blue-500/50" /> Ingresos
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="w-3 h-3 rounded-full bg-cyan-500 shadow shadow-cyan-500/50" /> Proyectos
                                </div>
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: '#334155', strokeWidth: 2 }}
                                        wrapperStyle={{ outline: 'none' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="projects"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorProjects)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 shadow-sm flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Actividad Reciente</h3>
                            <button className="text-slate-400 hover:text-blue-400 transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-auto pr-2 custom-scrollbar">
                            {recentActivity.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="relative">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110",
                                            item.bg,
                                            "border-slate-800 group-hover:border-blue-500/30"
                                        )}>
                                            <item.icon size={16} className={cn(item.color, "transition-colors")} />
                                        </div>
                                        {i !== recentActivity.length - 1 && (
                                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full bg-slate-800/50 -z-10" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-baseline w-full mb-1">
                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{item.title}</p>
                                            <span className="text-[10px] text-slate-500 font-medium">{item.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 rounded-xl border border-slate-700/50 text-sm font-medium hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                            Ver toda la actividad
                        </button>
                    </motion.div>

                    {/* Upcoming Events Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="md:col-span-2"
                    >
                        <UpcomingEventsWidget />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
