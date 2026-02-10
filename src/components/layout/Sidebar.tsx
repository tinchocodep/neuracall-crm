import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    ChevronLeft,
    LogOut,
    ChevronDown,
    Building2,
    Wallet,
    Receipt,
    CreditCard,
    Package,
    ArrowLeftRight,
    UserCircle,
    FileText,
    Clock,
    UserCog,
    Contact
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
    icon: any;
    label: string;
    to: string;
    disabled?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { signOut, user } = useAuth();
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Ventas', 'Proyectos', 'Tesorería', 'Inventario', 'RRHH', 'Configuración']);

    // Auto-expand group if active item is inside
    useEffect(() => {
        if (!isOpen) return;

        const groups = [
            { title: 'Ventas', paths: ['/opportunities', '/quotes', '/clients', '/contacts'] },
            { title: 'Proyectos', paths: ['/projects', '/tasks', '/time-tracking'] },
            { title: 'Tesorería', paths: ['/transactions', '/invoices', '/expenses'] },
            { title: 'Inventario', paths: ['/inventory', '/movements'] },
            { title: 'RRHH', paths: ['/employees', '/payroll'] },
            { title: 'Configuración', paths: ['/profile', '/company-settings', '/users'] }
        ];

        const currentGroup = groups.find(g => g.paths.some(p => location.pathname.startsWith(p)));
        if (currentGroup && !expandedGroups.includes(currentGroup.title)) {
            setExpandedGroups(prev => [...prev, currentGroup.title]);
        }
    }, [location.pathname, isOpen]);

    const toggleGroup = (groupTitle: string) => {
        if (!isOpen) {
            setIsOpen(true);
            setExpandedGroups([groupTitle]);
            return;
        }
        setExpandedGroups(prev =>
            prev.includes(groupTitle)
                ? prev.filter(t => t !== groupTitle)
                : [...prev, groupTitle]
        );
    };

    const navGroups: NavGroup[] = [
        {
            title: 'Ventas',
            items: [
                { icon: Briefcase, label: 'Oportunidades', to: '/opportunities' },
                { icon: FileText, label: 'Presupuestos', to: '/quotes' },
                { icon: Users, label: 'Clientes', to: '/clients' },
                { icon: Contact, label: 'Contactos', to: '/contacts' },
            ]
        },
        {
            title: 'Proyectos',
            items: [
                { icon: Building2, label: 'Proyectos', to: '/projects' },
                { icon: FileText, label: 'Tareas', to: '/tasks' },
                { icon: Clock, label: 'Tiempos', to: '/time-tracking' },
            ]
        },
        {
            title: 'Tesorería',
            items: [
                { icon: Wallet, label: 'Transacciones', to: '/transactions' },
                { icon: Receipt, label: 'Facturas', to: '/invoices' },
                { icon: CreditCard, label: 'Gastos', to: '/expenses' },
            ]
        },
        {
            title: 'Inventario',
            items: [
                { icon: Package, label: 'Productos', to: '/inventory' },
                { icon: ArrowLeftRight, label: 'Movimientos', to: '/movements' },
            ]
        },
        {
            title: 'RRHH',
            items: [
                { icon: UserCog, label: 'Empleados', to: '/employees' },
                { icon: FileText, label: 'Nóminas', to: '/payroll' },
            ]
        },
        {
            title: 'Configuración',
            items: [
                { icon: UserCircle, label: 'Perfil', to: '/profile' },
                { icon: Settings, label: 'Empresa', to: '/company-settings' },
                { icon: Users, label: 'Usuarios', to: '/users' },
            ]
        }
    ];

    return (
        <aside
            className={cn(
                "h-screen bg-[#0B1120] border-r border-slate-800 flex flex-col transition-all duration-300 relative z-50",
                isOpen ? "w-72" : "w-20"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-8 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-[#0B1120] transition-colors z-50"
            >
                <ChevronLeft size={14} className={cn("transition-transform", !isOpen && "rotate-180")} />
            </button>

            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center border-b border-slate-800/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 px-4 w-full overflow-hidden relative z-10">
                    {isOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <img src="/logo.png" alt="N" className="w-full h-full object-contain p-1.5" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Neuracall
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-auto">
                                V3
                            </span>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 mx-auto">
                            <img src="/logo.png" alt="N" className="w-full h-full object-contain p-2" />
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {/* Dashboard (Always visible) */}
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative mb-6",
                        isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                    )}
                >
                    <LayoutDashboard size={22} className="shrink-0" />
                    <span className={cn(
                        "whitespace-nowrap font-medium transition-all duration-200",
                        !isOpen && "opacity-0 w-0 overflow-hidden"
                    )}>
                        Dashboard
                    </span>
                </NavLink>

                {/* Groups */}
                <div className="space-y-4">
                    {navGroups.map((group) => (
                        <div key={group.title} className="space-y-1">
                            {isOpen ? (
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    <span>{group.title}</span>
                                    <ChevronDown
                                        size={14}
                                        className={cn(
                                            "transition-transform duration-200",
                                            expandedGroups.includes(group.title) ? "rotate-180" : ""
                                        )}
                                    />
                                </button>
                            ) : (
                                <div className="h-4" /> // Spacer when collapsed
                            )}

                            <div className={cn(
                                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                                "max-h-[500px] opacity-100", // Force show content for debugging if state is messy, or better rely on state. 
                                // Actually, let's keep the logic from the file exactly:
                                isOpen && expandedGroups.includes(group.title) ? "max-h-[500px] opacity-100" : isOpen ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                            )}>
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.label}
                                        to={item.to}
                                        onClick={(e) => item.disabled && e.preventDefault()}
                                        className={({ isActive }) => cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-white/5 text-blue-400"
                                                : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                                            item.disabled && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                "shrink-0 transition-colors",
                                                !isOpen && "mx-auto" // Center icon when collapsed
                                            )}
                                        />
                                        <span className={cn(
                                            "whitespace-nowrap text-sm transition-all duration-200",
                                            !isOpen && "hidden"
                                        )}>
                                            {item.label}
                                        </span>

                                        {/* Active Indicator Line */}
                                        <NavLink to={item.to}>
                                            {({ isActive }) => isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                                            )}
                                        </NavLink>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
                {isOpen ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-800/50">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-slate-300">
                                <UserCircle size={20} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signOut()}
                        className="flex items-center justify-center w-full p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </aside>
    );
}
