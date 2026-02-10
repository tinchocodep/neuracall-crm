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
                    const userProfile = await fetchUserProfile(session.user.id);
                    setProfile(userProfile);
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
