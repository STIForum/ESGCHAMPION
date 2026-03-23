-- Drop existing functions first
DROP FUNCTION IF EXISTS mark_notification_read(uuid);
DROP FUNCTION IF EXISTS mark_all_notifications_read();
DROP FUNCTION IF EXISTS get_unread_notification_count(uuid);

-- Recreate mark_notification_read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE id = p_notification_id
      AND champion_id = auth.uid();
END;
$$;

-- Recreate mark_all_notifications_read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count int;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE champion_id = auth.uid()
      AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Recreate get_unread_notification_count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_champion_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cnt int;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM notifications
    WHERE champion_id = auth.uid()
      AND is_read = false;
    RETURN cnt;
END;
$$;