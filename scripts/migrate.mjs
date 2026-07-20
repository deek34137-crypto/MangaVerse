import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL);

async function migrate() {
  console.log("Running remainder migration...\n");

  // Sessions — find actual column names before indexing
  const sessionCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'sessions' AND table_schema = 'public'
  `;
  const colNames = sessionCols.map(r => r.column_name);
  console.log("sessions columns:", colNames.join(", "));
  if (colNames.includes("session_token")) {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_idx ON sessions(session_token)`;
  } else if (colNames.includes("token")) {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token)`;
  }
  if (colNames.includes("expires")) {
    await sql`CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires)`;
  }
  console.log("✓ sessions indexes");

  // user_preferences
  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      theme VARCHAR(20) DEFAULT 'dark' NOT NULL,
      language VARCHAR(10) DEFAULT 'en' NOT NULL,
      reading_direction VARCHAR(20) DEFAULT 'ltr' NOT NULL,
      reading_mode VARCHAR(20) DEFAULT 'paginated' NOT NULL,
      page_fit VARCHAR(20) DEFAULT 'width' NOT NULL,
      show_nsfw BOOLEAN DEFAULT false NOT NULL,
      notification_email BOOLEAN DEFAULT true NOT NULL,
      notification_push BOOLEAN DEFAULT false NOT NULL,
      content_filter JSONB DEFAULT '[]' NOT NULL,
      excluded_genres JSONB DEFAULT '[]' NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ user_preferences");

  // user_stats
  await sql`
    CREATE TABLE IF NOT EXISTS user_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      manga_read INTEGER DEFAULT 0 NOT NULL,
      chapters_read INTEGER DEFAULT 0 NOT NULL,
      time_spent INTEGER DEFAULT 0 NOT NULL,
      avg_rating DECIMAL(3,2) DEFAULT 0 NOT NULL,
      favorite_genre VARCHAR(100),
      reading_streak INTEGER DEFAULT 0 NOT NULL,
      longest_streak INTEGER DEFAULT 0 NOT NULL,
      last_read_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ user_stats");

  // editorial_collections
  await sql`
    CREATE TABLE IF NOT EXISTS editorial_collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(100) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'editorial' NOT NULL,
      priority INTEGER DEFAULT 0 NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      starts_at TIMESTAMP,
      ends_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS editorial_collection_items (
      collection_id UUID NOT NULL REFERENCES editorial_collections(id) ON DELETE CASCADE,
      manga_id UUID NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0 NOT NULL,
      PRIMARY KEY (collection_id, manga_id)
    )
  `;
  console.log("✓ editorial tables");

  // site_announcements
  await sql`
    CREATE TABLE IF NOT EXISTS site_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info' NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      starts_at TIMESTAMP DEFAULT now() NOT NULL,
      ends_at TIMESTAMP,
      priority INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ site_announcements");

  // users extra columns
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
  console.log("✓ users extended columns");

  console.log("\n🎉 All done!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("\n❌ Failed:", err.message);
  process.exit(1);
});
