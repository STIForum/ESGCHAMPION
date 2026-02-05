-- =====================================================
-- ESG Champions Platform - Notifications System
-- Run this after complete-database-schema.sql
-- =====================================================

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'review_accepted',
        'review_rejected',
        'new_comment',
        'vote_received',
        'credits_awarded',
        'peer_joined',
        'new_panel',
        'admin_message',
        'system'
    )),
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_champion_id ON notifications(champion_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Champions can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Champions can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Champions can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = champion_id);

CREATE POLICY "Champions can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = champion_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_champion_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_link TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (champion_id, type, title, message, link, data)
    VALUES (p_champion_id, p_type, p_title, p_message, p_link, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications SET
        is_read = TRUE,
        read_at = NOW()
    WHERE id = p_notification_id AND champion_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications SET
        is_read = TRUE,
        read_at = NOW()
    WHERE champion_id = auth.uid() AND is_read = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_champion_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE champion_id = p_champion_id AND is_read = FALSE;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-notify on review acceptance
CREATE OR REPLACE FUNCTION notify_on_review_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM create_notification(
            NEW.champion_id,
            'review_accepted',
            'Review Accepted!',
            'Your review has been approved and you earned credits.',
            '/champion-dashboard.html',
            jsonb_build_object('review_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_accepted_notification
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
    EXECUTE FUNCTION notify_on_review_accepted();

-- Auto-notify on review rejection
CREATE OR REPLACE FUNCTION notify_on_review_rejected()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        PERFORM create_notification(
            NEW.champion_id,
            'review_rejected',
            'Review Feedback',
            COALESCE(NEW.feedback, 'Your review needs revision.'),
            '/champion-indicators.html?indicator=' || NEW.indicator_id,
            jsonb_build_object('review_id', NEW.id, 'feedback', NEW.feedback)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_rejected_notification
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.status = 'rejected' AND OLD.status != 'rejected')
    EXECUTE FUNCTION notify_on_review_rejected();

-- Auto-notify on new comment
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_review_author UUID;
BEGIN
    -- Get the review author
    SELECT champion_id INTO v_review_author
    FROM reviews WHERE id = NEW.review_id;
    
    -- Don't notify if commenting on own review
    IF v_review_author != NEW.champion_id THEN
        PERFORM create_notification(
            v_review_author,
            'new_comment',
            'New Comment on Your Review',
            LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
            '/champion-indicators.html?review=' || NEW.review_id,
            jsonb_build_object('comment_id', NEW.id, 'review_id', NEW.review_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_new_comment();

-- =====================================================
-- UPDATE TYPE CHECK CONSTRAINT (for existing tables)
-- =====================================================
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
    
    -- Add updated constraint with all notification types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'review_accepted',
        'review_rejected',
        'new_comment',
        'vote_received',
        'credits_awarded',
        'peer_joined',
        'new_panel',
        'admin_message',
        'system'
    ));
EXCEPTION
    WHEN others THEN
        -- Constraint may already be correct
        NULL;
END $$;

