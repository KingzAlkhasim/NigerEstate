/*
# Real Estate Dashboard Schema

1. New Tables
- `profiles`: Extends auth.users with agent-specific information (agency name, phone, avatar)
- `properties`: Real estate listings with property details, AI-generated descriptions, status, price
- `clients`: Client contacts with contact info, budget, preferences, status
- `property_clients`: Junction table linking properties to interested clients

2. Security
- Enable RLS on all tables
- Owner-scoped CRUD: each authenticated user can only access their own data
- user_id defaults to auth.uid() for automatic ownership assignment

3. Important Notes
- This is a multi-tenant app requiring authentication
- Each agent sees only their own properties, clients, and relationships
- Properties track status workflow (draft, available, under_contract, sold, withdrawn)
- Clients have status workflow (new, contacted, qualified, negotiating, closed, lost)
- AI descriptions stored in generated_description field
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  agency_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('apartment', 'house', 'land', 'commercial', 'duplex', 'townhouse', 'villa', 'office')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'available', 'under_contract', 'sold', 'withdrawn')),
  price numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  location text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'Lagos',
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  land_size_sqm numeric(10,2),
  built_area_sqm numeric(10,2),
  features text[],
  description text,
  generated_description text,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_properties" ON properties;
CREATE POLICY "select_own_properties" ON properties FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_properties" ON properties;
CREATE POLICY "insert_own_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_properties" ON properties;
CREATE POLICY "update_own_properties" ON properties FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_properties" ON properties;
CREATE POLICY "delete_own_properties" ON properties FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'closed', 'lost')),
  budget_min numeric(15,2),
  budget_max numeric(15,2),
  currency text NOT NULL DEFAULT 'NGN',
  preferred_locations text[],
  preferred_property_types text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clients" ON clients;
CREATE POLICY "select_own_clients" ON clients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_clients" ON clients;
CREATE POLICY "insert_own_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_clients" ON clients;
CREATE POLICY "update_own_clients" ON clients FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_clients" ON clients;
CREATE POLICY "delete_own_clients" ON clients FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(status);

CREATE TABLE IF NOT EXISTS property_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  interest_level text NOT NULL DEFAULT 'medium' CHECK (interest_level IN ('low', 'medium', 'high', 'very_high')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, client_id)
);

ALTER TABLE property_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_property_clients" ON property_clients;
CREATE POLICY "select_own_property_clients" ON property_clients FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_clients.property_id AND properties.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM clients WHERE clients.id = property_clients.client_id AND clients.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_property_clients" ON property_clients;
CREATE POLICY "insert_own_property_clients" ON property_clients FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_clients.property_id AND properties.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM clients WHERE clients.id = property_clients.client_id AND clients.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_property_clients" ON property_clients;
CREATE POLICY "update_own_property_clients" ON property_clients FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_clients.property_id AND properties.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_clients.property_id AND properties.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM clients WHERE clients.id = property_clients.client_id AND clients.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_property_clients" ON property_clients;
CREATE POLICY "delete_own_property_clients" ON property_clients FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_clients.property_id AND properties.user_id = auth.uid())
  );

CREATE INDEX idx_property_clients_property ON property_clients(property_id);
CREATE INDEX idx_property_clients_client ON property_clients(client_id);
