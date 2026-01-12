import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_Ekl1pFOTrP7g@ep-solitary-night-ah3efv5v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function initDB() {
  console.log("Creating tables...");

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
      ref_code VARCHAR(20) UNIQUE,
      referred_by VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW(),
      last_active TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ users table");

  await sql`
    CREATE TABLE IF NOT EXISTS generations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      ideas JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ generations table");

  await sql`
    CREATE TABLE IF NOT EXISTS saved_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      idea_title TEXT,
      post_content TEXT NOT NULL,
      tone VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ saved_posts table");

  await sql`
    CREATE TABLE IF NOT EXISTS emails_sent (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      email_type VARCHAR(50) NOT NULL,
      sent_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ emails_sent table");

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id)`;
  console.log("✓ indexes created");

  console.log("\nDatabase initialized successfully!");
}

initDB().catch(console.error);
