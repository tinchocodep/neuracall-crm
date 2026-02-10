import { supabase } from './src/lib/supabase.ts';

async function testConnection() {
    console.log('Testing Supabase connection...');

    // Test 1: Check if supabase client is initialized
    console.log('✓ Supabase client initialized');

    // Test 2: Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('✗ Session error:', sessionError);
    } else {
        console.log('✓ Session check:', sessionData.session ? 'Logged in' : 'Not logged in');
    }

    // Test 3: Try to query tenants table
    const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);

    if (tenantsError) {
        console.error('✗ Tenants query error:', tenantsError);
    } else {
        console.log('✓ Tenants query successful:', tenantsData);
    }

    // Test 4: Try to query users table
    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (usersError) {
        console.error('✗ Users query error:', usersError);
    } else {
        console.log('✓ Users query successful:', usersData);
    }
}

testConnection().then(() => {
    console.log('Connection test completed');
    process.exit(0);
}).catch((error) => {
    console.error('Connection test failed:', error);
    process.exit(1);
});
