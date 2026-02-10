# Neuracall CRM - Configuración de Base de Datos

## 📊 Estructura de la Base de Datos

Este documento describe la estructura de tablas necesarias para el CRM de Neuracall.

### Tablas Principales

#### 1. **clients** - Clientes Activos
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **contacts** - Contactos
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  position TEXT,
  company_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **prospects** - Prospectos
```sql
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  status TEXT CHECK (status IN ('cold', 'warm', 'hot')) DEFAULT 'cold',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **opportunities** - Oportunidades de Proyectos IA
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  value DECIMAL(12, 2) NOT NULL,
  stage TEXT CHECK (stage IN ('prospecting', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'prospecting',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. **ai_projects** - Proyectos de IA
```sql
CREATE TABLE ai_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('planning', 'development', 'testing', 'deployed', 'completed')) DEFAULT 'planning',
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(12, 2),
  team_members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices Recomendados

```sql
-- Índices para mejorar el rendimiento
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_opportunities_client ON opportunities(client_id);
CREATE INDEX idx_opportunities_prospect ON opportunities(prospect_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_ai_projects_client ON ai_projects(client_id);
CREATE INDEX idx_ai_projects_status ON ai_projects(status);
```

### Triggers para updated_at

```sql
-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_projects_updated_at BEFORE UPDATE ON ai_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔐 Row Level Security (RLS)

Para habilitar RLS en todas las tablas:

```sql
-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según tus necesidades de autenticación)
-- Ejemplo: permitir todo para usuarios autenticados
CREATE POLICY "Enable all for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON prospects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON opportunities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON ai_projects
    FOR ALL USING (auth.role() = 'authenticated');
```

## 📝 Datos de Ejemplo

```sql
-- Insertar cliente de ejemplo
INSERT INTO clients (name, industry, website, status) VALUES
('TechCorp', 'Technology', 'https://techcorp.com', 'active');

-- Insertar contacto de ejemplo
INSERT INTO contacts (first_name, last_name, email, phone, position, company_id) VALUES
('Juan', 'Pérez', 'juan.perez@techcorp.com', '+1234567890', 'CTO', 
  (SELECT id FROM clients WHERE name = 'TechCorp'));

-- Insertar prospecto de ejemplo
INSERT INTO prospects (company_name, industry, status, probability) VALUES
('InnovateSoft', 'Software', 'hot', 75);

-- Insertar oportunidad de ejemplo
INSERT INTO opportunities (title, description, value, stage, probability, expected_close_date, client_id) VALUES
('Chatbot con NLP', 'Desarrollo de chatbot inteligente con procesamiento de lenguaje natural', 85000.00, 'proposal', 60, '2026-03-15',
  (SELECT id FROM clients WHERE name = 'TechCorp'));
```

## 🚀 Instalación

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta los scripts SQL anteriores en el SQL Editor de Supabase
3. Copia las credenciales de tu proyecto
4. Crea un archivo `.env` basado en `.env.example`
5. Pega tus credenciales en el archivo `.env`

```bash
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

## 📦 Instalación de Dependencias

```bash
npm install @supabase/supabase-js
```
