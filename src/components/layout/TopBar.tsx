import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function TopBar() {
    const [isDark, setIsDark] = React.useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, signOut } = useAuth();

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const handleLogout = async () => {
        await signOut();
    };

    const getUserInitials = () => {
        if (!user?.email) return 'U';
        const name = user.user_metadata?.full_name || user.email;
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserName = () => {
        return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
    };

    return (
        <header className="h-16 border-b border-border/40 bg-background/80 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar clientes, prospectos, tareas..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="hidden md:flex items-center gap-3 pl-4 border-l border-border hover:bg-accent/50 rounded-lg px-3 py-2 transition-colors"
                    >
                        <div className="text-right">
                            <p className="text-sm font-medium leading-none">{getUserName()}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                            {getUserInitials()}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden">
                                <div className="p-3 border-b border-border/30">
                                    <p className="text-sm font-medium text-foreground">{getUserName()}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/50 transition-colors flex items-center gap-2">
                                        <User size={16} />
                                        Mi perfil
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/50 transition-colors flex items-center gap-2">
                                        <Settings size={16} />
                                        Configuración
                                    </button>
                                </div>
                                <div className="border-t border-border/30 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
