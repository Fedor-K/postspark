import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Initialize database tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      user_type VARCHAR(50) NOT NULL,
      niche VARCHAR(100),
      target_audience TEXT,
      linkedin_url VARCHAR(500),
      linkedin_name VARCHAR(255),
      linkedin_headline TEXT,
      twitter_handle VARCHAR(100),
      ref_code VARCHAR(20) UNIQUE,
      referred_by VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW(),
      last_active TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add twitter_handle column if it doesn't exist (for existing databases)
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(100)`;
  } catch {
    // Column might already exist
  }

  // Add twitter_accounts_to_copy column for style copying feature
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_accounts_to_copy TEXT`;
  } catch {
    // Column might already exist
  }

  // Add twitter_premium column for premium/long-form posts
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_premium BOOLEAN DEFAULT FALSE`;
  } catch {
    // Column might already exist
  }

  await sql`
    CREATE TABLE IF NOT EXISTS generations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      ideas JSONB NOT NULL,
      platform VARCHAR(20) DEFAULT 'linkedin',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add platform column if it doesn't exist (for existing databases)
  try {
    await sql`ALTER TABLE generations ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'linkedin'`;
  } catch {
    // Column might already exist
  }

  await sql`
    CREATE TABLE IF NOT EXISTS saved_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      idea_title TEXT,
      post_content TEXT NOT NULL,
      tone VARCHAR(50),
      platform VARCHAR(20) DEFAULT 'linkedin',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add platform column if it doesn't exist (for existing databases)
  try {
    await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'linkedin'`;
  } catch {
    // Column might already exist
  }

  await sql`
    CREATE TABLE IF NOT EXISTS emails_sent (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      email_type VARCHAR(50) NOT NULL,
      sent_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id)
  `;
}
