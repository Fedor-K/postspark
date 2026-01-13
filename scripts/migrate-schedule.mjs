import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_Ekl1pFOTrP7g@ep-solitary-night-ah3efv5v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Adding schedule columns to users table...");

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(50) DEFAULT 'weekly'`;
    console.log("✓ email_frequency");
  } catch (e) { console.log("email_frequency exists"); }

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_days VARCHAR(100) DEFAULT 'monday'`;
    console.log("✓ email_days");
  } catch (e) { console.log("email_days exists"); }

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_time VARCHAR(10) DEFAULT '09:00'`;
    console.log("✓ email_time");
  } catch (e) { console.log("email_time exists"); }

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/New_York'`;
    console.log("✓ timezone");
  } catch (e) { console.log("timezone exists"); }

  console.log("\nMigration complete!");
}

migrate().catch(console.error);
