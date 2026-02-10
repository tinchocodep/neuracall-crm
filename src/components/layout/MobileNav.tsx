import { Home, Users, Briefcase, Settings, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe pt-2 px-6 flex justify-between items-center h-16 md:hidden shadow-lg shadow-black/50">
            <Link to="/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>
                <Home size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Inicio</span>
            </Link>

            <Link to="/clients" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/clients') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>
                <Users size={24} strokeWidth={isActive('/clients') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Clientes</span>
            </Link>

            {/* Botón flotante central "Nueva Acción" */}
            <div className="relative -top-5">
                <button className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-4 rounded-full shadow-lg shadow-blue-500/30 border-4 border-slate-950 hover:scale-105 active:scale-95 transition-transform">
                    <PlusCircle size={28} className="text-white" />
                </button>
            </div>

            <Link to="/opportunities" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/opportunities') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>
                <Briefcase size={24} strokeWidth={isActive('/opportunities') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Oport.</span>
            </Link>

            <Link to="/settings" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/settings') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>
                <Settings size={24} strokeWidth={isActive('/settings') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Ajustes</span>
            </Link>
        </nav>
    );
}
