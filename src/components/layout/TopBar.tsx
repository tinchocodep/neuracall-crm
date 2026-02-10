import React from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';

export function TopBar() {
    const [isDark, setIsDark] = React.useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
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

                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right">
                        <p className="text-sm font-medium leading-none">Martin Gemini</p>
                        <p className="text-xs text-muted-foreground mt-1">CEO</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                        MG
                    </div>
                </div>
            </div>
        </header>
    );
}
