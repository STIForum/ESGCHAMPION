-- =====================================================
-- Business Notifications Table
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS business_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,

    -- Notification data
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    data JSONB DEFAULT '{}',

    -- Read state
    is_read BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_notifications_user ON business_notifications(business_user_id);
CREATE INDEX IF NOT EXISTS idx_business_notifications_read ON business_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_business_notifications_created_at ON business_notifications(created_at DESC);

ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business users can view own notifications" ON business_notifications;
CREATE POLICY "Business users can view own notifications" ON business_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM business_users bu
            WHERE bu.id = business_notifications.business_user_id
              AND bu.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Business users can update own notifications" ON business_notifications;
CREATE POLICY "Business users can update own notifications" ON business_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1
            FROM business_users bu
            WHERE bu.id = business_notifications.business_user_id
              AND bu.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can create business notifications" ON business_notifications;
CREATE POLICY "System can create business notifications" ON business_notifications
    FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_business_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_business_notifications_updated_at ON business_notifications;
CREATE TRIGGER trigger_business_notifications_updated_at
    BEFORE UPDATE ON business_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_business_notifications_updated_at();
