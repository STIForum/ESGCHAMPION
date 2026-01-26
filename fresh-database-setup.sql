-- =====================================================
-- ESG Champions Platform - FRESH DATABASE SETUP
-- =====================================================
-- This script will DROP ALL EXISTING TABLES and recreate them
-- with proper RLS policies that avoid infinite recursion.
-- 
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sqxezltdeebvhgxsgxfj/sql/new
-- =====================================================

-- Step 1: DROP ALL EXISTING TABLES (in correct order due to foreign keys)
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS accepted_reviews CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS indicators CASCADE;
DROP TABLE IF EXISTS panels CASCADE;
DROP TABLE IF EXISTS panel_review_submissions CASCADE;
DROP TABLE IF EXISTS panel_review_indicator_reviews CASCADE;
DROP TABLE IF EXISTS champions CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.accept_review(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_review(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_champion_progress(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_review_count() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CHAMPIONS TABLE (Users)
-- =====================================================
CREATE TABLE champions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    credits INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    accepted_reviews_count INTEGER DEFAULT 0,
    cla_accepted BOOLEAN DEFAULT FALSE,
    nda_accepted BOOLEAN DEFAULT FALSE,
    cla_accepted_at TIMESTAMPTZ,
    nda_accepted_at TIMESTAMPTZ,
    last_active_panel_id UUID,
    last_active_indicator_id UUID,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PANELS TABLE (ESG Categories)
-- =====================================================
CREATE TABLE panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT,
    color TEXT,
    impact TEXT CHECK (impact IN ('High', 'Medium', 'Foundational')),
    esg_classification TEXT CHECK (esg_classification IN ('Environment', 'Social', 'Governance')),
    primary_framework TEXT CHECK (primary_framework IN ('GRI', 'ESRS', 'SASB', 'SME Hub', 'Other')),
    related_sdgs TEXT[],
    purpose TEXT,
    unicode TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICATORS TABLE (ESG Metrics)
-- =====================================================
CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    methodology TEXT,
    data_source TEXT,
    unit TEXT,
    frequency TEXT,
    code TEXT,
    primary_framework TEXT CHECK (primary_framework IN ('GRI', 'ESRS', 'SASB', 'SME Hub', 'Other')),
    framework_version TEXT,
    why_it_matters TEXT,
    impact_level TEXT CHECK (impact_level IN ('High', 'Medium', 'Foundational')),
    difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Moderate', 'Complex')),
    estimated_time TEXT,
    esg_class TEXT CHECK (esg_class IN ('Environment', 'Social', 'Governance')),
    related_sdgs TEXT[],
    validation_question TEXT,
    response_type TEXT CHECK (response_type IN ('Multiple Choice', 'Yes-No', 'Short Text', 'Long Text')),
    tags TEXT,
    icon TEXT,
    formula_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVIEWS TABLE (Champion Submissions)
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
    feedback TEXT,
    reviewed_by UUID REFERENCES champions(id),
    reviewed_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES champions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACCEPTED REVIEWS TABLE
-- =====================================================
CREATE TABLE accepted_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_review_id UUID REFERENCES reviews(id),
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER,
    credits_awarded INTEGER DEFAULT 10,
    accepted_by UUID REFERENCES champions(id),
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VOTES TABLE (Community Voting)
-- =====================================================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, champion_id)
);

-- =====================================================
-- COMMENTS TABLE (Review Discussions)
-- =====================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    champion_id UUID REFERENCES champions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN ACTIONS LOG
-- =====================================================
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES champions(id),
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVITATIONS TABLE
-- =====================================================
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    invited_by UUID REFERENCES champions(id),
    role TEXT DEFAULT 'champion',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PANEL REVIEW SUBMISSIONS (for multi-indicator reviews)
-- =====================================================
CREATE TABLE panel_review_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partial')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES champions(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PANEL REVIEW INDICATOR REVIEWS (individual indicator reviews)
-- =====================================================
CREATE TABLE panel_review_indicator_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES panel_review_submissions(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    champion_id UUID NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    
    -- Assessment fields
    sme_context TEXT,
    cost_to_collect TEXT,
    relevance_to_sme TEXT,
    clarity_and_language TEXT,
    data_availability TEXT,
    additional_guidance TEXT,
    suggested_tier TEXT,
    sdgs INTEGER[],
    tags TEXT[],
    notes TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    reviewed_by UUID REFERENCES champions(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(submission_id, indicator_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_champions_email ON champions(email);
CREATE INDEX idx_champions_is_admin ON champions(is_admin);
CREATE INDEX idx_reviews_champion_id ON reviews(champion_id);
CREATE INDEX idx_reviews_indicator_id ON reviews(indicator_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_indicators_panel_id ON indicators(panel_id);
CREATE INDEX idx_votes_review_id ON votes(review_id);
CREATE INDEX idx_comments_review_id ON comments(review_id);
CREATE INDEX idx_accepted_reviews_champion_id ON accepted_reviews(champion_id);
CREATE INDEX idx_panel_review_submissions_champion ON panel_review_submissions(champion_id);
CREATE INDEX idx_panel_review_submissions_panel ON panel_review_submissions(panel_id);
CREATE INDEX idx_panel_review_indicator_reviews_submission ON panel_review_indicator_reviews(submission_id);

-- =====================================================
-- SECURITY DEFINER FUNCTION FOR ADMIN CHECK
-- This avoids infinite recursion by bypassing RLS
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status FROM public.champions WHERE id = check_user_id;
    RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accepted_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_review_indicator_reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CHAMPIONS POLICIES (NO RECURSION - don't reference champions in champions policies)
-- =====================================================
CREATE POLICY "Anyone can view champions" ON champions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON champions
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON champions
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- PANELS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view panels" ON panels
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert panels" ON panels
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update panels" ON panels
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete panels" ON panels
    FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- INDICATORS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view indicators" ON indicators
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert indicators" ON indicators
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update indicators" ON indicators
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete indicators" ON indicators
    FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = champion_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete reviews" ON reviews
    FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- ACCEPTED REVIEWS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view accepted reviews" ON accepted_reviews
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert accepted reviews" ON accepted_reviews
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update accepted reviews" ON accepted_reviews
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- =====================================================
-- VOTES POLICIES
-- =====================================================
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON votes
    FOR ALL USING (auth.uid() = champion_id);

-- =====================================================
-- COMMENTS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = champion_id);

-- =====================================================
-- ADMIN ACTIONS POLICIES
-- =====================================================
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create admin actions" ON admin_actions
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- INVITATIONS POLICIES
-- =====================================================
CREATE POLICY "Admins can manage invitations" ON invitations
    FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- PANEL REVIEW SUBMISSIONS POLICIES
-- =====================================================
CREATE POLICY "Users can view own submissions" ON panel_review_submissions
    FOR SELECT USING (auth.uid() = champion_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create submissions" ON panel_review_submissions
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Users and admins can update submissions" ON panel_review_submissions
    FOR UPDATE USING (auth.uid() = champion_id OR public.is_admin(auth.uid()));

-- =====================================================
-- PANEL REVIEW INDICATOR REVIEWS POLICIES
-- =====================================================
CREATE POLICY "Users can view own indicator reviews" ON panel_review_indicator_reviews
    FOR SELECT USING (auth.uid() = champion_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create indicator reviews" ON panel_review_indicator_reviews
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Users and admins can update indicator reviews" ON panel_review_indicator_reviews
    FOR UPDATE USING (auth.uid() = champion_id OR public.is_admin(auth.uid()));

-- =====================================================
-- TRIGGER: Auto-create champion profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.champions (id, email, full_name, credits, is_verified, is_admin, cla_accepted, nda_accepted)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        0,
        false,
        false,
        COALESCE((NEW.raw_user_meta_data->>'cla_accepted')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'nda_accepted')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.champions.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER champions_updated_at BEFORE UPDATE ON champions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER panels_updated_at BEFORE UPDATE ON panels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER indicators_updated_at BEFORE UPDATE ON indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- TRIGGER: Increment review count on new review
-- =====================================================
CREATE OR REPLACE FUNCTION increment_review_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE champions SET
        total_reviews = total_reviews + 1,
        updated_at = NOW()
    WHERE id = NEW.champion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_count_trigger AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION increment_review_count();

-- =====================================================
-- FUNCTIONS FOR REVIEW MANAGEMENT
-- =====================================================
CREATE OR REPLACE FUNCTION accept_review(review_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_review reviews%ROWTYPE;
    v_credits INTEGER := 10;
BEGIN
    SELECT * INTO v_review FROM reviews WHERE id = review_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Review not found';
    END IF;
    
    IF v_review.status = 'approved' THEN
        RAISE EXCEPTION 'Review already approved';
    END IF;
    
    UPDATE reviews SET 
        status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = review_id;
    
    INSERT INTO accepted_reviews (
        original_review_id, champion_id, indicator_id, panel_id,
        content, rating, credits_awarded, accepted_by
    ) VALUES (
        v_review.id, v_review.champion_id, v_review.indicator_id,
        v_review.panel_id, v_review.content, v_review.rating,
        v_credits, admin_id
    );
    
    UPDATE champions SET
        credits = credits + v_credits,
        accepted_reviews_count = accepted_reviews_count + 1,
        updated_at = NOW()
    WHERE id = v_review.champion_id;
    
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (admin_id, 'accept_review', 'review', review_id, 
        jsonb_build_object('credits_awarded', v_credits));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_review(review_id UUID, admin_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reviews SET
        status = 'deleted',
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = admin_id,
        feedback = COALESCE(reason, feedback),
        updated_at = NOW()
    WHERE id = review_id;
    
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (admin_id, 'delete_review', 'review', review_id,
        jsonb_build_object('reason', reason));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_review TO authenticated;

-- =====================================================
-- CREATE CHAMPION RECORD FOR EXISTING AUTH USER
-- =====================================================
INSERT INTO public.champions (id, email, full_name, credits, is_verified, is_admin)
VALUES (
    '412ff744-ad69-4f17-b599-9c71e47269b3',
    'kparobo6829@gmail.com',
    'emmy whyte',
    0,
    true,
    true  -- Making this user an admin
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_verified = true,
    is_admin = true;

-- =====================================================
-- DONE! Your database is now set up correctly.
-- =====================================================
