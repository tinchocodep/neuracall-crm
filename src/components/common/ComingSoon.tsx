import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

export default function ComingSoon({ title, description = "Próximamente en Neuracall v3", icon: Icon }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/10 border border-slate-800">
                {Icon ? (
                    <Icon size={40} className="text-blue-500" />
                ) : (
                    <span className="text-4xl">🚧</span>
                )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
            <p className="text-slate-400 max-w-md text-lg">{description}</p>

            <div className="mt-8 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
                En desarrollo activo
            </div>
        </div>
    );
}
