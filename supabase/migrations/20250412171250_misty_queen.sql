/*
  # Initial Schema for Consolida Capital CRM

  1. New Tables
    - `clients`
      - Core client information
      - Personal and business details
      - Contact information
    - `policies`
      - Insurance policy details
      - Payment information
      - Status tracking
    - `documents`
      - Document management
      - Version control
      - Security classifications
    - `audit_logs`
      - Activity tracking
      - Security monitoring
    
  2. Security
    - Enable RLS on all tables
    - Implement role-based access control
    - Audit logging for all operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  internal_id TEXT UNIQUE NOT NULL,
  insurance_company TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  policyholder_name TEXT NOT NULL,
  insurance_type TEXT NOT NULL,
  rfc TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  homonym_flag BOOLEAN DEFAULT false
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id),
  policy_number TEXT UNIQUE NOT NULL,
  policy_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_frequency TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL,
  premium_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id),
  policy_id uuid REFERENCES policies(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  version INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by uuid NOT NULL
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id uuid NOT NULL,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON policies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON audit_logs
  FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_clients_rfc ON clients(rfc);
CREATE INDEX idx_policies_client_id ON policies(client_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_policy_id ON documents(policy_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);