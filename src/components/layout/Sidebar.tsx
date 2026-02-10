import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
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
        path: '/proyectos-ia',
        description: 'Gestión de proyectos de inteligencia artificial'
    },
    {
        label: 'Cotizador',
        icon: FileText,
        path: '/cotizador',
        description: 'Sistema de cotizaciones y presupuestos',
        subItems: [
            {
                label: 'Cotizaciones',
                path: '/cotizador/quotes',
                description: 'Crear y gestionar cotizaciones'
            },
            {
                label: 'Pedidos',
                path: '/cotizador/orders',
                description: 'Pedidos confirmados'
            },
            {
                label: 'Remitos',
                path: '/cotizador/receipts',
                description: 'Comprobantes de entrega'
            },
            {
                label: 'Cuenta Corriente',
                path: '/cotizador/current-account',
                description: 'Estado de cuenta de clientes'
            },
            {
                label: 'Stock',
                path: '/cotizador/stock',
                description: 'Inventario de productos'
            },
        ]
    },
    {
        label: 'Finanzas',
        icon: DollarSign,
        path: '/finanzas',
        description: 'Gestión financiera y tesorera',
        subItems: [
            {
                label: 'Tesorera',
                path: '/finanzas/treasury',
                description: 'Flujo de caja y movimientos'
            },
            {
                label: 'Gastos',
                path: '/finanzas/expenses',
                description: 'Control de gastos operativos'
            },
            {
                label: 'Sueldos',
                path: '/finanzas/salaries',
                description: 'Gestión de nómina'
            },
            {
                label: 'Caja Chica',
                path: '/finanzas/petty-cash',
                description: 'Gastos menores y efectivo'
            },
            {
                label: 'Presupuestos',
                path: '/finanzas/budgets',
                description: 'Planificación presupuestaria'
            },
        ]
    },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
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
                        src={import.meta.env.VITE_LOGO_URL || '/neuracall-logo.png'}
                        alt={import.meta.env.VITE_APP_NAME || 'Neuracall'}
                        className="w-9 h-9 drop-shadow-lg"
                    />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tight">
                            {import.meta.env.VITE_APP_NAME || 'Neuracall'}
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
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.label)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                            isActive
                                                ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                "transition-all flex-shrink-0",
                                                isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                            )}
                                        />
                                        <span className={cn(
                                            "font-medium text-sm transition-all flex-1 text-left",
                                            !isOpen && "opacity-0 w-0"
                                        )}>
                                            {item.label}
                                        </span>
                                        {isOpen && (
                                            <ChevronDown
                                                size={16}
                                                className={cn(
                                                    "transition-transform",
                                                    isExpanded && "rotate-180"
                                                )}
                                            />
                                        )}
                                    </button>
                                    {isOpen && isExpanded && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.subItems.map((subItem) => {
                                                const isSubActive = location.pathname === subItem.path;
                                                return (
                                                    <NavLink
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                                                            isSubActive
                                                                ? "bg-blue-500/10 text-blue-400 font-medium"
                                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            isSubActive ? "bg-blue-400" : "bg-slate-600"
                                                        )} />
                                                        {subItem.label}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-all flex-shrink-0",
                                            isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                        )}
                                    />
                                    <span className={cn(
                                        "font-medium text-sm transition-all",
                                        !isOpen && "opacity-0 w-0"
                                    )}>
                                        {item.label}
                                    </span>
                                </NavLink>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/10 bg-black/20">
                <button
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-slate-400 hover:text-red-400 hover:bg-red-500/10",
                        !isOpen && "justify-center"
                    )}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    <span className={cn(
                        "font-medium text-sm transition-all",
                        !isOpen && "opacity-0 w-0"
                    )}>
                        Cerrar Sesión
                    </span>
                </button>
            </div>
        </aside>
    );
}
