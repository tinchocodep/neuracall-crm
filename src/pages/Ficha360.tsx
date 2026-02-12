import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    Briefcase,
    Target,
    Activity,
    Edit,
    MoreVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import ActivityTimeline from '../components/client/ActivityTimeline';

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    website: string | null;
    industry: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
    created_at: string;
    lifetime_value: number;
}

interface Project {
    id: string;
    name: string;
    status: string;
    setup_fee: number;
    monthly_fee: number;
    start_date: string | null;
}

interface Opportunity {
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    expected_close_date: string | null;
}

interface CalendarEvent {
    id: string;
    title: string;
    event_type: string;
    start_date: string;
    status: string;
    priority: string;
}

interface TimeEntry {
    id: string;
    description: string | null;
    start_time: string;
    duration_minutes: number | null;
    project_id: string | null;
}

export default function Ficha360() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [client, setClient] = useState<Client | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'opportunities' | 'timeline'>('overview');

    useEffect(() => {
        if (id && profile) {
            fetchClientData();
        }
    }, [id, profile]);

    const fetchClientData = async () => {
        if (!id || !profile) return;

        try {
            setLoading(true);

            // Fetch client
            let clientQuery = supabase
                .from('clients')
                .select('*')
                .eq('id', id);

            // Solo filtrar por tenant_id si NO es cofounder
            if (profile.tenant_id && profile.role !== 'cofounder') {
                clientQuery = clientQuery.eq('tenant_id', profile.tenant_id);
            }

            const { data: clientData, error: clientError } = await clientQuery.single();

            if (clientError) throw clientError;
            setClient(clientData);

            // Fetch projects
            let projectsQuery = supabase
                .from('projects')
                .select('*')
                .eq('client_id', id)
                .order('created_at', { ascending: false });

            if (profile.tenant_id && profile.role !== 'cofounder') {
                projectsQuery = projectsQuery.eq('tenant_id', profile.tenant_id);
            }

            const { data: projectsData } = await projectsQuery;
            setProjects(projectsData || []);

            // Fetch opportunities
            let opportunitiesQuery = supabase
                .from('opportunities')
                .select('*')
                .eq('client_id', id)
                .order('created_at', { ascending: false });

            if (profile.tenant_id && profile.role !== 'cofounder') {
                opportunitiesQuery = opportunitiesQuery.eq('tenant_id', profile.tenant_id);
            }

            const { data: opportunitiesData } = await opportunitiesQuery;
            setOpportunities(opportunitiesData || []);

            // Fetch calendar events
            let eventsQuery = supabase
                .from('calendar_events')
                .select('*')
                .eq('client_id', id)
                .order('start_date', { ascending: false })
                .limit(10);

            if (profile.tenant_id && profile.role !== 'cofounder') {
                eventsQuery = eventsQuery.eq('tenant_id', profile.tenant_id);
            }

            const { data: eventsData } = await eventsQuery;
            setEvents(eventsData || []);

            // Fetch time entries from projects
            if (projectsData && projectsData.length > 0) {
                const projectIds = projectsData.map((p: Project) => p.id);
                let timeQuery = supabase
                    .from('time_entries')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('start_time', { ascending: false })
                    .limit(20);

                if (profile.tenant_id && profile.role !== 'cofounder') {
                    timeQuery = timeQuery.eq('tenant_id', profile.tenant_id);
                }

                const { data: timeData } = await timeQuery;
                setTimeEntries(timeData || []);
            }

        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            lead: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            prospect: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            churned: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return colors[status] || colors.active;
    };

    const getProjectStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            onboarding: 'bg-blue-500/20 text-blue-400',
            development: 'bg-purple-500/20 text-purple-400',
            testing: 'bg-yellow-500/20 text-yellow-400',
            deployment: 'bg-orange-500/20 text-orange-400',
            maintenance: 'bg-emerald-500/20 text-emerald-400',
            cancelled: 'bg-red-500/20 text-red-400',
        };
        return colors[status] || colors.onboarding;
    };

    const calculateTotalRevenue = () => {
        return projects.reduce((sum, p) => sum + Number(p.setup_fee) + Number(p.monthly_fee), 0);
    };

    const calculateTotalHours = () => {
        return timeEntries.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Cargando información...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle size={64} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Cliente no encontrado</h2>
                    <button
                        onClick={() => navigate('/clients')}
                        className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                        Volver a Clientes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/clients')}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-1">Ficha 360°</h1>
                    <p className="text-slate-400">Vista completa del cliente</p>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <MoreVertical size={24} />
                </button>
            </div>

            {/* Client Header Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{client.name}</h2>
                                {client.company_name && (
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <Building2 size={16} />
                                        {client.company_name}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-sm font-medium border capitalize",
                                    getStatusColor(client.status)
                                )}>
                                    {client.status}
                                </span>
                                <button
                                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {client.email && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Mail size={16} className="text-slate-500" />
                                    <a href={`mailto:${client.email}`} className="hover:text-purple-400 transition-colors">
                                        {client.email}
                                    </a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Phone size={16} className="text-slate-500" />
                                    <a href={`tel:${client.phone}`} className="hover:text-purple-400 transition-colors">
                                        {client.phone}
                                    </a>
                                </div>
                            )}
                            {client.website && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Globe size={16} className="text-slate-500" />
                                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                                        {client.website}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Location & Industry */}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            {(client.city || client.country) && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{[client.city, client.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {client.industry && (
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} />
                                    <span>{client.industry}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Cliente desde {format(new Date(client.created_at), "MMM yyyy", { locale: es })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <DollarSign className="text-emerald-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-400">Valor Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">${calculateTotalRevenue().toLocaleString()}</p>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Briefcase className="text-blue-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-400">Proyectos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Target className="text-purple-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-400">Oportunidades</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{opportunities.length}</p>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Clock className="text-orange-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-400">Horas Trabajadas</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{calculateTotalHours().toFixed(1)}h</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'overview'
                            ? "text-purple-400 border-purple-400"
                            : "text-slate-400 border-transparent hover:text-white"
                    )}
                >
                    Vista General
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'projects'
                            ? "text-purple-400 border-purple-400"
                            : "text-slate-400 border-transparent hover:text-white"
                    )}
                >
                    Proyectos ({projects.length})
                </button>
                <button
                    onClick={() => setActiveTab('opportunities')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'opportunities'
                            ? "text-purple-400 border-purple-400"
                            : "text-slate-400 border-transparent hover:text-white"
                    )}
                >
                    Oportunidades ({opportunities.length})
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={cn(
                        "px-4 py-2 font-medium transition-colors border-b-2",
                        activeTab === 'timeline'
                            ? "text-purple-400 border-purple-400"
                            : "text-slate-400 border-transparent hover:text-white"
                    )}
                >
                    Timeline
                </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recent Projects */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-400" />
                                Proyectos Recientes
                            </h3>
                            <div className="space-y-3">
                                {projects.slice(0, 3).map(project => (
                                    <div key={project.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-white">{project.name}</h4>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                                getProjectStatusColor(project.status)
                                            )}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <span>${Number(project.setup_fee).toLocaleString()} setup</span>
                                            <span>${Number(project.monthly_fee).toLocaleString()}/mes</span>
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No hay proyectos</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Events */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-purple-400" />
                                Eventos Recientes
                            </h3>
                            <div className="space-y-3">
                                {events.slice(0, 5).map(event => (
                                    <div key={event.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white text-sm mb-1">{event.title}</h4>
                                                <p className="text-xs text-slate-400">
                                                    {format(new Date(event.start_date), "d MMM yyyy, HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                            {event.status === 'completed' && (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No hay eventos</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Todos los Proyectos</h3>
                        <div className="space-y-4">
                            {projects.map(project => (
                                <div key={project.id} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-semibold text-white mb-2">{project.name}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                {project.start_date && (
                                                    <span>Inicio: {format(new Date(project.start_date), "d MMM yyyy", { locale: es })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-sm font-medium capitalize",
                                            getProjectStatusColor(project.status)
                                        )}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1">Setup Fee</p>
                                            <p className="text-lg font-bold text-emerald-400">${Number(project.setup_fee).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1">Mensual</p>
                                            <p className="text-lg font-bold text-blue-400">${Number(project.monthly_fee).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && (
                                <p className="text-center text-slate-500 py-12">No hay proyectos para este cliente</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'opportunities' && (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Todas las Oportunidades</h3>
                        <div className="space-y-4">
                            {opportunities.map(opp => (
                                <div key={opp.id} className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-semibold text-white mb-2">{opp.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                <span>Valor: ${Number(opp.value).toLocaleString()}</span>
                                                <span>Probabilidad: {opp.probability}%</span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium capitalize">
                                            {opp.stage}
                                        </span>
                                    </div>
                                    {opp.expected_close_date && (
                                        <p className="text-sm text-slate-400">
                                            Cierre esperado: {format(new Date(opp.expected_close_date), "d MMM yyyy", { locale: es })}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {opportunities.length === 0 && (
                                <p className="text-center text-slate-500 py-12">No hay oportunidades para este cliente</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-orange-400" />
                            Timeline de Actividad
                        </h3>
                        <div className="space-y-4">
                            {events.map((event, index) => (
                                <div key={event.id} className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-purple-500/20 border-2 border-purple-500 rounded-full flex items-center justify-center">
                                            <Calendar size={16} className="text-purple-400" />
                                        </div>
                                        {index !== events.length - 1 && (
                                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full bg-slate-800" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-white">{event.title}</h4>
                                                {event.status === 'completed' && (
                                                    <CheckCircle2 size={18} className="text-emerald-400" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 mb-2">
                                                {format(new Date(event.start_date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs capitalize">
                                                    {event.event_type.replace('_', ' ')}
                                                </span>
                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs capitalize">
                                                    {event.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <p className="text-center text-slate-500 py-12">No hay actividad registrada</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Activity History Section */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                            <Activity size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Historial de Actividad</h3>
                            <p className="text-sm text-slate-400">Timeline completo de interacciones</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <ActivityTimeline clientId={client.id} />
                </div>
            </div>
        </div>
    );
}
