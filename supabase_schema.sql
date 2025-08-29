-- =============================================
-- CRM Database Schema for Supabase
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (Authentication handled by Supabase Auth)
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACTS TABLE
-- =============================================
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEADS TABLE
-- =============================================
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'social_media', 'email_marketing', 'referral', 'cold_calling', 'event', 'advertisement', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'converted', 'lost')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DEALS TABLE
-- =============================================
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  pipeline_stage TEXT DEFAULT 'prospecting' CHECK (pipeline_stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITIES TABLE
-- =============================================
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'follow_up')),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEAMS TABLE (for team management)
-- =============================================
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEAM MEMBERS TABLE (Many-to-Many relationship)
-- =============================================
CREATE TABLE team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- =============================================
-- MARKETING CAMPAIGNS TABLE
-- =============================================
CREATE TABLE campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'social', 'web', 'content', 'event')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT,
  objectives JSONB,
  metrics JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKETS TABLE (Support system)
-- =============================================
CREATE TABLE tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'technical' CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'general')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  contact_id UUID REFERENCES contacts(id),
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  tags JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKET COMMENTS TABLE
-- =============================================
CREATE TABLE ticket_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for better performance
-- =============================================
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_deals_pipeline_stage ON deals(pipeline_stage);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_created_at ON deals(created_at);

CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_due_date ON activities(due_date);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_created_at ON activities(created_at);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);

-- =============================================
-- TRIGGERS for updated_at timestamps
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Basic policies for authenticated users
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to access all records (can be refined later)
CREATE POLICY "Authenticated users can view contacts" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contacts" ON contacts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view deals" ON deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert deals" ON deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update deals" ON deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete deals" ON deals FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view activities" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activities" ON activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update activities" ON activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete activities" ON activities FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view teams" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teams" ON teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view team_members" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team_members" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete team_members" ON team_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view campaigns" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaigns" ON campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaigns" ON campaigns FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view tickets" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tickets" ON tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tickets" ON tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tickets" ON tickets FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view ticket_comments" ON ticket_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ticket_comments" ON ticket_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ticket_comments" ON ticket_comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete ticket_comments" ON ticket_comments FOR DELETE TO authenticated USING (true);

-- =============================================
-- INSERT SAMPLE DATA (Optional)
-- =============================================
-- This will be handled through the application