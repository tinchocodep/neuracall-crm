
export interface Opportunity {
    id: string;
    created_at: string;
    title: string;
    description: string | null;
    value: number;
    status: 'new' | 'qualification' | 'visit' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability: number;
    expected_close_date: string | null;
    client_id: string;
    tenant_id: string;
    assigned_to: string | null;
    source: string | null;
    loss_reason: string | null;
    // Proposal fields
    setup_fee: number;
    monthly_fee: number;
    proposal_pdf_url: string | null;
}

export interface Project {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    status: 'onboarding' | 'development' | 'testing' | 'deployment' | 'maintenance' | 'cancelled';
    start_date: string | null;
    end_date: string | null;
    setup_fee: number;
    monthly_fee: number;
    ads_budget: number;
    client_id: string;
    opportunity_id: string | null;
    tenant_id: string;
    project_url: string | null;
    git_repository: string | null;
}

export interface Task {
    id: string;
    created_at: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'feature' | 'bug' | 'maintenance' | 'meeting';
    due_date: string | null;
    project_id: string | null;
    client_id: string | null;
    assigned_to: string | null;
    created_by: string | null;
    tenant_id: string;
}

export interface Transaction {
    id: string;
    created_at: string;
    date: string;
    type: 'income' | 'expense';
    category: string | null;
    amount: number;
    description: string | null;
    client_id: string | null;
    project_id: string | null;
    tenant_id: string;
}

export interface Contact {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    department: string | null;
    notes: string | null;
    is_primary: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactClient {
    id: string;
    contact_id: string;
    client_id: string;
    tenant_id: string;
    created_at: string;
}
