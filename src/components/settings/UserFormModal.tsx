import { useState, useEffect } from 'react';
import { X, Save, Mail, User, Phone, MapPin, Shield, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
    userId?: string; // Si existe, es edición; si no, es creación
}

interface UserFormData {
    email: string;
    full_name: string;
    phone: string;
    position: string;
    location: string;
    role: string;
    is_active: boolean;
    password?: string;
}

export default function UserFormModal({ isOpen, onClose, onSuccess, tenantId, userId }: UserFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        full_name: '',
        phone: '',
        position: '',
        location: '',
        role: 'commercial',
        is_active: true,
        password: ''
    });

    const isEditMode = !!userId;

    useEffect(() => {
        if (isOpen && userId) {
            loadUserData();
        } else if (isOpen && !userId) {
            // Reset form for new user
            setFormData({
                email: '',
                full_name: '',
                phone: '',
                position: '',
                location: '',
                role: 'commercial',
                is_active: true,
                password: ''
            });
        }
    }, [isOpen, userId]);

    const loadUserData = async () => {
        try {
            // Obtener datos del usuario
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // Obtener datos de tenant_users
            const { data: tenantUserData, error: tenantUserError } = await supabase
                .from('tenant_users')
                .select('role, is_active')
                .eq('user_id', userId)
                .eq('tenant_id', tenantId)
                .single();

            if (tenantUserError) throw tenantUserError;

            setFormData({
                email: userData.email || '',
                full_name: userData.full_name || '',
                phone: userData.phone || '',
                position: userData.position || '',
                location: userData.location || '',
                role: tenantUserData.role || 'commercial',
                is_active: tenantUserData.is_active ?? true
            });
        } catch (err: any) {
            console.error('Error loading user:', err);
            setError('Error al cargar los datos del usuario');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode) {
                // Actualizar usuario existente
                const { error: updateUserError } = await supabase
                    .from('users')
                    .update({
                        full_name: formData.full_name,
                        phone: formData.phone,
                        position: formData.position,
                        location: formData.location,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);

                if (updateUserError) throw updateUserError;

                // Actualizar tenant_users
                const { error: updateTenantUserError } = await supabase
                    .from('tenant_users')
                    .update({
                        role: formData.role,
                        is_active: formData.is_active
                    })
                    .eq('user_id', userId)
                    .eq('tenant_id', tenantId);

                if (updateTenantUserError) throw updateTenantUserError;
            } else {
                // Crear nuevo usuario
                if (!formData.password || formData.password.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }

                // Crear usuario en Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: formData.email,
                    password: formData.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: formData.full_name
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Error al crear el usuario');

                // Crear registro en users
                const { error: createUserError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        email: formData.email,
                        full_name: formData.full_name,
                        phone: formData.phone,
                        position: formData.position,
                        location: formData.location
                    });

                if (createUserError) throw createUserError;

                // Crear registro en tenant_users
                const { error: createTenantUserError } = await supabase
                    .from('tenant_users')
                    .insert({
                        user_id: authData.user.id,
                        tenant_id: tenantId,
                        role: formData.role,
                        is_active: formData.is_active
                    });

                if (createTenantUserError) throw createTenantUserError;
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving user:', err);
            setError(err.message || 'Error al guardar el usuario');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">
                        {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Mail size={16} className="inline mr-1" />
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isEditMode}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {isEditMode && (
                            <p className="text-xs text-slate-500 mt-1">El email no puede ser modificado</p>
                        )}
                    </div>

                    {/* Password (solo para nuevo usuario) */}
                    {!isEditMode && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <User size={16} className="inline mr-1" />
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Phone size={16} className="inline mr-1" />
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Briefcase size={16} className="inline mr-1" />
                            Cargo
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <MapPin size={16} className="inline mr-1" />
                            Ubicación
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Shield size={16} className="inline mr-1" />
                            Rol *
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        >
                            <option value="commercial">Comercial</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrador</option>
                            <option value="founder">Fundador</option>
                        </select>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-300">
                            Usuario activo
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
