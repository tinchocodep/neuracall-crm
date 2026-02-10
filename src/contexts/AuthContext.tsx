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

    // Función para obtener el perfil del usuario con tenant
    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            // Obtener usuario
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, full_name')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error fetching user:', userError);
                return null;
            }

            // Obtener tenant_user
            const { data: tenantUserData } = await supabase
                .from('tenant_users')
                .select('tenant_id, role')
                .eq('user_id', userId)
                .maybeSingle();

            if (!tenantUserData) {
                // Usuario sin tenant
                return {
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    tenant_id: null,
                    tenant_name: null,
                    role: null,
                };
            }

            // Obtener tenant
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('name')
                .eq('id', tenantUserData.tenant_id)
                .single();

            return {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                tenant_id: tenantUserData.tenant_id,
                tenant_name: tenantData?.name || null,
                role: tenantUserData.role,
            };
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId: number;

        const initAuth = async () => {
            try {
                console.log('Initializing auth...');

                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('Auth timeout - Supabase no responde. Verifica tu conexión a internet.'));
                    }, 10000);
                });

                // Race between getting session and timeout
                const sessionPromise = supabase.auth.getSession();

                const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
                clearTimeout(timeoutId);

                const { data: { session }, error } = result;

                if (error) {
                    console.error('Error getting session:', error);
                    if (mounted) setLoading(false);
                    return;
                }

                if (!mounted) return;

                console.log('Session retrieved:', session ? 'Active' : 'None');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('Fetching user profile for:', session.user.id);
                    const userProfile = await fetchUserProfile(session.user.id);
                    if (mounted) {
                        console.log('User profile loaded:', userProfile);
                        setProfile(userProfile);
                    }
                }

                if (mounted) {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                clearTimeout(timeoutId);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                try {
                    const userProfile = await fetchUserProfile(session.user.id);
                    if (mounted) {
                        setProfile(userProfile);
                    }
                } catch (error) {
                    console.error('Error fetching profile on auth change:', error);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
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
