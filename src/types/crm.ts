
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
    tenant_id: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigned_to: string | null;
    due_date: string | null;
    related_to_type: 'project' | 'client' | 'opportunity' | null;
    related_to_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
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

export interface TimeEntry {
    id: string;
    tenant_id: string;
    user_id: string;
    project_id: string | null;
    task_id: string | null;
    description: string | null;
    start_time: string;
    end_time: string | null;
    duration_minutes: number | null;
    is_running: boolean;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    tenant_id: string;
    project_id: string;
    client_id: string;
    invoice_number: string | null;
    invoice_type: 'installation' | 'monthly' | 'other';
    tax_type: 'with_vat' | 'without_vat';
    subtotal: number;
    vat_amount: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
    issue_date: string;
    due_date: string | null;
    invoice_file_url: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoicePayment {
    id: string;
    tenant_id: string;
    invoice_id: string;
    amount: number;
    payment_method: 'cash' | 'transfer' | 'check' | 'card' | 'other';
    payment_date: string;
    receipt_file_url: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserEarning {
    id: string;
    tenant_id: string;
    project_id: string;
    user_id: string;
    invoice_payment_id: string | null;
    amount: number;
    percentage: number | null;
    earning_type: 'installation' | 'monthly' | 'bonus' | 'other';
    status: 'pending' | 'approved' | 'paid';
    payment_date: string | null;
    description: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    category: 'ai_engine' | 'infrastructure' | 'software' | 'other';
    provider: string | null;
    amount: number;
    currency: string;
    billing_frequency: 'monthly' | 'annual' | 'quarterly';
    status: 'active' | 'paused' | 'cancelled';
    start_date: string;
    end_date: string | null;
    next_billing_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface Expense {
    id: string;
    tenant_id: string;
    subscription_id: string | null;
    name: string;
    description: string | null;
    category: string;
    amount: number;
    currency: string;
    expense_date: string;
    status: 'pending' | 'approved' | 'paid';
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface ExpenseAllocation {
    id: string;
    tenant_id: string;
    expense_id: string | null;
    subscription_id: string | null;
    project_id: string;
    allocation_percentage: number;
    allocated_amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface CalendarEvent {
    id: string;
    tenant_id: string;
    title: string;
    description: string | null;
    event_type: "task" | "meeting" | "deadline" | "invoice_due" | "subscription_billing" | "other";
    start_date: string;
    end_date: string | null;
    all_day: boolean;
    user_id: string | null;
    project_id: string | null;
    client_id: string | null;
    task_id: string | null;
    invoice_id: string | null;
    subscription_id: string | null;
    status: "pending" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    location: string | null;
    attendees: any[];
    is_recurring: boolean;
    recurrence_rule: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

