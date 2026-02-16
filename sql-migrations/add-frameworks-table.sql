-- =====================================================
-- Frameworks Table
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    owner_publisher TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')),
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frameworks_code ON frameworks(code);
CREATE INDEX IF NOT EXISTS idx_frameworks_status ON frameworks(status);
CREATE INDEX IF NOT EXISTS idx_frameworks_order ON frameworks(order_index);

ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view frameworks" ON frameworks;
CREATE POLICY "Anyone can view frameworks" ON frameworks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can create frameworks" ON frameworks;
CREATE POLICY "Admins can create frameworks" ON frameworks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update frameworks" ON frameworks;
CREATE POLICY "Admins can update frameworks" ON frameworks
    FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION update_frameworks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_frameworks_updated_at ON frameworks;
CREATE TRIGGER trigger_frameworks_updated_at
    BEFORE UPDATE ON frameworks
    FOR EACH ROW
    EXECUTE FUNCTION update_frameworks_updated_at();

-- Seed defaults if missing
INSERT INTO frameworks (name, code, version, owner_publisher, status, is_active, order_index)
SELECT 'GRI Standards', 'gri', '2024', 'GRI', 'active', true, 1
WHERE NOT EXISTS (SELECT 1 FROM frameworks WHERE LOWER(code) = 'gri');

INSERT INTO frameworks (name, code, version, owner_publisher, status, is_active, order_index)
SELECT 'ESRS', 'esrs', '1.0', 'EFRAG', 'active', true, 2
WHERE NOT EXISTS (SELECT 1 FROM frameworks WHERE LOWER(code) = 'esrs');

INSERT INTO frameworks (name, code, version, owner_publisher, status, is_active, order_index)
SELECT 'IFRS Sustainability', 'ifrs', 'S1/S2', 'ISSB', 'active', true, 3
WHERE NOT EXISTS (SELECT 1 FROM frameworks WHERE LOWER(code) = 'ifrs');
