-- =====================================================
-- ESG Champions Platform - User Progress Tracking
-- Run this after complete-database-schema.sql
-- =====================================================

-- Add progress tracking columns to champions table if they don't exist
DO $$
BEGIN
    -- Add last_active_panel_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'champions' AND column_name = 'last_active_panel_id'
    ) THEN
        ALTER TABLE champions ADD COLUMN last_active_panel_id UUID REFERENCES panels(id);
    END IF;
    
    -- Add last_active_indicator_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'champions' AND column_name = 'last_active_indicator_id'
    ) THEN
        ALTER TABLE champions ADD COLUMN last_active_indicator_id UUID REFERENCES indicators(id);
    END IF;
    
    -- Add last_activity_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'champions' AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE champions ADD COLUMN last_activity_at TIMESTAMPTZ;
    END IF;
END
$$;

-- =====================================================
-- CHAMPION ACTIVITY TABLE (Detailed Activity Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS champion_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login',
        'view_panel',
        'view_indicator',
        'submit_review',
        'edit_review',
        'vote',
        'comment',
        'profile_update'
    )),
    panel_id UUID REFERENCES panels(id),
    indicator_id UUID REFERENCES indicators(id),
    review_id UUID REFERENCES reviews(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity tracking
CREATE INDEX IF NOT EXISTS idx_champion_activity_champion_id ON champion_activity(champion_id);
CREATE INDEX IF NOT EXISTS idx_champion_activity_type ON champion_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_champion_activity_created_at ON champion_activity(created_at DESC);

-- RLS for activity table
ALTER TABLE champion_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Champions can view own activity" ON champion_activity
    FOR SELECT USING (auth.uid() = champion_id);

CREATE POLICY "Champions can log own activity" ON champion_activity
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Admins can view all activity" ON champion_activity
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log champion activity and update progress
CREATE OR REPLACE FUNCTION log_champion_activity(
    p_champion_id UUID,
    p_activity_type TEXT,
    p_panel_id UUID DEFAULT NULL,
    p_indicator_id UUID DEFAULT NULL,
    p_review_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    -- Insert activity log
    INSERT INTO champion_activity (
        champion_id, activity_type, panel_id, indicator_id, review_id, metadata
    ) VALUES (
        p_champion_id, p_activity_type, p_panel_id, p_indicator_id, p_review_id, p_metadata
    ) RETURNING id INTO v_activity_id;
    
    -- Update progress tracking on champions table
    IF p_panel_id IS NOT NULL OR p_indicator_id IS NOT NULL THEN
        UPDATE champions SET
            last_active_panel_id = COALESCE(p_panel_id, last_active_panel_id),
            last_active_indicator_id = COALESCE(p_indicator_id, last_active_indicator_id),
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = p_champion_id;
    ELSE
        UPDATE champions SET
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = p_champion_id;
    END IF;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get champion's last activity for resume
CREATE OR REPLACE FUNCTION get_champion_resume_point(p_champion_id UUID)
RETURNS TABLE (
    panel_id UUID,
    panel_name TEXT,
    indicator_id UUID,
    indicator_name TEXT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.last_active_panel_id,
        p.name AS panel_name,
        c.last_active_indicator_id,
        i.name AS indicator_name,
        c.last_activity_at
    FROM champions c
    LEFT JOIN panels p ON p.id = c.last_active_panel_id
    LEFT JOIN indicators i ON i.id = c.last_active_indicator_id
    WHERE c.id = p_champion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get champion activity summary
CREATE OR REPLACE FUNCTION get_champion_activity_summary(
    p_champion_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    activity_type TEXT,
    count BIGINT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.activity_type,
        COUNT(*) as count,
        MAX(ca.created_at) as last_activity
    FROM champion_activity ca
    WHERE ca.champion_id = p_champion_id
    AND ca.created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY ca.activity_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

