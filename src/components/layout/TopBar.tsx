import { Bell, Search, User, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface TopBarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export default function TopBar({ toggleSidebar, isSidebarOpen }: TopBarProps) {
    const { profile } = useAuth();
    // Default values in case profile is empty or loading
    const tenantName = profile?.tenant_name || 'Neuracall';
    const userRole = profile?.role === 'admin' ? 'Administrador' : 'Miembro';
    const userName = profile?.full_name?.split(' ')[0] || 'Usuario';
    const userEmail = profile?.email || '';
    const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

    return (
        <header className="h-20 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30 transition-all duration-300">
            {/* Left Section: Tenant Info */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        {tenantName}
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Building2 size={12} />
                        <span className="uppercase tracking-wider">
                            {userRole}
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Global Search (Hidden on mobile) */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
                <Search className="absolute left-3 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Buscar clientes, leads..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-3 md:gap-4">

                {/* Notifications */}
                <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-slate-900"></span>
                </button>

                <div className="w-px h-8 bg-slate-800 mx-1"></div>

                {/* Profile Widget */}
                <div className="flex items-center gap-3 pl-2">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-medium text-slate-200">
                            {userName}
                        </span>
                        <span className="text-xs text-slate-500">
                            {userEmail}
                        </span>
                    </div>

                    <button className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-lg cursor-pointer hover:border-blue-500/50 transition-all group">
                        {profile?.full_name ? (
                            <span className="font-bold text-sm group-hover:text-white">
                                {initial}
                            </span>
                        ) : (
                            <User size={20} className="group-hover:text-white" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
