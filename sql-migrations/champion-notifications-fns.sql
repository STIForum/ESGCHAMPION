-- =====================================================
-- Fix Notifications RLS Policies (idempotent)
-- =====================================================

-- 1. Enable RLS (safe to re-run)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Champions can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Champions can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications for any champion" ON notifications;
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;

-- 3. Create new policies

-- Champions can read only their own notifications
CREATE POLICY "Champions can read own notifications"
ON notifications
FOR SELECT
USING (champion_id = auth.uid());

-- Champions can update only their own notifications (e.g., mark as read)
CREATE POLICY "Champions can update own notifications"
ON notifications
FOR UPDATE
USING (champion_id = auth.uid())
WITH CHECK (champion_id = auth.uid());

-- Admins can insert notifications for any champion
CREATE POLICY "Admins can insert notifications for any champion"
ON notifications
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true
));

-- Admins can read all notifications (optional, for admin dashboards)
CREATE POLICY "Admins can read all notifications"
ON notifications
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true
));

-- =====================================================
-- Ensure your admin user(s) have is_admin = true
-- Run this separately (replace 'admin-email@example.com' with the actual email)
-- =====================================================
-- UPDATE champions SET is_admin = true WHERE email = 'admin-email@example.com';