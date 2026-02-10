import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Client, Contact, Prospect, Opportunity, AIProject } from '../lib/supabase';

// Hook genérico para queries
function useSupabaseQuery<T>(
    table: string,
    tenantId?: string
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            let query = supabase.from(table).select('*');

            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }

            const { data: result, error: err } = await query;

            if (err) throw err;
            setData(result || []);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [table, tenantId]);

    return { data, loading, error, refetch: fetchData };
}

// Hooks específicos
export function useClients(tenantId: string) {
    return useSupabaseQuery<Client>('clients', tenantId);
}

export function useContacts(tenantId: string) {
    return useSupabaseQuery<Contact>('contacts', tenantId);
}

export function useProspects(tenantId: string) {
    return useSupabaseQuery<Prospect>('prospects', tenantId);
}

export function useOpportunities(tenantId: string) {
    return useSupabaseQuery<Opportunity>('opportunities', tenantId);
}

export function useAIProjects(tenantId: string) {
    return useSupabaseQuery<AIProject>('ai_projects', tenantId);
}

// Hook para crear/actualizar
export function useSupabaseMutation<T>(table: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = async (data: Partial<T>) => {
        try {
            setLoading(true);
            const { data: result, error: err } = await supabase
                .from(table)
                .insert([data])
                .select()
                .single();

            if (err) throw err;
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: string, data: Partial<T>) => {
        try {
            setLoading(true);
            const { data: result, error: err } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: string) => {
        try {
            setLoading(true);
            const { error: err } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { create, update, remove, loading, error };
}
