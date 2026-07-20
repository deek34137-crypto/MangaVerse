-- Migration: 0001_editorial_announcements.sql
-- Create editorial collections and site announcements tables

CREATE TABLE IF NOT EXISTS editorial_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'editorial',
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editorial_collection_items (
    collection_id UUID NOT NULL REFERENCES editorial_collections(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (collection_id, manga_id)
);

CREATE TABLE IF NOT EXISTS site_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trending score columns to manga table
ALTER TABLE manga 
ADD COLUMN IF NOT EXISTS views_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS follows_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS freshness_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS editor_boost REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_trending_score REAL DEFAULT 0;

-- Seed "Editor's Picks" collection
INSERT INTO editorial_collections (slug, title, type, priority, is_active, starts_at)
VALUES ('editors-picks', 'Editor''s Picks', 'editorial', 100, true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Populate with top-rated manga (up to 10)
INSERT INTO editorial_collection_items (collection_id, manga_id, display_order)
SELECT 
    ec.id,
    m.id,
    ROW_NUMBER() OVER (ORDER BY m.rating DESC NULLS LAST) - 1
FROM editorial_collections ec
CROSS JOIN LATERAL (
    SELECT id FROM manga 
    WHERE status = 'ongoing' 
    ORDER BY rating DESC NULLS LAST 
    LIMIT 10
) m
WHERE ec.slug = 'editors-picks'
ON CONFLICT (collection_id, manga_id) DO NOTHING;