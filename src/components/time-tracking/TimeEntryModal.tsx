import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { TimeEntry } from '../../types/crm';

interface TimeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    entry?: TimeEntry;
}

export default function TimeEntryModal({ isOpen, onClose, onSuccess, entry }: TimeEntryModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        project_id: '',
        task_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        hours: 0,
        minutes: 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchTasks();
            if (entry) {
                const startDate = new Date(entry.start_time);
                const endDate = entry.end_time ? new Date(entry.end_time) : new Date();

                setFormData({
                    project_id: entry.project_id || '',
                    task_id: entry.task_id || '',
                    description: entry.description || '',
                    date: startDate.toISOString().split('T')[0],
                    start_time: startDate.toTimeString().slice(0, 5),
                    end_time: endDate.toTimeString().slice(0, 5),
                    hours: Math.floor((entry.duration_minutes || 0) / 60),
                    minutes: (entry.duration_minutes || 0) % 60,
                });
            } else {
                setFormData({
                    project_id: '',
                    task_id: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    start_time: '09:00',
                    end_time: '17:00',
                    hours: 0,
                    minutes: 0,
                });
            }
        }
    }, [isOpen, entry]);

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

    const fetchTasks = async () => {
        try {
            let query = supabase
                .from('tasks')
                .select('id, title')
                .order('title');

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const calculateDuration = () => {
        if (formData.hours || formData.minutes) {
            // Use manual hours/minutes
            return (formData.hours * 60) + formData.minutes;
        } else {
            // Calculate from start/end time
            const [startHour, startMin] = formData.start_time.split(':').map(Number);
            const [endHour, endMin] = formData.end_time.split(':').map(Number);

            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            return endMinutes - startMinutes;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const durationMinutes = calculateDuration();

            if (durationMinutes <= 0) {
                throw new Error('La duración debe ser mayor a 0');
            }

            const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

            const timeEntryData = {
                tenant_id: profile?.tenant_id,
                user_id: profile?.id,
                project_id: formData.project_id || null,
                task_id: formData.task_id || null,
                description: formData.description || null,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration_minutes: durationMinutes,
                is_running: false,
            };

            if (entry) {
                const { error } = await supabase
                    .from('time_entries')
                    .update(timeEntryData)
                    .eq('id', entry.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('time_entries')
                    .insert([timeEntryData]);

                if (error) throw error;
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving time entry:', err);
            setError(err.message || 'Error al guardar el registro');
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
                        {entry ? 'Editar Registro' : 'Entrada Manual de Tiempo'}
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

                    {/* Project & Task */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Proyecto</label>
                            <select
                                name="project_id"
                                value={formData.project_id}
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tarea</label>
                            <select
                                name="task_id"
                                value={formData.task_id}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="">Sin tarea</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>
                                        {task.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Descripción</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="¿En qué trabajaste?"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Fecha y Hora</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fecha *</label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Hora Inicio</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Hora Fin</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Manual Duration */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">O ingresa la duración manualmente</h3>
                        <p className="text-sm text-slate-400">
                            Si ingresas horas/minutos, se ignorarán las horas de inicio/fin
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Horas</label>
                                <input
                                    type="number"
                                    name="hours"
                                    min="0"
                                    max="24"
                                    value={formData.hours}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Minutos</label>
                                <input
                                    type="number"
                                    name="minutes"
                                    min="0"
                                    max="59"
                                    value={formData.minutes}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0"
                                />
                            </div>
                        </div>
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
                            {loading ? 'Guardando...' : entry ? 'Actualizar' : 'Guardar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
