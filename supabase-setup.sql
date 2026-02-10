-- MULTI-TENANT CRM SCHEMA FOR NEURACALL
-- Execute this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Users
CREATE TABLE tenant_users (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY(tenant_id, user_id)
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospects
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT DEFAULT 'cold',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  stage TEXT DEFAULT 'prospecting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Projects
CREATE TABLE ai_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  status TEXT DEFAULT 'planning',
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;

-- Sample Data
INSERT INTO tenants (name, slug) VALUES ('Neuracall', 'neuracall');
INSERT INTO users (email, full_name, role) VALUES ('martin@neuracall.com', 'Martin', 'admin');
INSERT INTO tenant_users (tenant_id, user_id, role) 
  SELECT t.id, u.id, 'owner' FROM tenants t, users u WHERE t.slug = 'neuracall';
