import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    MoreHorizontal,
    Phone,
    Mail,
    MapPin,
    Building2,
    Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    document_number: string;
    status: string;
    created_at: string;
    companies?: { id: string, name: string }[];
}

export default function Clients() {
    const { profile } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
    }, [profile]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            console.log('Fetching clients...');
            let query = supabase
                .from('clients')
                .select(`
                    *,
                    companies:client_companies(
                        company:companies(id, name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching clients:', error);
                throw error;
            }

            setClients(data || []);
        } catch (error) {
            console.error('Error in fetchClients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona tu cartera de clientes y empresas.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/clients/new')}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-800 flex items-center gap-2 max-w-md w-full">
                <Search size={20} className="text-slate-500 ml-3 shrink-0" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 w-full p-2 outline-none"
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No hay clientes aún</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Comienza agregando tu primer cliente para ver la magia de Neuracall.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 hover:border-blue-500/30 rounded-2xl p-5 transition-all hover:bg-slate-800/60 group cursor-pointer relative overflow-hidden"
                            onClick={() => console.log('Open client', client.id)}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-bold text-lg border border-white/5 shrink-0">
                                    {client.first_name?.[0]}{client.last_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition-colors">
                                        {client.first_name} {client.last_name}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Building2 size={12} />
                                        {client.document_number || 'Sin CUIT/DNI'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <Mail size={16} className="text-slate-600 shrink-0" />
                                    <span className="truncate">{client.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <Phone size={16} className="text-slate-600 shrink-0" />
                                    <span>{client.phone || 'No phone'}</span>
                                </div>
                                {client.city && (
                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                        <MapPin size={16} className="text-slate-600 shrink-0" />
                                        <span>{client.city}</span>
                                    </div>
                                )}
                            </div>

                            {/* Status and Date */}
                            <div className="mt-6 flex items-center justify-between">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                                    client.status === 'active'
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 border-slate-700"
                                )}>
                                    {client.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className="text-xs text-slate-600">
                                    {new Date(client.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
