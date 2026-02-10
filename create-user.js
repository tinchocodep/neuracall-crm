// Script temporal para crear usuario en Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas la service role key

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createUser() {
    try {
        console.log('🔄 Creando usuario...');

        const { data, error } = await supabase.auth.admin.createUser({
            email: 'tinchocabrera100@gmail.com',
            password: 'neuracall2026',
            email_confirm: true,
            user_metadata: {
                full_name: 'Martin Cabrera'
            }
        });

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        console.log('✅ Usuario creado exitosamente!');
        console.log('📧 Email:', data.user.email);
        console.log('🆔 ID:', data.user.id);
        console.log('\n🔑 Credenciales:');
        console.log('   Email: tinchocabrera100@gmail.com');
        console.log('   Contraseña: neuracall2026');
    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }
}

createUser();
