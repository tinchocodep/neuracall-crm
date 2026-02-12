import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
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
        console.log('AuthContext mounted - loading session');

        // Función helper para cargar el perfil
        const loadProfile = async (session: Session) => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile load timeout')), 3000)
                );

                const loadProfilePromise = (async () => {
                    let tenantId = null;
                    let role = null;
                    let tenantName = null;
                    let avatarUrl = null;

                    // Cargar avatar
                    try {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('avatar_url')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (userData) {
                            avatarUrl = userData.avatar_url;
                        }
                    } catch (err) {
                        console.error('Error fetching user data:', err);
                    }

                    // Cargar tenant_user
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
                        }
                    } catch (err) {
                        console.error('Error fetching tenant_user:', err);
                    }

                    // Cargar tenant name
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
                        avatar_url: avatarUrl,
                        tenant_id: tenantId,
                        tenant_name: tenantName || null,
                        role: role,
                    };
                })();

                const profile = await Promise.race([loadProfilePromise, timeoutPromise]) as UserProfile;
                console.log('Profile loaded successfully:', profile);
                return profile;
            } catch (error) {
                console.error('Error loading profile:', error);
                // Fallback profile
                return {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || '',
                    avatar_url: null,
                    tenant_id: null,
                    tenant_name: null,
                    role: null,
                };
            }
        };

        // Cargar sesión existente al montar
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            console.log('Initial session check:', session ? 'Session found' : 'No session');
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const profile = await loadProfile(session);
                setProfile(profile);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: any, session: any) => {
                console.log('Auth state changed:', _event, session ? 'Session active' : 'No session');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('Loading profile for user:', session.user.email);
                    const profile = await loadProfile(session);
                    setProfile(profile);
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
