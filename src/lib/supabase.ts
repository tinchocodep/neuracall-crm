import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface TimeEntry {
    id: string;
    tenant_id: string;
    user_id: string;
    ai_project_id: string;
    start_time: string;
    end_time: string | null;
    duration_minutes: number | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProjectDeployment {
    id: string;
    tenant_id: string;
    ai_project_id: string;
    deployment_url: string;
    preview_url: string | null;
    git_repo_url: string | null;
    git_branch: string;
    vercel_project_id: string | null;
    status: 'building' | 'ready' | 'error' | 'cancelled';
    deployed_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface AIProject {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    client_id: string;
    opportunity_id: string | null;
    status: 'planning' | 'development' | 'testing' | 'deployed' | 'completed';
    start_date: string;
    end_date: string | null;
    budget: number | null;
    team_members: any[] | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}
