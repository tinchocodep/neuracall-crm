import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    DollarSign,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Brain
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        description: 'Vista general de métricas y KPIs'
    },
    {
        label: 'CRM',
        icon: Users,
        path: '/crm',
        description: 'Gestión de relaciones con clientes',
        subItems: [
            {
                label: 'Clientes',
                path: '/crm/clients',
                description: 'Empresas que ya son clientes activos'
            },
            {
                label: 'Contactos',
                path: '/crm/contacts',
                description: 'Personas de contacto en empresas'
            },
            {
                label: 'Prospectos',
                path: '/crm/prospects',
                description: 'Empresas potenciales en proceso de captación'
            },
            {
                label: 'Oportunidades',
                path: '/crm/opportunities',
                description: 'Proyectos de IA en negociación'
            },
        ]
    },
    {
        label: 'Proyectos IA',
        icon: Brain,
        path: '/ai-projects',
        description: 'Gestión de proyectos de inteligencia artificial',
        subItems: [
            { label: 'En Desarrollo', path: '/ai-projects/active', description: 'Proyectos activos' },
            { label: 'Completados', path: '/ai-projects/completed', description: 'Proyectos finalizados' },
        ]
    },
    {
        label: 'Ventas',
        icon: FileText,
        path: '/sales',
        description: 'Cotizaciones y presupuestos',
        subItems: [
            { label: 'Cotizador', path: '/sales/quotes', description: 'Generar cotizaciones' },
            { label: 'Presupuesto', path: '/sales/budget', description: 'Control presupuestario' },
        ]
    },
    {
        label: 'Operaciones',
        icon: Briefcase,
        path: '/operations',
        description: 'Gestión operativa diaria',
        subItems: [
            { label: 'Tareas', path: '/operations/tasks', description: 'Gestión de tareas' },
            { label: 'Calendario', path: '/operations/calendar', description: 'Agenda y eventos' },
        ]
    },
    {
        label: 'Finanzas',
        icon: DollarSign,
        path: '/finance',
        description: 'Control financiero y tesorería',
        subItems: [
            { label: 'Tesorería', path: '/finance/treasury', description: 'Flujo de caja' },
            { label: 'Gastos', path: '/finance/expenses', description: 'Control de gastos' },
            { label: 'Sueldos', path: '/finance/salaries', description: 'Nómina del equipo' },
            { label: 'Cajas Chicas', path: '/finance/petty-cash', description: 'Gastos menores' },
        ]
    }
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<string[]>(['CRM']);
    const location = useLocation();

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
        );
    };

    return (
        <aside className={cn(
            "bg-gradient-to-b from-[#0F172A] to-[#1E293B] border-r border-border/30 h-screen transition-all duration-300 flex flex-col fixed z-20 md:relative shadow-2xl",
            isOpen ? "w-64" : "w-20"
        )}>
            {/* Logo Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 h-16 bg-black/20">
                <div className={cn("flex items-center gap-3 transition-all overflow-hidden", !isOpen && "w-0 opacity-0")}>
                    <img
                        src="/neuracall-logo.svg"
                        alt="Neuracall"
                        className="w-9 h-9 drop-shadow-lg"
                    />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tight">
                            Neuracall
                        </span>
                        <span className="text-[10px] text-blue-400/60 font-medium tracking-wider">
                            AI AGENCY
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white",
                        !isOpen && "mx-auto"
                    )}
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3 no-scrollbar">
                {navItems.map((item) => {
                    const isActive = item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path);

                    const isExpanded = expandedItems.includes(item.label);

                    return (
                        <div key={item.label}>
                            {item.subItems ? (
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => {
                                            if (!isOpen) setIsOpen(true);
                                            toggleExpand(item.label);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                            isActive
                                                ? "text-white bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30"
                                                : "text-white/60 hover:bg-white/5 hover:text-white",
                                            !isOpen && "justify-center px-2"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} className={cn("shrink-0 transition-colors", isActive && "text-blue-400")} />
                                            {isOpen && <span>{item.label}</span>}
                                        </div>
                                        {isOpen && (
                                            <ChevronDown
                                                size={16}
                                                className={cn("transition-transform duration-200 text-white/40", isExpanded ? "rotate-180" : "")}
                                            />
                                        )}
                                    </button>

                                    {/* Submenu */}
                                    <div className={cn(
                                        "grid transition-all duration-300 ease-in-out overflow-hidden",
                                        isOpen && isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                                    )}>
                                        <div className="min-h-0 flex flex-col gap-1 pl-4 border-l-2 border-blue-500/20 ml-6">
                                            {item.subItems.map((sub) => (
                                                <NavLink
                                                    key={sub.path}
                                                    to={sub.path}
                                                    className={({ isActive }) => cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all relative group/sub",
                                                        isActive
                                                            ? "text-blue-400 font-medium bg-blue-500/10 before:absolute before:-left-[17px] before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:rounded-full before:bg-blue-400 before:shadow-lg before:shadow-blue-400/50"
                                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    {sub.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                            : "text-white/60 hover:bg-white/5 hover:text-white",
                                        !isOpen && "justify-center px-2"
                                    )}
                                >
                                    <item.icon size={20} className="shrink-0" />
                                    {isOpen && <span>{item.label}</span>}
                                </NavLink>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
                        MC
                    </div>
                    {isOpen && (
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold truncate text-white">Martin Cabrera</p>
                            <p className="text-xs text-blue-400/70 truncate">Founder & CEO</p>
                        </div>
                    )}
                    {isOpen && (
                        <button className="text-white/50 hover:text-red-400 transition-colors">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
