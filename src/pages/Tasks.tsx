import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    Circle,
    Calendar,
    User,
    FolderKanban,
    Edit,
    Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Task } from '../types/crm';
import TaskModal from '../components/tasks/TaskModal';

interface TaskWithRelations extends Task {
    project?: { id: string; name: string };
    assigned_user?: { id: string; full_name: string; email: string };
}

export default function Tasks() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | undefined>(undefined);

    useEffect(() => {
        fetchTasks();
    }, [profile]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Fetch related projects
            const tasksWithProjects = await Promise.all(
                (data || []).map(async (task) => {
                    if (task.related_to_type === 'project' && task.related_to_id) {
                        const { data: project } = await supabase
                            .from('projects')
                            .select('id, name')
                            .eq('id', task.related_to_id)
                            .single();

                        return { ...task, project };
                    }
                    return task;
                })
            );

            setTasks(tasksWithProjects);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewTask = () => {
        setSelectedTask(undefined);
        setModalOpen(true);
    };

    const handleEditTask = (task: TaskWithRelations, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTask(task);
        setModalOpen(true);
    };

    const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'todo': return <Circle size={16} />;
            case 'in_progress': return <Clock size={16} />;
            case 'review': return <AlertCircle size={16} />;
            case 'done': return <CheckCircle2 size={16} />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'review': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'done': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            todo: 'Por Hacer',
            in_progress: 'En Progreso',
            review: 'En Revisión',
            done: 'Completada'
        };
        return labels[status] || status;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
        }
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            low: 'Baja',
            medium: 'Media',
            high: 'Alta',
            critical: 'Crítica'
        };
        return labels[priority] || priority;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Mis Tareas</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona tus tareas y proyectos.
                    </p>
                </div>

                <button
                    onClick={handleNewTask}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nueva Tarea</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                {/* Status Filter */}
                <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todas ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('todo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'todo'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Por Hacer ({todoCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus('in_progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'in_progress'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        En Progreso ({inProgressCount})
                    </button>
                    <button
                        onClick={() => setFilterStatus('done')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'done'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Completadas ({doneCount})
                    </button>
                </div>

                {/* Priority Filter & Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
                        <button
                            onClick={() => setFilterPriority('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterPriority === 'all'
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterPriority('critical')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterPriority === 'critical'
                                    ? 'bg-red-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Crítica
                        </button>
                        <button
                            onClick={() => setFilterPriority('high')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterPriority === 'high'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Alta
                        </button>
                        <button
                            onClick={() => setFilterPriority('medium')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterPriority === 'medium'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Media
                        </button>
                        <button
                            onClick={() => setFilterPriority('low')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterPriority === 'low'
                                    ? 'bg-slate-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Baja
                        </button>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-800 flex items-center gap-2 flex-1">
                        <Search size={20} className="text-slate-500 ml-3 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar tareas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 w-full p-2 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No hay tareas</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery ? 'No se encontraron resultados' : 'Comienza agregando tu primera tarea'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-5 transition-all hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-900/10 group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => handleEditTask(task, e)}
                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteTask(task.id, e)}
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-3">
                                <div className="flex items-start gap-2 mb-2">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border shrink-0",
                                        getPriorityColor(task.priority)
                                    )}>
                                        {getPriorityLabel(task.priority)}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 pr-16">
                                    {task.title}
                                </h3>
                            </div>

                            {task.description && (
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                    {task.description}
                                </p>
                            )}

                            <div className="space-y-2 mb-4">
                                {task.project && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <FolderKanban size={14} className="text-slate-600 shrink-0" />
                                        <span className="line-clamp-1">{task.project.name}</span>
                                    </div>
                                )}
                                {task.assigned_user && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <User size={14} className="text-slate-600 shrink-0" />
                                        <span className="line-clamp-1">{task.assigned_user.full_name || task.assigned_user.email}</span>
                                    </div>
                                )}
                                {task.due_date && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar size={14} className="text-slate-600 shrink-0" />
                                        <span>
                                            Vence: {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-700/50">
                                <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 border w-fit",
                                    getStatusColor(task.status)
                                )}>
                                    {getStatusIcon(task.status)}
                                    {getStatusLabel(task.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedTask(undefined);
                }}
                onSuccess={() => {
                    fetchTasks();
                    setModalOpen(false);
                    setSelectedTask(undefined);
                }}
                task={selectedTask}
            />
        </div>
    );
}
