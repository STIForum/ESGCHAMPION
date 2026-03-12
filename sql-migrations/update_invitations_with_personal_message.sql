ALTER TABLE public.invitations
    ADD COLUMN IF NOT EXISTS personal_message text;