import { useState, useEffect } from 'react';
import {
    Search, Plus, Filter, MoreVertical, Mail, Phone, Building2,
    MapPin, Tag, Calendar, DollarSign, User, Edit, Trash2, Eye,
    TrendingUp, Users, Briefcase, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
    source: string;
    tags: string[];
    assigned_to: string | null;
    last_contact_date: string | null;
    next_follow_up: string | null;
    lifetime_value: number;
    created_at: string;
    companies?: ClientCompany[];
    contacts?: ClientContact[];
}

interface ClientCompany {
    id: string;
    legal_name: string;
    trade_name: string;
    tax_id: string;
    website: string;
    industry: string;
    city: string;
    is_primary: boolean;
}

interface ClientContact {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    is_primary: boolean;
}

export default function Clients() {
    const { profile } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (profile?.tenant_id) {
            fetchClients();
        }
    }, [profile]);

    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select(`
        *,
        companies:client_companies(*),
        contacts:client_contacts(*)
      `)
            .eq('tenant_id', profile?.tenant_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching clients:', error);
            return;
        }

        setClients(data || []);
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'lead': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'prospect': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'inactive': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
            case 'churned': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            lead: 'Lead',
            prospect: 'Prospecto',
            active: 'Activo',
            inactive: 'Inactivo',
            churned: 'Perdido'
        };
        return labels[status] || status;
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.companies?.some(c => c.legal_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        prospects: clients.filter(c => c.status === 'prospect').length,
        leads: clients.filter(c => c.status === 'lead').length,
        totalValue: clients.reduce((sum, c) => sum + (c.lifetime_value || 0), 0)
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
                        <p className="text-slate-400">Gestiona tu cartera de clientes y prospectos</p>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30">
                        <Plus className="w-5 h-5" />
                        Nuevo Cliente
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Clientes</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Activos</p>
                                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Prospectos</p>
                                <p className="text-2xl font-bold text-blue-400">{stats.prospects}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Leads</p>
                                <p className="text-2xl font-bold text-yellow-400">{stats.leads}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Valor Total</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    ${(stats.totalValue / 1000).toFixed(0)}K
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-cyan-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="lead">Leads</option>
                        <option value="prospect">Prospectos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                        <option value="churned">Perdidos</option>
                    </select>

                    <button className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => {
                    const primaryCompany = client.companies?.find(c => c.is_primary) || client.companies?.[0];
                    const primaryContact = client.contacts?.find(c => c.is_primary) || client.contacts?.[0];

                    return (
                        <div
                            key={client.id}
                            className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer group"
                            onClick={() => {
                                setSelectedClient(client);
                                setShowModal(true);
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                        {client.name}
                                    </h3>
                                    {primaryCompany && (
                                        <p className="text-sm text-slate-400 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {primaryCompany.legal_name}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status)}`}>
                                    {getStatusLabel(client.status)}
                                </span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        {client.email}
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        {client.phone}
                                    </div>
                                )}
                                {primaryCompany?.city && (
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {primaryCompany.city}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {client.tags && client.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {client.tags.slice(0, 3).map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {client.tags.length > 3 && (
                                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-full">
                                            +{client.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <div className="text-sm">
                                    <p className="text-slate-400 text-xs mb-1">Valor</p>
                                    <p className="text-white font-semibold">
                                        ${(client.lifetime_value || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Building2 className="w-3 h-3" />
                                    {client.companies?.length || 0} empresas
                                    <Users className="w-3 h-3 ml-2" />
                                    {client.contacts?.length || 0} contactos
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredClients.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No se encontraron clientes</h3>
                    <p className="text-slate-400 mb-6">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Intenta ajustar los filtros de búsqueda'
                            : 'Comienza agregando tu primer cliente'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all inline-flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Agregar Cliente
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
