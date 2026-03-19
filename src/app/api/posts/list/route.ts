import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Ensure columns exist
    try {
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS linkedin_url TEXT`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMP`;
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'linkedin'`;
    } catch {
      // Columns already exist
    }

    // Ensure post_stats_history table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS post_stats_history (
          id SERIAL PRIMARY KEY,
          saved_post_id INTEGER REFERENCES saved_posts(id) ON DELETE CASCADE,
          views INTEGER NOT NULL DEFAULT 0,
          recorded_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_post_stats_post ON post_stats_history(saved_post_id)`;
    } catch {
      // Table already exists
    }

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await sql`
      SELECT 
        id,
        idea_title,
        LEFT(post_content, 200) AS post_content,
        tone,
        platform,
        published_at,
        linkedin_url,
        views,
        likes,
        comments,
        stats_updated_at,
        created_at
      FROM saved_posts
      WHERE user_id = ${users[0].id}
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT 50
    `;

    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("List posts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
