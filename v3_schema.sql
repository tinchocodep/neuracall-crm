-- Neuracall V3 Schema Expansion

-- 1. Enable RLS on all new tables
-- (Policies will be defined after table creation)

-- 2. Update Profiles (Roles)
-- Existing 'role' field in profiles table should be sufficient ('admin', 'employee')

-- 3. Opportunities (CRM Pipeline)
-- 3. Opportunities (CRM Pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualification', 'visit', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    
    -- Foreign Keys
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- Multi-tenancy
    assigned_to UUID REFERENCES public.users(id), -- Employee assignment

    -- Metadata
    source TEXT, -- 'web', 'referral', 'ads'
    loss_reason TEXT
);

-- 4. Projects (Developments)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'development', 'testing', 'deployment', 'maintenance', 'cancelled')),
    start_date DATE,
    end_date DATE,
    
    -- Financials (Project Level)
    setup_fee DECIMAL(12, 2) DEFAULT 0, -- Costo de instalación
    monthly_fee DECIMAL(12, 2) DEFAULT 0, -- Abono mensual
    ads_budget DECIMAL(12, 2) DEFAULT 0, -- Inversión en pauta
    
    -- Foreign Keys
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL
);

-- 5. Tasks (Development & Internal)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    type TEXT DEFAULT 'feature' CHECK (type IN ('feature', 'bug', 'maintenance', 'meeting')),
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Foreign Keys
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    tenant_id UUID NOT NULL
);

-- 6. Transactions (Financials)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT, -- 'subscription', 'setup_fee', 'ads_spend', 'salary', 'software', 'office'
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    
    -- Foreign Keys
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL
);

-- 7. Add Financial Fields to Clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tax_id TEXT, -- CUIT/RFC
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trial'));

-- 8. Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies (Simplified for V3 start)
-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation: Opportunities" ON opportunities USING (tenant_id = (select tenant_id from tenant_users where user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Projects" ON projects USING (tenant_id = (select tenant_id from tenant_users where user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Tasks" ON tasks USING (tenant_id = (select tenant_id from tenant_users where user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Transactions" ON transactions USING (tenant_id = (select tenant_id from tenant_users where user_id = auth.uid()));
