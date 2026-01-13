import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Ekl1pFOTrP7g@ep-solitary-night-ah3efv5v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function migrate() {
  try {
    // Magic link tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS magic_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('Auth tables created!');
  } catch (e) {
    console.error('Migration error:', e);
  }
}

migrate();
