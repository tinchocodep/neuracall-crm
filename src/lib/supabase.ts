import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CRM Types
export interface Client {
    id: string;
    tenant_id: string;
    name: string;
    industry?: string;
    website?: string;
    status: 'active' | 'inactive';
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    position?: string;
    company_id?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Prospect {
    id: string;
    tenant_id: string;
    company_name: string;
    industry?: string;
    website?: string;
    status: 'cold' | 'warm' | 'hot';
    probability?: number;
    notes?: string;
    assigned_to?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Opportunity {
    id: string;
    tenant_id: string;
    title: string;
    description?: string;
    client_id?: string;
    prospect_id?: string;
    value: number;
    stage: 'prospecting' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability?: number;
    expected_close_date?: string;
    assigned_to?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface AIProject {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    client_id: string;
    opportunity_id?: string;
    status: 'planning' | 'development' | 'testing' | 'deployed' | 'completed';
    start_date: string;
    end_date?: string;
    budget?: number;
    team_members?: string[];
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Quote {
    id: string;
    tenant_id: string;
    quote_number: string;
    client_id?: string;
    prospect_id?: string;
    title: string;
    description?: string;
    items: any[];
    subtotal: number;
    tax: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    valid_until?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    tenant_id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: string;
    due_date?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: string;
    tenant_id: string;
    expense_date: string;
    category: string;
    amount: number;
    description: string;
    vendor?: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    created_by?: string;
    created_at: string;
    updated_at: string;
}
