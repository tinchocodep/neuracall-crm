import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    tenant_id: string | null;
    tenant_name: string | null;
    role: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        console.log('AuthContext mounted - skipping auto session load');
        // NO intentar cargar la sesión automáticamente porque se cuelga
        // La sesión se cargará cuando el usuario haga login
        setLoading(false);

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: any, session: any) => {
                console.log('Auth state changed:', _event, session ? 'Session active' : 'No session');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('Loading profile for user:', session.user.email);

                    // CAMINO RÁPIDO para tu usuario (bypass de base de datos)
                    if (session.user.email === 'tinchocabrera100@gmail.com') {
                        console.log('⚡ FAST TRACK: User is admin, skipping DB queries completely');

                        const profile = {
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name || 'Admin User',
                            tenant_id: '3c61110d-a0a9-4f5b-a0e3-62bb99273963',
                            tenant_name: 'Neuracall',
                            role: 'admin',
                        };

                        console.log('Final profile loaded (Main loop):', profile);
                        setProfile(profile);
                        return; // <--- IMPORTANTE: Salir aquí para no ejecutar nada más
                    }

                    try {
                        let tenantId = null;
                        let role = null;
                        let tenantName = null;

                        // Intentar obtener tenant_user
                        const { data: tenantUserData, error: tenantError } = await supabase
                            .from('tenant_users')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .single();

                        if (!tenantError && tenantUserData) {
                            tenantId = tenantUserData.tenant_id;
                            role = tenantUserData.role;
                        }

                        if (tenantId) {
                            const { data: tenantData } = await supabase
                                .from('tenants')
                                .select('name')
                                .eq('id', tenantId)
                                .single();
                            tenantName = tenantData?.name;
                        }

                        const profile = {
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name || '',
                            tenant_id: tenantId,
                            tenant_name: tenantName || null,
                            role: role,
                        };

                        console.log('Final profile loaded:', profile);
                        setProfile(profile);
                    } catch (error) {
                        console.error('Error loading profile:', error);
                        // Incluso si falla todo, intentamos dar un perfil básico
                        setProfile({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name || '',
                            tenant_id: null,
                            tenant_name: null,
                            role: null,
                        });
                    }
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
    };

    const value = {
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
