import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActivityLog } from '../../hooks/useActivityLog';
import { discordService } from '../../services/discord';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    client?: any; // If provided, we are editing
    convertFromProspect?: boolean; // If true, we're converting a prospect to client
}

export default function ClientModal({ isOpen, onClose, onSuccess, client, convertFromProspect }: ClientModalProps) {
    const { profile, user } = useAuth();
    const { logActivity } = useActivityLog();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        website: '',
        industry: '',
        company_size: '',
        address: '',
        city: '',
        country: 'Argentina',
        status: convertFromProspect ? 'active' : 'lead',
        source: '',
        notes: '',
        tax_id: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (client) {
                setFormData({
                    name: client.name || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    company_name: client.company_name || '',
                    website: client.website || '',
                    industry: client.industry || '',
                    company_size: client.company_size || '',
                    address: client.address || '',
                    city: client.city || '',
                    country: client.country || 'Argentina',
                    status: convertFromProspect ? 'active' : (client.status || 'lead'),
                    source: client.source || '',
                    notes: client.notes || '',
                    tax_id: client.tax_id || '',
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    company_name: '',
                    website: '',
                    industry: '',
                    company_size: '',
                    address: '',
                    city: '',
                    country: 'Argentina',
                    status: convertFromProspect ? 'active' : 'lead',
                    source: '',
                    notes: '',
                    tax_id: '',
                });
            }
        }
    }, [isOpen, client, convertFromProspect]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const dataToSave = {
                ...formData,
                tenant_id: profile?.tenant_id,
                created_by: profile?.id,
            };

            let clientId = client?.id;

            if (client) {
                // Update existing client
                const { error } = await supabase
                    .from('clients')
                    .update(dataToSave)
                    .eq('id', client.id);

                if (error) throw error;

                // Log activity for update
                await logActivity({
                    activityType: 'client_updated',
                    title: `Cliente "${formData.name}" actualizado`,
                    description: 'Se han modificado los datos del cliente',
                    clientId: client.id,
                    relatedToType: 'client',
                    relatedToId: client.id,
                    metadata: {
                        updated_fields: Object.keys(formData),
                        company_name: formData.company_name || null,
                        industry: formData.industry || null
                    }
                });
            } else {
                // Create new client
                const { data, error } = await supabase
                    .from('clients')
                    .insert([dataToSave])
                    .select()
                    .single();

                if (error) throw error;
                clientId = data?.id;

                // Log activity for creation
                await logActivity({
                    activityType: 'client_created',
                    title: `Cliente "${formData.name}" creado`,
                    description: convertFromProspect
                        ? 'Prospecto convertido a cliente activo'
                        : 'Se ha creado un nuevo cliente en el sistema',
                    clientId: clientId,
                    relatedToType: 'client',
                    relatedToId: clientId,
                    metadata: {
                        company_name: formData.company_name || null,
                        industry: formData.industry || null,
                        source: formData.source || null,
                        converted_from_prospect: convertFromProspect || false
                    }
                });

                // Send Discord notification for new client
                if (user && profile) {
                    await discordService.notifyNewClient(
                        formData.name,
                        formData.industry || null,
                        profile.full_name || user.email || 'Usuario'
                    );
                }
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving client:', err);
            setError(err.message || 'Error al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">
                        {convertFromProspect ? '🎉 Convertir a Cliente' : client ? 'Editar Cliente' : 'Nuevo Cliente'}
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

                    {convertFromProspect && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-400">
                                ✅ Este prospecto se convertirá en un cliente activo
                            </p>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Información Básica</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nombre *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="juan@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">CUIT/DNI</label>
                                <input
                                    type="text"
                                    name="tax_id"
                                    value={formData.tax_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="20-12345678-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Información de Empresa</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nombre de Empresa</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Empresa SA"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Sitio Web</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="https://ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Industria</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Tecnología, Retail, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Tamaño de Empresa</label>
                                <select
                                    name="company_size"
                                    value={formData.company_size}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="1-10">1-10 empleados</option>
                                    <option value="11-50">11-50 empleados</option>
                                    <option value="51-200">51-200 empleados</option>
                                    <option value="201-500">201-500 empleados</option>
                                    <option value="501-1000">501-1000 empleados</option>
                                    <option value="1000+">1000+ empleados</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Dirección</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">Dirección</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Av. Corrientes 1234"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Ciudad</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Buenos Aires"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">País</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white">Información Adicional</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fuente</label>
                                <input
                                    type="text"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Referido, Web, etc."
                                />
                            </div>

                            {!convertFromProspect && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Estado</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="lead">Lead</option>
                                        <option value="prospect">Prospecto</option>
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="churned">Perdido</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Notas</label>
                            <textarea
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                placeholder="Notas adicionales sobre el cliente..."
                            />
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
                            {loading ? 'Guardando...' : convertFromProspect ? 'Convertir a Cliente' : client ? 'Actualizar' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
