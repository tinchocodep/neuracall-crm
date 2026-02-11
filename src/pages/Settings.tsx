import { useState, useEffect } from 'react';
import { User, Building2, Users, Mail, Shield, Save, CheckCircle2, AlertCircle, Plus, Edit, Phone, MapPin, Briefcase, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import AvatarUpload from '../components/settings/AvatarUpload';
import UserFormModal from '../components/settings/UserFormModal';

interface TenantUser {
    id: string;
    user_id: string;
    tenant_id: string;
    role: string;
    is_active: boolean;
    email: string;
    full_name: string | null;
    phone: string | null;
    position: string | null;
    location: string | null;
    avatar_url: string | null;
}

type TabType = 'profile' | 'company' | 'users';

export default function Settings() {
    const { profile, user } = useAuth();
    const { isFounder, isAdmin } = usePermissions();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Profile state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [position, setPosition] = useState('');
    const [location, setLocation] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Company state
    const [companyName, setCompanyName] = useState('');
    const [companySlug, setCompanySlug] = useState('');

    // Users state
    const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (user) {
            loadUserProfile();
        }
        if (profile?.tenant_id) {
            fetchTenantData();
            fetchTenantUsers();
        }
    }, [user, profile]);

    const loadUserProfile = async () => {
        if (!user) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setFullName(data.full_name || '');
                setPhone(data.phone || '');
                setPosition(data.position || '');
                setLocation(data.location || '');
                setAvatarUrl(data.avatar_url);
            }
        } catch (err: any) {
            console.error('Error loading profile:', err);
        }
    };

    const fetchTenantData = async () => {
        if (!profile?.tenant_id) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', profile.tenant_id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setCompanyName(data.name || '');
                setCompanySlug(data.slug || '');
            }
        } catch (err: any) {
            console.error('Error fetching tenant:', err);
        }
    };

    const fetchTenantUsers = async () => {
        if (!profile?.tenant_id) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('tenant_users')
                .select(`
                    id,
                    user_id,
                    tenant_id,
                    role,
                    is_active,
                    users:user_id (
                        email,
                        full_name,
                        phone,
                        position,
                        location,
                        avatar_url
                    )
                `)
                .eq('tenant_id', profile.tenant_id);

            if (fetchError) throw fetchError;

            if (data) {
                const formattedUsers = data.map((tu: any) => ({
                    id: tu.id,
                    user_id: tu.user_id,
                    tenant_id: tu.tenant_id,
                    role: tu.role,
                    is_active: tu.is_active ?? true,
                    email: tu.users?.email || '',
                    full_name: tu.users?.full_name || null,
                    phone: tu.users?.phone || null,
                    position: tu.users?.position || null,
                    location: tu.users?.location || null,
                    avatar_url: tu.users?.avatar_url || null
                }));
                setTenantUsers(formattedUsers);
            }
        } catch (err: any) {
            console.error('Error fetching users:', err);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    phone: phone,
                    position: position,
                    location: location,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSuccess('Perfil actualizado exitosamente');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Error al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.tenant_id || !isFounder) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    name: companyName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.tenant_id);

            if (updateError) throw updateError;

            setSuccess('Empresa actualizada exitosamente');
            setTimeout(() => setSuccess(null), 3000);
            await fetchTenantData();
        } catch (err: any) {
            console.error('Error updating company:', err);
            setError(err.message || 'Error al actualizar la empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        if (!profile?.tenant_id) return;

        try {
            const { error: updateError } = await supabase
                .from('tenant_users')
                .update({ is_active: !currentStatus })
                .eq('user_id', userId)
                .eq('tenant_id', profile.tenant_id);

            if (updateError) throw updateError;

            await fetchTenantUsers();
            setSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error toggling user status:', err);
            setError(err.message || 'Error al cambiar el estado del usuario');
        }
    };

    const handleOpenUserModal = (userId?: string) => {
        setEditingUserId(userId);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUserId(undefined);
    };

    const handleUserFormSuccess = () => {
        fetchTenantUsers();
        setSuccess(editingUserId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setTimeout(() => setSuccess(null), 3000);
    };

    const tabs = [
        { id: 'profile' as TabType, label: 'Mi Perfil', icon: User, available: true },
        { id: 'company' as TabType, label: 'Empresa', icon: Building2, available: isFounder || isAdmin },
        { id: 'users' as TabType, label: 'Usuarios', icon: Users, available: isFounder || isAdmin },
    ];

    const getRoleLabel = (role: string) => {
        const roles: Record<string, { label: string; color: string }> = {
            'founder': { label: 'Fundador', color: 'text-purple-400' },
            'admin': { label: 'Administrador', color: 'text-blue-400' },
            'supervisor': { label: 'Supervisor', color: 'text-emerald-400' },
            'commercial': { label: 'Comercial', color: 'text-orange-400' },
            'member': { label: 'Miembro', color: 'text-slate-400' },
        };
        return roles[role] || roles['member'];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
                    <p className="text-slate-400">Gestiona tu perfil, empresa y usuarios</p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                        <CheckCircle2 size={24} />
                        <p>{success}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="flex border-b border-slate-800 overflow-x-auto">
                        {tabs.filter(tab => tab.available).map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }
                                    `}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && user && (
                            <div className="max-w-2xl">
                                <div className="mb-8">
                                    <AvatarUpload
                                        userId={user.id}
                                        currentAvatarUrl={avatarUrl}
                                        onAvatarUpdate={(url) => setAvatarUrl(url)}
                                    />
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <User size={16} className="inline mr-1" />
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Mail size={16} className="inline mr-1" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            El email no puede ser modificado
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Phone size={16} className="inline mr-1" />
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Briefcase size={16} className="inline mr-1" />
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <MapPin size={16} className="inline mr-1" />
                                            Ubicación
                                        </label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end pt-6 border-t border-slate-700">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none flex items-center gap-2"
                                        >
                                            <Save size={18} />
                                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </form>

                                {/* Account Info */}
                                <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                                    <h4 className="text-sm font-medium text-slate-300 mb-3">Información de la Cuenta</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">ID de Usuario:</span>
                                            <span className="text-slate-300 font-mono text-xs">{user?.id}</span>
                                        </div>
                                        {profile?.tenant_id && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Tenant ID:</span>
                                                <span className="text-slate-300 font-mono text-xs">{profile.tenant_id}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Rol:</span>
                                            <span className={`font-medium capitalize ${getRoleLabel(profile?.role || 'member').color}`}>
                                                {getRoleLabel(profile?.role || 'member').label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Tab */}
                        {activeTab === 'company' && (isFounder || isAdmin) && (
                            <div className="max-w-2xl">
                                <form onSubmit={handleUpdateCompany} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Building2 size={16} className="inline mr-1" />
                                            Nombre de la Empresa
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            disabled={!isFounder}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Slug (Identificador único)
                                        </label>
                                        <input
                                            type="text"
                                            value={companySlug}
                                            disabled
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed font-mono"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            El slug no puede ser modificado
                                        </p>
                                    </div>

                                    {isFounder && (
                                        <div className="flex items-center justify-end pt-6 border-t border-slate-700">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none flex items-center gap-2"
                                            >
                                                <Save size={18} />
                                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (isFounder || isAdmin) && profile?.tenant_id && (
                            <div className="max-w-6xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Usuarios del Sistema</h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {tenantUsers.length} usuario{tenantUsers.length !== 1 ? 's' : ''} registrado{tenantUsers.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenUserModal()}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Nuevo Usuario
                                    </button>
                                </div>

                                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-900 border-b border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Usuario
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Contacto
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Rol
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {tenantUsers.map((tenantUser) => {
                                                const roleInfo = getRoleLabel(tenantUser.role);
                                                return (
                                                    <tr key={tenantUser.id} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                    {tenantUser.avatar_url ? (
                                                                        <img src={tenantUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        tenantUser.full_name?.[0]?.toUpperCase() || tenantUser.email?.[0]?.toUpperCase() || '?'
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white">{tenantUser.full_name || 'Sin nombre'}</div>
                                                                    <div className="text-sm text-slate-400">{tenantUser.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm space-y-1">
                                                                {tenantUser.phone && (
                                                                    <div className="flex items-center gap-1 text-slate-300">
                                                                        <Phone size={14} />
                                                                        {tenantUser.phone}
                                                                    </div>
                                                                )}
                                                                {tenantUser.position && (
                                                                    <div className="flex items-center gap-1 text-slate-400">
                                                                        <Briefcase size={14} />
                                                                        {tenantUser.position}
                                                                    </div>
                                                                )}
                                                                {tenantUser.location && (
                                                                    <div className="flex items-center gap-1 text-slate-400">
                                                                        <MapPin size={14} />
                                                                        {tenantUser.location}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={16} className={roleInfo.color} />
                                                                <span className={`font-medium ${roleInfo.color}`}>
                                                                    {roleInfo.label}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleToggleUserStatus(tenantUser.user_id, tenantUser.is_active)}
                                                                className="flex items-center gap-2 group"
                                                            >
                                                                {tenantUser.is_active ? (
                                                                    <>
                                                                        <ToggleRight size={24} className="text-emerald-400 group-hover:text-emerald-300" />
                                                                        <span className="text-sm text-emerald-400 group-hover:text-emerald-300">Activo</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ToggleLeft size={24} className="text-slate-500 group-hover:text-slate-400" />
                                                                        <span className="text-sm text-slate-500 group-hover:text-slate-400">Inactivo</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleOpenUserModal(tenantUser.user_id)}
                                                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                                                                title="Editar usuario"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {tenantUsers.length === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            No hay usuarios registrados
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Form Modal */}
            {profile?.tenant_id && (
                <UserFormModal
                    isOpen={isUserModalOpen}
                    onClose={handleCloseUserModal}
                    onSuccess={handleUserFormSuccess}
                    tenantId={profile.tenant_id}
                    userId={editingUserId}
                />
            )}
        </div>
    );
}
