import { useState, useEffect } from 'react';
import { X, ExternalLink, Github } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types/crm';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    project?: Project;
}

export default function ProjectModal({ isOpen, onClose, onSuccess, project }: ProjectModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [opportunities, setOpportunities] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        client_id: '',
        opportunity_id: '',
        status: 'onboarding',
        start_date: '',
        end_date: '',
        setup_fee: 0,
        monthly_fee: 0,
        ads_budget: 0,
        project_url: '',
        git_repository: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            if (project) {
                setFormData({
                    name: project.name || '',
                    description: project.description || '',
                    client_id: project.client_id || '',
                    opportunity_id: project.opportunity_id || '',
                    status: project.status || 'onboarding',
                    start_date: project.start_date || '',
                    end_date: project.end_date || '',
                    setup_fee: project.setup_fee || 0,
                    monthly_fee: project.monthly_fee || 0,
                    ads_budget: project.ads_budget || 0,
                    project_url: project.project_url || '',
                    git_repository: project.git_repository || '',
                });
                if (project.client_id) {
                    fetchOpportunities(project.client_id);
                }
            } else {
                setFormData({
                    name: '',
                    description: '',
                    client_id: '',
                    opportunity_id: '',
                    status: 'onboarding',
                    start_date: '',
                    end_date: '',
                    setup_fee: 0,
                    monthly_fee: 0,
                    ads_budget: 0,
                    project_url: '',
                    git_repository: '',
                });
            }
        }
    }, [isOpen, project]);

    const fetchClients = async () => {
        try {
            let query = supabase
                .from('clients')
                .select('id, name')
                .eq('status', 'active')
                .order('name');

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const fetchOpportunities = async (clientId: string) => {
        if (!clientId) {
            setOpportunities([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select('id, title, status')
                .eq('client_id', clientId)
                .in('status', ['closed_won'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOpportunities(data || []);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['setup_fee', 'monthly_fee', 'ads_budget'].includes(name)
                ? parseFloat(value) || 0
                : value
        }));

        if (name === 'client_id') {
            fetchOpportunities(value);
            setFormData(prev => ({ ...prev, opportunity_id: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const projectData = {
                ...formData,
                tenant_id: profile?.tenant_id,
                client_id: formData.client_id || null,
                opportunity_id: formData.opportunity_id || null,
            };

            if (project) {
                const { error } = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', project.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('projects')
                    .insert([projectData]);

                if (error) throw error;
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving project:', err);
            setError(err.message || 'Error al guardar el proyecto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">
                        {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
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
                        <h3 className="text-lg font-semibold text-white">Información Básica</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Nombre del Proyecto *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Sitio Web Corporativo"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Cliente *</label>
                                <select
                                    name="client_id"
                                    required
                                    value={formData.client_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Seleccionar Cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Oportunidad Relacionada</label>
                                <select
                                    name="opportunity_id"
                                    value={formData.opportunity_id}
                                    onChange={handleChange}
                                    disabled={!formData.client_id}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Sin oportunidad</option>
                                    {opportunities.map(opp => (
                                        <option key={opp.id} value={opp.id}>{opp.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Estado *</label>
                                <select
                                    name="status"
                                    required
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="onboarding">Onboarding</option>
                                    <option value="development">Desarrollo</option>
                                    <option value="testing">Testing</option>
                                    <option value="deployment">Deployment</option>
                                    <option value="maintenance">Mantenimiento</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fecha de Inicio</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fecha de Fin</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Descripción</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Descripción del proyecto..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Información Financiera</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Setup Fee ($)</label>
                                <input
                                    type="number"
                                    name="setup_fee"
                                    min="0"
                                    step="0.01"
                                    value={formData.setup_fee}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Cuota Mensual ($)</label>
                                <input
                                    type="number"
                                    name="monthly_fee"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthly_fee}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Presupuesto Ads ($)</label>
                                <input
                                    type="number"
                                    name="ads_budget"
                                    min="0"
                                    step="0.01"
                                    value={formData.ads_budget}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Enlaces</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <ExternalLink size={16} />
                                    URL del Proyecto
                                </label>
                                <input
                                    type="url"
                                    name="project_url"
                                    value={formData.project_url}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="https://ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Github size={16} />
                                    Repositorio Git
                                </label>
                                <input
                                    type="url"
                                    name="git_repository"
                                    value={formData.git_repository}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="https://github.com/usuario/repo"
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
                            {loading ? 'Guardando...' : project ? 'Actualizar' : 'Crear Proyecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
