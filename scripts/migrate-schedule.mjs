import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Ekl1pFOTrP7g@ep-solitary-night-ah3efv5v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function migrate() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(20) DEFAULT 'weekly'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_days TEXT DEFAULT 'monday'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_time VARCHAR(10) DEFAULT '09:00'`;
    console.log('Migration done!');
  } catch (e) {
    console.error('Migration error:', e);
  }
}

migrate();
