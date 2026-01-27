-- =====================================================
-- ESG Champions Platform - Complete Database Schema
-- Run this in Supabase SQL Editor first
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CHAMPIONS TABLE (Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS champions (
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
CREATE TABLE IF NOT EXISTS panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN (
        'environmental', 'social', 'governance',
        'Energy & Resource Use',
        'Climate & GHG Emissions',
        'Water, Waste & Circularity',
        'Biodiversity & Land Use',
        'Pollution & Air Quality',
        'Workforce & Labour Practices',
        'Diversity, Equity & Inclusion (DEI)',
        'Human Rights & Supply Chain',
        'Community & Social Impact',
        'Health & Safety',
        'Ethics, Compliance & Anti-Corruption',
        'Risk Management & Resilience',
        'Data Privacy & Cybersecurity',
        'Product Responsibility & Quality',
        'ESG Strategy, Materiality & Innovation'
    )),
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
CREATE TABLE IF NOT EXISTS indicators (
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
CREATE TABLE IF NOT EXISTS reviews (
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
CREATE TABLE IF NOT EXISTS accepted_reviews (
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
CREATE TABLE IF NOT EXISTS votes (
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
CREATE TABLE IF NOT EXISTS comments (
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
CREATE TABLE IF NOT EXISTS admin_actions (
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
CREATE TABLE IF NOT EXISTS invitations (
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
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_champions_email ON champions(email);
CREATE INDEX IF NOT EXISTS idx_champions_is_admin ON champions(is_admin);
CREATE INDEX IF NOT EXISTS idx_reviews_champion_id ON reviews(champion_id);
CREATE INDEX IF NOT EXISTS idx_reviews_indicator_id ON reviews(indicator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicators_panel_id ON indicators(panel_id);
CREATE INDEX IF NOT EXISTS idx_votes_review_id ON votes(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);
CREATE INDEX IF NOT EXISTS idx_accepted_reviews_champion_id ON accepted_reviews(champion_id);

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

-- Champions policies
CREATE POLICY "Champions can view all champions" ON champions
    FOR SELECT USING (true);

CREATE POLICY "Champions can update own profile" ON champions
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Champions can insert own profile" ON champions
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Panels policies (public read)
CREATE POLICY "Anyone can view active panels" ON panels
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage panels" ON panels
    FOR ALL USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Indicators policies (public read)
CREATE POLICY "Anyone can view active indicators" ON indicators
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage indicators" ON indicators
    FOR ALL USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Reviews policies
CREATE POLICY "Anyone can view non-deleted reviews" ON reviews
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Champions can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Champions can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = champion_id OR 
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true));

-- Accepted reviews policies
CREATE POLICY "Anyone can view accepted reviews" ON accepted_reviews
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage accepted reviews" ON accepted_reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Votes policies
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Champions can manage own votes" ON votes
    FOR ALL USING (auth.uid() = champion_id);

-- Comments policies
CREATE POLICY "Anyone can view non-deleted comments" ON comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Champions can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = champion_id);

CREATE POLICY "Champions can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = champion_id);

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can create admin actions" ON admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Invitations policies
CREATE POLICY "Admins can manage invitations" ON invitations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to accept a review
CREATE OR REPLACE FUNCTION accept_review(review_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_review reviews%ROWTYPE;
    v_credits INTEGER := 10;
BEGIN
    -- Get the review
    SELECT * INTO v_review FROM reviews WHERE id = review_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Review not found';
    END IF;
    
    -- Check if already accepted
    IF v_review.status = 'approved' THEN
        RAISE EXCEPTION 'Review already approved';
    END IF;
    
    -- Update review status
    UPDATE reviews SET 
        status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = review_id;
    
    -- Create accepted review record
    INSERT INTO accepted_reviews (
        original_review_id, champion_id, indicator_id, panel_id,
        content, rating, credits_awarded, accepted_by
    ) VALUES (
        v_review.id, v_review.champion_id, v_review.indicator_id,
        v_review.panel_id, v_review.content, v_review.rating,
        v_credits, admin_id
    );
    
    -- Update champion credits and counts
    UPDATE champions SET
        credits = credits + v_credits,
        accepted_reviews_count = accepted_reviews_count + 1,
        updated_at = NOW()
    WHERE id = v_review.champion_id;
    
    -- Log admin action
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (admin_id, 'accept_review', 'review', review_id, 
        jsonb_build_object('credits_awarded', v_credits));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a review (soft delete)
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
    
    -- Log admin action
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (admin_id, 'delete_review', 'review', review_id,
        jsonb_build_object('reason', reason));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update champion progress
CREATE OR REPLACE FUNCTION update_champion_progress(
    p_champion_id UUID,
    p_panel_id UUID,
    p_indicator_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE champions SET
        last_active_panel_id = p_panel_id,
        last_active_indicator_id = p_indicator_id,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = p_champion_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER champions_updated_at
    BEFORE UPDATE ON champions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER panels_updated_at
    BEFORE UPDATE ON panels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment total reviews count on new review
CREATE OR REPLACE FUNCTION increment_review_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE champions SET
        total_reviews = total_reviews + 1,
        updated_at = NOW()
    WHERE id = NEW.champion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_count_trigger
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION increment_review_count();

