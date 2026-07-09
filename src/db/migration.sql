-- ============================================================
-- MangaHub Database Migration
-- Generated from drizzle-orm schema
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Enable uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),
  avatar VARCHAR(500),
  banner VARCHAR(500),
  bio TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (username);

ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) NOT NULL DEFAULT 'dark',
  reading_direction VARCHAR(20) NOT NULL DEFAULT 'rtl',
  page_transition VARCHAR(20) NOT NULL DEFAULT 'slide',
  image_quality VARCHAR(20) NOT NULL DEFAULT 'high',
  auto_play BOOLEAN NOT NULL DEFAULT false,
  auto_play_delay INTEGER NOT NULL DEFAULT 3000,
  show_mature BOOLEAN NOT NULL DEFAULT false,
  languages JSONB NOT NULL DEFAULT '["en"]',
  notifications JSONB NOT NULL DEFAULT '{"email": true, "push": true, "newChapter": true, "libraryUpdates": true, "recommendations": true, "social": true}',
  privacy JSONB NOT NULL DEFAULT '{"profileVisibility": "public", "libraryVisibility": "public", "historyVisibility": "private", "activityVisibility": "public"}',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- USER STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  manga_read INTEGER NOT NULL DEFAULT 0,
  chapters_read INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL DEFAULT 0,
  favorite_genres JSONB NOT NULL DEFAULT '[]',
  reading_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- OAUTH ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope VARCHAR(500),
  id_token TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_provider_account_idx ON oauth_accounts (provider, provider_account_id);
CREATE INDEX IF NOT EXISTS oauth_user_idx ON oauth_accounts (user_id);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_idx ON sessions (token);
ALTER TABLE sessions ADD CONSTRAINT sessions_token_unique UNIQUE (token);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

-- ============================================================
-- MANGA
-- ============================================================
CREATE TABLE IF NOT EXISTS manga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  alt_titles JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  cover_image VARCHAR(500),
  banner_image VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
  type VARCHAR(20) NOT NULL DEFAULT 'manga',
  demographic VARCHAR(20),
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  follow_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  chapter_count INTEGER NOT NULL DEFAULT 0,
  volume_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  latest_chapter_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manga_title_idx ON manga (title);
CREATE INDEX IF NOT EXISTS manga_status_idx ON manga (status);
CREATE INDEX IF NOT EXISTS manga_type_idx ON manga (type);
CREATE INDEX IF NOT EXISTS manga_rating_idx ON manga (rating);
CREATE INDEX IF NOT EXISTS manga_follow_count_idx ON manga (follow_count);
CREATE INDEX IF NOT EXISTS manga_updated_at_idx ON manga (updated_at);

-- ============================================================
-- GENRES
-- ============================================================
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  manga_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE genres ADD CONSTRAINT genres_name_unique UNIQUE (name);
ALTER TABLE genres ADD CONSTRAINT genres_slug_unique UNIQUE (slug);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  "group" VARCHAR(50) NOT NULL,
  description TEXT,
  manga_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE tags ADD CONSTRAINT tags_slug_unique UNIQUE (slug);

-- ============================================================
-- AUTHORS
-- ============================================================
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  image VARCHAR(500),
  description TEXT,
  manga_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE authors ADD CONSTRAINT authors_slug_unique UNIQUE (slug);

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  image VARCHAR(500),
  description TEXT,
  manga_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE artists ADD CONSTRAINT artists_slug_unique UNIQUE (slug);

-- ============================================================
-- SCANLATOR GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS scanlator_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  website VARCHAR(500),
  discord VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE scanlator_groups ADD CONSTRAINT scanlator_groups_slug_unique UNIQUE (slug);

-- ============================================================
-- MANGA GENRES (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS manga_genres (
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, genre_id)
);

-- ============================================================
-- MANGA TAGS (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS manga_tags (
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, tag_id)
);

-- ============================================================
-- MANGA AUTHORS (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS manga_authors (
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, author_id)
);

-- ============================================================
-- MANGA ARTISTS (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS manga_artists (
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (manga_id, artist_id)
);

-- ============================================================
-- CHAPTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  number DECIMAL(10,2) NOT NULL,
  volume INTEGER,
  title VARCHAR(500),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  page_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chapters_manga_number_idx ON chapters (manga_id, number, language);
CREATE INDEX IF NOT EXISTS chapters_manga_idx ON chapters (manga_id);
CREATE INDEX IF NOT EXISTS chapters_published_at_idx ON chapters (published_at);

-- ============================================================
-- CHAPTER PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chapter_pages_chapter_number_idx ON chapter_pages (chapter_id, number);
CREATE INDEX IF NOT EXISTS chapter_pages_chapter_idx ON chapter_pages (chapter_id);

-- ============================================================
-- CHAPTER SCANLATOR GROUPS (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS chapter_scanlator_groups (
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES scanlator_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (chapter_id, group_id)
);

-- ============================================================
-- LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'plan_to_read',
  rating DECIMAL(3,2),
  progress INTEGER NOT NULL DEFAULT 0,
  last_read_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS library_user_manga_idx ON library (user_id, manga_id);
CREATE INDEX IF NOT EXISTS library_user_idx ON library (user_id);
CREATE INDEX IF NOT EXISTS library_status_idx ON library (status);
CREATE INDEX IF NOT EXISTS library_updated_at_idx ON library (updated_at);

-- ============================================================
-- HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  read_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS history_user_idx ON history (user_id);
CREATE INDEX IF NOT EXISTS history_manga_idx ON history (manga_id);
CREATE INDEX IF NOT EXISTS history_read_at_idx ON history (read_at);
CREATE UNIQUE INDEX IF NOT EXISTS history_user_manga_chapter_idx ON history (user_id, manga_id, chapter_id);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  score DECIMAL(5,4) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendations_user_idx ON recommendations (user_id);
CREATE INDEX IF NOT EXISTS recommendations_score_idx ON recommendations (score);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  rating DECIMAL(3,2) NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  is_spoiler BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_manga_idx ON reviews (user_id, manga_id);
CREATE INDEX IF NOT EXISTS reviews_manga_idx ON reviews (manga_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at);

-- ============================================================
-- REVIEW VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS review_votes_user_review_idx ON review_votes (user_id, review_id);

-- ============================================================
-- FOLLOWS (User-to-User)
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS follows_follower_following_idx ON follows (follower_id, following_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

-- ============================================================
-- MANGA FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS manga_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS manga_follows_user_manga_idx ON manga_follows (user_id, manga_id);
CREATE INDEX IF NOT EXISTS manga_follows_user_idx ON manga_follows (user_id);
CREATE INDEX IF NOT EXISTS manga_follows_manga_idx ON manga_follows (manga_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at);

-- ============================================================
-- FOREIGN KEY for manga.latest_chapter_id (self-referencing)
-- ============================================================
ALTER TABLE manga ADD CONSTRAINT fk_manga_latest_chapter
  FOREIGN KEY (latest_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL;