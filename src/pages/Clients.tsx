import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    Phone,
    Mail,
    MapPin,
    Building2,
    Users,
    CheckCircle,
    Edit,
    Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import ClientModal from '../components/clients/ClientModal';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    company_name: string;
    status: string;
    created_at: string;
}

export default function Clients() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'prospect' | 'active'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
    const [convertMode, setConvertMode] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [profile]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error in fetchClients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewClient = () => {
        setSelectedClient(undefined);
        setConvertMode(false);
        setModalOpen(true);
    };

    const handleEditClient = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedClient(client);
        setConvertMode(false);
        setModalOpen(true);
    };

    const handleConvertToClient = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedClient(client);
        setConvertMode(true);
        setModalOpen(true);
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'prospect' && client.status === 'prospect') ||
            (filterStatus === 'active' && client.status === 'active');

        return matchesSearch && matchesStatus;
    });

    const prospectCount = clients.filter(c => c.status === 'prospect').length;
    const activeCount = clients.filter(c => c.status === 'active').length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona tu cartera de clientes y prospectos.
                    </p>
                </div>

                <button
                    onClick={handleNewClient}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todos ({clients.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('prospect')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'prospect'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Prospectos ({prospectCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'active'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Activos ({activeCount})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-800 flex items-center gap-2 flex-1 max-w-md">
                    <Search size={20} className="text-slate-500 ml-3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, empresa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 w-full p-2 outline-none"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No hay clientes</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery ? 'No se encontraron resultados' : 'Comienza agregando tu primer cliente'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-900/10 group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full"
                        >
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/clients/${client.id}`);
                                    }}
                                    className="p-1.5 bg-slate-900/80 hover:bg-purple-600 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-purple-500"
                                    title="Ver Ficha 360"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleEditClient(client, e)}
                                    className="p-1.5 bg-slate-900/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                {client.status === 'prospect' && (
                                    <button
                                        onClick={(e) => handleConvertToClient(client, e)}
                                        className="p-1.5 bg-slate-900/80 hover:bg-green-600 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-green-500"
                                        title="Convertir a Cliente"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                            </div>

                            <div>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border border-white/10 shrink-0 shadow-sm">
                                        {client.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="pr-10">
                                        <h3
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/clients/${client.id}`);
                                            }}
                                            className="font-semibold text-base text-slate-100 hover:text-purple-400 transition-colors line-clamp-1 cursor-pointer"
                                            title={`${client.name} - Click para ver Ficha 360`}
                                        >
                                            {client.name}
                                        </h3>
                                        {client.company_name && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5" title={client.company_name}>
                                                <Building2 size={10} />
                                                <span className="line-clamp-1">{client.company_name}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Mail size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate" title={client.email}>{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Phone size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate">{client.phone}</span>
                                        </div>
                                    )}
                                    {client.city && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MapPin size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate">{client.city}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                                    client.status === 'active'
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : client.status === 'prospect'
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            : "bg-slate-700/50 text-slate-400 border border-slate-600"
                                )}>
                                    {client.status === 'active' ? 'Activo' :
                                        client.status === 'prospect' ? 'Prospecto' :
                                            client.status === 'lead' ? 'Lead' : 'Inactivo'}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {new Date(client.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Client Modal */}
            <ClientModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedClient(undefined);
                    setConvertMode(false);
                }}
                onSuccess={() => {
                    fetchClients();
                    setModalOpen(false);
                    setSelectedClient(undefined);
                    setConvertMode(false);
                }}
                client={selectedClient}
                convertFromProspect={convertMode}
            />
        </div>
    );
}
