CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"image" varchar(500),
	"description" text,
	"manga_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"image" varchar(500),
	"description" text,
	"manga_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chapter_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"url" varchar(500) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter_scanlator_groups" (
	"chapter_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "chapter_scanlator_groups_chapter_id_group_id_pk" PRIMARY KEY("chapter_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"number" numeric(10, 2) NOT NULL,
	"volume" integer,
	"title" varchar(500),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorial_collection_items" (
	"collection_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "editorial_collection_items_collection_id_manga_id_pk" PRIMARY KEY("collection_id","manga_id")
);
--> statement-breakpoint
CREATE TABLE "editorial_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'editorial' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "editorial_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"manga_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'plan_to_read' NOT NULL,
	"rating" numeric(3, 2),
	"progress" integer DEFAULT 0 NOT NULL,
	"last_read_chapter_id" uuid,
	"last_read_at" timestamp,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'plan_to_read' NOT NULL,
	"rating" numeric(3, 2),
	"progress" integer DEFAULT 0 NOT NULL,
	"last_read_chapter_id" uuid,
	"last_read_at" timestamp,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"alt_titles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"cover_image" varchar(500),
	"banner_image" varchar(500),
	"status" varchar(20) DEFAULT 'ongoing' NOT NULL,
	"type" varchar(20) DEFAULT 'manga' NOT NULL,
	"demographic" varchar(20),
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"follow_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"chapter_count" integer DEFAULT 0 NOT NULL,
	"volume_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"latest_chapter_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"views_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"follows_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"rating_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"freshness_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"editor_boost" numeric(10, 4) DEFAULT '0' NOT NULL,
	"final_trending_score" numeric(10, 4) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manga_artists" (
	"manga_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "manga_artists_manga_id_artist_id_pk" PRIMARY KEY("manga_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "manga_authors" (
	"manga_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "manga_authors_manga_id_author_id_pk" PRIMARY KEY("manga_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "manga_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manga_genres" (
	"manga_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "manga_genres_manga_id_genre_id_pk" PRIMARY KEY("manga_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "manga_tags" (
	"manga_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "manga_tags_manga_id_tag_id_pk" PRIMARY KEY("manga_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "manga_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"user_id" uuid,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"token_type" varchar(50),
	"scope" varchar(500),
	"id_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"score" numeric(5, 4) NOT NULL,
	"reason" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"manga_id" uuid NOT NULL,
	"rating" numeric(3, 2) NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"is_spoiler" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scanlator_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"website" varchar(500),
	"discord" varchar(500),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scanlator_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'info' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"group" varchar(50) NOT NULL,
	"description" text,
	"manga_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" varchar(20) DEFAULT 'dark' NOT NULL,
	"reading_direction" varchar(20) DEFAULT 'rtl' NOT NULL,
	"page_transition" varchar(20) DEFAULT 'slide' NOT NULL,
	"image_quality" varchar(20) DEFAULT 'high' NOT NULL,
	"auto_play" boolean DEFAULT false NOT NULL,
	"auto_play_delay" integer DEFAULT 3000 NOT NULL,
	"show_mature" boolean DEFAULT false NOT NULL,
	"languages" jsonb DEFAULT '["en"]'::jsonb NOT NULL,
	"notifications" jsonb DEFAULT '{"email":true,"push":true,"newChapter":true,"libraryUpdates":true,"recommendations":true,"social":true}'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{"profileVisibility":"public","libraryVisibility":"public","historyVisibility":"private","activityVisibility":"public"}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"manga_read" integer DEFAULT 0 NOT NULL,
	"chapters_read" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"days_active" integer DEFAULT 0 NOT NULL,
	"favorite_genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reading_streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"password_hash" varchar(255),
	"avatar" varchar(500),
	"banner" varchar(500),
	"bio" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" varchar(255),
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "chapter_pages" ADD CONSTRAINT "chapter_pages_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_scanlator_groups" ADD CONSTRAINT "chapter_scanlator_groups_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_scanlator_groups" ADD CONSTRAINT "chapter_scanlator_groups_group_id_scanlator_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."scanlator_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_collection_items" ADD CONSTRAINT "editorial_collection_items_collection_id_editorial_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."editorial_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_collection_items" ADD CONSTRAINT "editorial_collection_items_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_last_read_chapter_id_chapters_id_fk" FOREIGN KEY ("last_read_chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_last_read_chapter_id_chapters_id_fk" FOREIGN KEY ("last_read_chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_artists" ADD CONSTRAINT "manga_artists_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_artists" ADD CONSTRAINT "manga_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_authors" ADD CONSTRAINT "manga_authors_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_authors" ADD CONSTRAINT "manga_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_follows" ADD CONSTRAINT "manga_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_follows" ADD CONSTRAINT "manga_follows_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_genres" ADD CONSTRAINT "manga_genres_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_genres" ADD CONSTRAINT "manga_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_tags" ADD CONSTRAINT "manga_tags_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_tags" ADD CONSTRAINT "manga_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_views" ADD CONSTRAINT "manga_views_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_views" ADD CONSTRAINT "manga_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chapter_pages_chapter_number_idx" ON "chapter_pages" USING btree ("chapter_id","number");--> statement-breakpoint
CREATE INDEX "chapter_pages_chapter_idx" ON "chapter_pages" USING btree ("chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chapters_manga_number_idx" ON "chapters" USING btree ("manga_id","number","language");--> statement-breakpoint
CREATE INDEX "chapters_manga_idx" ON "chapters" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "chapters_published_at_idx" ON "chapters" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "editorial_collection_items_display_order_idx" ON "editorial_collection_items" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "editorial_collections_slug_idx" ON "editorial_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "editorial_collections_is_active_idx" ON "editorial_collections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "editorial_collections_priority_idx" ON "editorial_collections" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_follower_following_idx" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follows_follower_idx" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "history_user_idx" ON "history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "history_manga_idx" ON "history" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "history_read_at_idx" ON "history" USING btree ("read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "history_user_manga_chapter_idx" ON "history" USING btree ("user_id","manga_id","chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "library_user_manga_idx" ON "library" USING btree ("user_id","manga_id");--> statement-breakpoint
CREATE INDEX "library_user_idx" ON "library" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "library_status_idx" ON "library" USING btree ("status");--> statement-breakpoint
CREATE INDEX "library_updated_at_idx" ON "library" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "library_entries_user_manga_idx" ON "library_entries" USING btree ("user_id","manga_id");--> statement-breakpoint
CREATE INDEX "library_entries_user_idx" ON "library_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "library_entries_status_idx" ON "library_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "library_entries_updated_at_idx" ON "library_entries" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "manga_title_idx" ON "manga" USING btree ("title");--> statement-breakpoint
CREATE INDEX "manga_status_idx" ON "manga" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manga_type_idx" ON "manga" USING btree ("type");--> statement-breakpoint
CREATE INDEX "manga_rating_idx" ON "manga" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "manga_follow_count_idx" ON "manga" USING btree ("follow_count");--> statement-breakpoint
CREATE INDEX "manga_updated_at_idx" ON "manga" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "manga_final_trending_score_idx" ON "manga" USING btree ("final_trending_score");--> statement-breakpoint
CREATE UNIQUE INDEX "manga_follows_user_manga_idx" ON "manga_follows" USING btree ("user_id","manga_id");--> statement-breakpoint
CREATE INDEX "manga_follows_user_idx" ON "manga_follows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manga_follows_manga_idx" ON "manga_follows" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "manga_views_manga_idx" ON "manga_views" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "manga_views_user_idx" ON "manga_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manga_views_viewed_at_idx" ON "manga_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_provider_account_idx" ON "oauth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "oauth_user_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendations_user_idx" ON "recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendations_score_idx" ON "recommendations" USING btree ("score");--> statement-breakpoint
CREATE UNIQUE INDEX "review_votes_user_review_idx" ON "review_votes" USING btree ("user_id","review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_manga_idx" ON "reviews" USING btree ("user_id","manga_id");--> statement-breakpoint
CREATE INDEX "reviews_manga_idx" ON "reviews" USING btree ("manga_id");--> statement-breakpoint
CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "site_announcements_is_active_idx" ON "site_announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "site_announcements_priority_idx" ON "site_announcements" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "site_announcements_starts_at_idx" ON "site_announcements" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");