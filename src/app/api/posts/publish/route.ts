import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, post_id, linkedin_url, published_at } = await request.json();

    if (!email || !post_id) {
      return NextResponse.json({ error: "Email and post_id are required" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pubDate = published_at ? new Date(published_at) : new Date();

    const updated = await sql`
      UPDATE saved_posts
      SET 
        published_at = ${pubDate.toISOString()},
        linkedin_url = ${linkedin_url || null}
      WHERE id = ${post_id} AND user_id = ${users[0].id}
      RETURNING id, idea_title, published_at, linkedin_url
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: updated[0] });
  } catch (error: unknown) {
    console.error("Publish post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark as published" },
      { status: 500 }
    );
  }
}
