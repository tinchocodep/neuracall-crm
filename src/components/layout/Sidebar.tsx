import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    PieChart,
    ChevronLeft,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { signOut } = useAuth();
    const sidebarRef = useRef<HTMLElement>(null);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
        { icon: Users, label: 'Clientes', to: '/clients' },
        { icon: Briefcase, label: 'Oportunidades', to: '/opportunities' },
        { icon: PieChart, label: 'Reportes', to: '/reports', disabled: true },
        { icon: Settings, label: 'Configuración', to: '/settings' },
    ];

    return (
        <aside
            ref={sidebarRef}
            className={cn(
                "h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 relative z-20",
                isOpen ? "w-64" : "w-20"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-8 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-slate-900 transition-colors z-50"
            >
                <ChevronLeft size={16} className={cn("transition-transform", !isOpen && "rotate-180")} />
            </button>

            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center border-b border-slate-800/50">
                <div className="flex items-center gap-3 px-4 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <span className="text-white font-bold text-xl">N</span>
                    </div>
                    <span className={cn(
                        "font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap transition-opacity duration-200",
                        !isOpen && "opacity-0 hidden"
                    )}>
                        Neuracall
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        onClick={(e) => item.disabled && e.preventDefault()}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                            isActive
                                ? "bg-blue-600/10 text-blue-400 font-medium"
                                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
                            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={22}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                                    )}
                                />
                                <span className={cn(
                                    "whitespace-nowrap transition-all duration-200",
                                    !isOpen && "opacity-0 w-0 translate-x-10 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>
                                {item.disabled && isOpen && (
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                                        PRONTO
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => signOut()}
                    className={cn(
                        "flex items-center gap-3 w-full p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
                        !isOpen && "justify-center"
                    )}
                >
                    <LogOut size={20} />
                    <span className={cn("font-medium whitespace-nowrap", !isOpen && "hidden")}>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
