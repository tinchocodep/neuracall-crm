import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Task } from '../../types/crm';
import { useActivityLog } from '../../hooks/useActivityLog';
import { discordService } from '../../services/discord';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    task?: Task;
}

export default function TaskModal({ isOpen, onClose, onSuccess, task }: TaskModalProps) {
    const { profile, user } = useAuth();
    const { logActivity } = useActivityLog();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        related_to_type: 'project' as 'project' | 'client' | 'opportunity' | null,
        related_to_id: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchUsers();
            if (task) {
                setFormData({
                    title: task.title || '',
                    description: task.description || '',
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    due_date: task.due_date || '',
                    related_to_type: task.related_to_type || 'project',
                    related_to_id: task.related_to_id || '',
                });
                // Set assigned user if exists
                if (task.assigned_to) {
                    setSelectedUserIds([task.assigned_to]);
                }
            } else {
                setFormData({
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: 'medium',
                    due_date: '',
                    related_to_type: 'project',
                    related_to_id: '',
                });
                setSelectedUserIds([]);
            }
        }
    }, [isOpen, task]);

    const fetchProjects = async () => {
        try {
            let query = supabase
                .from('projects')
                .select('id, name, status')
                .in('status', ['onboarding', 'development', 'testing', 'deployment', 'maintenance'])
                .order('name');

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setProjects(data || []);
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            let query = supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleAssignToMe = () => {
        if (profile?.id && !selectedUserIds.includes(profile.id)) {
            setSelectedUserIds(prev => [...prev, profile.id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const taskData = {
                ...formData,
                tenant_id: profile?.tenant_id,
                created_by: profile?.id,
                // Use first selected user as primary assigned_to for backward compatibility
                assigned_to: selectedUserIds.length > 0 ? selectedUserIds[0] : null,
                related_to_id: formData.related_to_id || null,
            };

            const oldStatus = task?.status;
            let taskId = task?.id;
            let clientId: string | null = null;

            // Get client ID if task is related to a client
            if (formData.related_to_type === 'client' && formData.related_to_id) {
                clientId = formData.related_to_id;
            }

            if (task) {
                const { error } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', task.id);

                if (error) throw error;

                // Check if task was completed
                if (oldStatus !== 'done' && formData.status === 'done') {
                    // Log task completion
                    await logActivity({
                        activityType: 'task_completed',
                        title: `Tarea "${formData.title}" completada`,
                        description: 'La tarea ha sido marcada como completada',
                        clientId: clientId || undefined,
                        relatedToType: 'task',
                        relatedToId: task.id,
                        metadata: {
                            priority: formData.priority,
                            due_date: formData.due_date || null
                        }
                    });

                    // Send Discord notification for task completion
                    if (user && profile && clientId) {
                        await discordService.notifyTaskCompleted(
                            formData.title,
                            clientId,
                            profile.full_name || user.email || 'Usuario'
                        );
                    }
                } else {
                    // Log regular task update
                    await logActivity({
                        activityType: 'other',
                        title: `Tarea "${formData.title}" actualizada`,
                        description: 'Se han modificado los datos de la tarea',
                        clientId: clientId || undefined,
                        relatedToType: 'task',
                        relatedToId: task.id,
                        metadata: {
                            status: formData.status,
                            priority: formData.priority
                        }
                    });
                }
            } else {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert([taskData])
                    .select()
                    .single();

                if (error) throw error;
                taskId = data?.id;

                // Log task creation
                await logActivity({
                    activityType: 'task_created',
                    title: `Tarea "${formData.title}" creada`,
                    description: `Nueva tarea con prioridad ${formData.priority}`,
                    clientId: clientId || undefined,
                    relatedToType: 'task',
                    relatedToId: taskId,
                    metadata: {
                        status: formData.status,
                        priority: formData.priority,
                        due_date: formData.due_date || null,
                        assigned_to: taskData.assigned_to
                    }
                });
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving task:', err);
            setError(err.message || 'Error al guardar la tarea');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">
                        {task ? 'Editar Tarea' : 'Nueva Tarea'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Título *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Implementar nueva funcionalidad"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Descripción</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                placeholder="Detalles de la tarea..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Estado *</label>
                                <select
                                    name="status"
                                    required
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="todo">Por Hacer</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="review">En Revisión</option>
                                    <option value="done">Completada</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Prioridad *</label>
                                <select
                                    name="priority"
                                    required
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="critical">Crítica</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fecha de Vencimiento</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Proyecto Relacionado</label>
                                <select
                                    name="related_to_id"
                                    value={formData.related_to_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Sin proyecto</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* User Assignment */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300">Asignar a Usuario(s)</label>
                            <button
                                type="button"
                                onClick={handleAssignToMe}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                            >
                                <UserPlus size={14} />
                                Asignarme a mí
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                            {users.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    No hay usuarios disponibles
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {users.map(user => (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => handleUserToggle(user.id)}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm text-white">
                                                    {user.full_name || user.email}
                                                    {user.id === profile?.id && (
                                                        <span className="ml-2 text-xs text-blue-400">(Tú)</span>
                                                    )}
                                                </p>
                                                {user.full_name && (
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUserIds.length > 0 && (
                            <p className="text-xs text-slate-400">
                                {selectedUserIds.length} usuario(s) seleccionado(s)
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
