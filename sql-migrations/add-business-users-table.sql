-- =====================================================
-- Business Users Table for SME Portal
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create business_users table
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_registration_number TEXT,
    role_designation TEXT,
    industry TEXT,
    reporting_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    
    -- Contact Details
    business_email TEXT NOT NULL UNIQUE,
    mobile_number TEXT,
    office_phone TEXT,
    linkedin_url TEXT,
    website TEXT,
    
    -- Business Profile
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    country TEXT,
    business_address TEXT,
    
    -- Sustainability Focus
    primary_esg_focus TEXT CHECK (primary_esg_focus IN ('environmental', 'social', 'governance', 'all')),
    ongoing_esg_initiatives TEXT,
    
    -- Account Status
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
    account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'complete', 'incomplete')),
    
    -- Avatar and profile
    avatar_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_users_auth_user_id ON business_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_email ON business_users(business_email);
CREATE INDEX IF NOT EXISTS idx_business_users_company ON business_users(company_name);

-- Enable RLS
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Business users can view own profile" ON business_users;
CREATE POLICY "Business users can view own profile" ON business_users
    FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Business users can update own profile" ON business_users;
CREATE POLICY "Business users can update own profile" ON business_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Anyone can insert business users" ON business_users;
CREATE POLICY "Anyone can insert business users" ON business_users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all business users" ON business_users;
CREATE POLICY "Admins can view all business users" ON business_users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_business_users_updated_at ON business_users;
CREATE TRIGGER trigger_business_users_updated_at
    BEFORE UPDATE ON business_users
    FOR EACH ROW
    EXECUTE FUNCTION update_business_users_updated_at();

-- Add user_type column to help identify user type during login
-- This is optional - we can also check both tables
ALTER TABLE champions ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'champion';
