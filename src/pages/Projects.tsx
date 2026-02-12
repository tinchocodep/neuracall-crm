import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    Building2,
    Calendar,
    DollarSign,
    ExternalLink,
    Github,
    Edit,
    CheckCircle2,
    Clock,
    Rocket,
    Settings,
    XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Project } from '../types/crm';
import ProjectModal from '../components/projects/ProjectModal';

interface ProjectWithClient extends Project {
    client?: { id: string; name: string };
}

export default function Projects() {
    const { profile } = useAuth();
    const [projects, setProjects] = useState<ProjectWithClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectWithClient | undefined>(undefined);

    useEffect(() => {
        fetchProjects();
    }, [profile]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('projects')
                .select(`
                    *,
                    client:clients(id, name)
                `)
                .order('created_at', { ascending: false });

            // Solo filtrar por tenant_id si NO es cofounder
            if (profile?.tenant_id && profile?.role !== 'cofounder') {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewProject = () => {
        setSelectedProject(undefined);
        setModalOpen(true);
    };

    const handleEditProject = (project: ProjectWithClient, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedProject(project);
        setModalOpen(true);
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const isActive = ['onboarding', 'development', 'testing', 'deployment'].includes(project.status);
        const isCompleted = ['maintenance', 'cancelled'].includes(project.status);

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && isActive) ||
            (filterStatus === 'completed' && isCompleted);

        return matchesSearch && matchesStatus;
    });

    const activeCount = projects.filter(p => ['onboarding', 'development', 'testing', 'deployment'].includes(p.status)).length;
    const completedCount = projects.filter(p => ['maintenance', 'cancelled'].includes(p.status)).length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'onboarding': return <Clock size={14} />;
            case 'development': return <Settings size={14} className="animate-spin" />;
            case 'testing': return <CheckCircle2 size={14} />;
            case 'deployment': return <Rocket size={14} />;
            case 'maintenance': return <CheckCircle2 size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'onboarding': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'development': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'testing': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'deployment': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'maintenance': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            onboarding: 'Onboarding',
            development: 'Desarrollo',
            testing: 'Testing',
            deployment: 'Deployment',
            maintenance: 'Mantenimiento',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Proyectos</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona tus proyectos activos y finalizados.
                    </p>
                </div>

                <button
                    onClick={handleNewProject}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nuevo Proyecto</span>
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
                        Todos ({projects.length})
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
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'completed'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Finalizados ({completedCount})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-800 flex items-center gap-2 flex-1 max-w-md">
                    <Search size={20} className="text-slate-500 ml-3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cliente, descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 w-full p-2 outline-none"
                    />
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No hay proyectos</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery ? 'No se encontraron resultados' : 'Comienza agregando tu primer proyecto'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-5 transition-all hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-900/10 group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full"
                        >
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleEditProject(project, e)}
                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>

                            <div>
                                <div className="mb-3">
                                    <h3 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 pr-8 mb-2">
                                        {project.name}
                                    </h3>
                                    {project.client && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Building2 size={12} />
                                            <span className="line-clamp-1">{project.client.name}</span>
                                        </p>
                                    )}
                                </div>

                                {project.description && (
                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                        {project.description}
                                    </p>
                                )}

                                <div className="space-y-2 mb-4">
                                    {project.start_date && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={14} className="text-slate-600 shrink-0" />
                                            <span>
                                                Inicio: {new Date(project.start_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {project.monthly_fee > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <DollarSign size={14} className="text-slate-600 shrink-0" />
                                            <span>
                                                ${project.monthly_fee.toLocaleString()}/mes
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Links */}
                                <div className="flex gap-2 mb-4">
                                    {project.project_url && (
                                        <a
                                            href={project.project_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Ver proyecto</span>
                                        </a>
                                    )}
                                    {project.git_repository && (
                                        <a
                                            href={project.git_repository}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors bg-slate-700/50 px-2 py-1 rounded border border-slate-600"
                                        >
                                            <Github size={12} />
                                            <span>Repo</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 border",
                                    getStatusColor(project.status)
                                )}>
                                    {getStatusIcon(project.status)}
                                    {getStatusLabel(project.status)}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {new Date(project.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Project Modal */}
            <ProjectModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedProject(undefined);
                }}
                onSuccess={() => {
                    fetchProjects();
                    setModalOpen(false);
                    setSelectedProject(undefined);
                }}
                project={selectedProject}
            />
        </div>
    );
}
