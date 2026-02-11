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

                    try {
                        // Set a timeout to prevent hanging
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Profile load timeout')), 5000)
                        );

                        const loadProfilePromise = (async () => {
                            let tenantId = null;
                            let role = null;
                            let tenantName = null;

                            // Intentar obtener tenant_user con timeout
                            try {
                                const { data: tenantUserData, error: tenantError } = await supabase
                                    .from('tenant_users')
                                    .select('*')
                                    .eq('user_id', session.user.id)
                                    .maybeSingle();

                                if (!tenantError && tenantUserData) {
                                    tenantId = tenantUserData.tenant_id;
                                    role = tenantUserData.role;
                                    console.log('Tenant user data loaded:', { tenantId, role });
                                } else {
                                    console.warn('No tenant_user found or error:', tenantError);
                                }
                            } catch (err) {
                                console.error('Error fetching tenant_user:', err);
                            }

                            // Intentar obtener tenant name
                            if (tenantId) {
                                try {
                                    const { data: tenantData } = await supabase
                                        .from('tenants')
                                        .select('name')
                                        .eq('id', tenantId)
                                        .maybeSingle();
                                    tenantName = tenantData?.name;
                                    console.log('Tenant name loaded:', tenantName);
                                } catch (err) {
                                    console.error('Error fetching tenant:', err);
                                }
                            }

                            return {
                                id: session.user.id,
                                email: session.user.email || '',
                                full_name: session.user.user_metadata?.full_name || '',
                                tenant_id: tenantId,
                                tenant_name: tenantName || null,
                                role: role,
                            };
                        })();

                        // Race between loading and timeout
                        const profile = await Promise.race([loadProfilePromise, timeoutPromise]) as UserProfile;
                        
                        console.log('Final profile loaded:', profile);
                        setProfile(profile);
                    } catch (error) {
                        console.error('Error loading profile (using fallback):', error);
                        // Fallback: perfil básico con datos del auth
                        const fallbackProfile = {
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name || '',
                            tenant_id: null,
                            tenant_name: null,
                            role: null,
                        };
                        console.log('Using fallback profile:', fallbackProfile);
                        setProfile(fallbackProfile);
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
        window.location.href = '/login';
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
