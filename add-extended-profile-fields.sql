-- Add extended profile fields to champions table
-- Run this in Supabase SQL Editor

-- Add new columns to champions table
ALTER TABLE champions ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS office_phone TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS competence_level TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS esg_contributions TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS primary_sector TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS expertise_area TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS ip_accepted BOOLEAN DEFAULT false;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS ip_accepted_at TIMESTAMPTZ;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS digital_signature_at TIMESTAMPTZ;

-- Update the trigger function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.champions (
        id, 
        email, 
        full_name,
        first_name,
        last_name,
        company, 
        job_title,
        mobile_number,
        office_phone,
        linkedin_url,
        website,
        competence_level,
        esg_contributions,
        primary_sector,
        expertise_area,
        cla_accepted, 
        nda_accepted,
        terms_accepted,
        ip_accepted,
        digital_signature
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'office_phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'linkedin_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'website', ''),
        COALESCE(NEW.raw_user_meta_data->>'competence_level', ''),
        COALESCE(NEW.raw_user_meta_data->>'esg_contributions', ''),
        COALESCE(NEW.raw_user_meta_data->>'primary_sector', ''),
        COALESCE(NEW.raw_user_meta_data->>'expertise_area', ''),
        COALESCE((NEW.raw_user_meta_data->>'cla_accepted')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'nda_accepted')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'ip_accepted')::boolean, false),
        COALESCE(NEW.raw_user_meta_data->>'digital_signature', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), champions.full_name),
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), champions.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), champions.last_name),
        company = COALESCE(NULLIF(EXCLUDED.company, ''), champions.company),
        job_title = COALESCE(NULLIF(EXCLUDED.job_title, ''), champions.job_title),
        mobile_number = COALESCE(NULLIF(EXCLUDED.mobile_number, ''), champions.mobile_number),
        office_phone = COALESCE(NULLIF(EXCLUDED.office_phone, ''), champions.office_phone),
        linkedin_url = COALESCE(NULLIF(EXCLUDED.linkedin_url, ''), champions.linkedin_url),
        website = COALESCE(NULLIF(EXCLUDED.website, ''), champions.website),
        competence_level = COALESCE(NULLIF(EXCLUDED.competence_level, ''), champions.competence_level),
        esg_contributions = COALESCE(NULLIF(EXCLUDED.esg_contributions, ''), champions.esg_contributions),
        primary_sector = COALESCE(NULLIF(EXCLUDED.primary_sector, ''), champions.primary_sector),
        expertise_area = COALESCE(NULLIF(EXCLUDED.expertise_area, ''), champions.expertise_area);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT 'Extended profile fields added successfully!' as status;

