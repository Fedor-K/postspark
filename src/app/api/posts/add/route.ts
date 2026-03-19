import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Add a post manually (not written in PostSpark)
export async function POST(request: NextRequest) {
  try {
    const { email, post_content, idea_title, linkedin_url, published_at, views, likes, comments } = await request.json();

    if (!email || !post_content) {
      return NextResponse.json({ error: "Email and post_content are required" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pubDate = published_at ? new Date(published_at) : new Date();

    const post = await sql`
      INSERT INTO saved_posts (
        user_id, idea_title, post_content, tone, platform,
        published_at, linkedin_url, views, likes, comments, stats_updated_at
      )
      VALUES (
        ${users[0].id},
        ${idea_title || null},
        ${post_content},
        'manual',
        'linkedin',
        ${pubDate.toISOString()},
        ${linkedin_url || null},
        ${Number(views || 0)},
        ${Number(likes || 0)},
        ${Number(comments || 0)},
        ${views ? 'NOW()' : null}
      )
      RETURNING *
    `;

    // Save initial stats to history if views provided
    if (views && Number(views) > 0) {
      await sql`
        INSERT INTO post_stats_history (saved_post_id, views, recorded_at)
        VALUES (${post[0].id}, ${Number(views)}, NOW())
      `;
    }

    return NextResponse.json({ post: post[0] });
  } catch (error: unknown) {
    console.error("Add post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add post" },
      { status: 500 }
    );
  }
}
