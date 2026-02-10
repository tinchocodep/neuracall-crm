// Script de diagnóstico para verificar la carga de clientes
// Ejecutar en la consola del navegador

console.log('=== DIAGNÓSTICO DE CLIENTES ===');

// 1. Verificar autenticación
const checkAuth = async () => {
    const { data: { session } } = await window.supabase.auth.getSession();
    console.log('1. Sesión:', session ? '✅ Activa' : '❌ No activa');
    if (session) {
        console.log('   User ID:', session.user.id);
        console.log('   Email:', session.user.email);
    }
    return session;
};

// 2. Verificar perfil de usuario
const checkProfile = async (userId) => {
    const { data, error } = await window.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    console.log('2. Perfil de usuario:', data ? '✅ Encontrado' : '❌ No encontrado');
    if (error) console.error('   Error:', error);
    if (data) console.log('   Datos:', data);
    return data;
};

// 3. Verificar tenant_user
const checkTenantUser = async (userId) => {
    const { data, error } = await window.supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', userId)
        .single();

    console.log('3. Tenant User:', data ? '✅ Encontrado' : '❌ No encontrado');
    if (error) console.error('   Error:', error);
    if (data) {
        console.log('   Tenant ID:', data.tenant_id);
        console.log('   Role:', data.role);
    }
    return data;
};

// 4. Verificar clientes
const checkClients = async (tenantId) => {
    const { data, error } = await window.supabase
        .from('clients')
        .select(`
            *,
            companies:client_companies(*),
            contacts:client_contacts(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    console.log('4. Clientes:', data ? `✅ ${data.length} encontrados` : '❌ No encontrados');
    if (error) console.error('   Error:', error);
    if (data) console.log('   Datos:', data);
    return data;
};

// Ejecutar diagnóstico completo
(async () => {
    try {
        const session = await checkAuth();
        if (!session) {
            console.error('❌ No hay sesión activa. Por favor inicia sesión.');
            return;
        }

        const profile = await checkProfile(session.user.id);
        if (!profile) {
            console.error('❌ No se encontró el perfil del usuario.');
            return;
        }

        const tenantUser = await checkTenantUser(session.user.id);
        if (!tenantUser) {
            console.error('❌ No se encontró la relación tenant-user.');
            return;
        }

        const clients = await checkClients(tenantUser.tenant_id);

        console.log('\n=== RESUMEN ===');
        console.log('Sesión:', session ? '✅' : '❌');
        console.log('Perfil:', profile ? '✅' : '❌');
        console.log('Tenant User:', tenantUser ? '✅' : '❌');
        console.log('Clientes:', clients ? `✅ (${clients.length})` : '❌');

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
})();
