import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, post_id, views, likes, comments } = await request.json();

    if (!email || !post_id || views === undefined) {
      return NextResponse.json({ error: "Email, post_id and views are required" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await sql`
      UPDATE saved_posts
      SET
        views = ${Number(views)},
        likes = ${Number(likes || 0)},
        comments = ${Number(comments || 0)},
        stats_updated_at = NOW()
      WHERE id = ${post_id} AND user_id = ${users[0].id}
      RETURNING id
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Save to history
    await sql`
      INSERT INTO post_stats_history (saved_post_id, views, recorded_at)
      VALUES (${post_id}, ${Number(views)}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Update stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update stats" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const email = searchParams.get("email");

    if (!postId || !email) {
      return NextResponse.json({ error: "post_id and email are required" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify post belongs to user
    const post = await sql`
      SELECT id FROM saved_posts WHERE id = ${postId} AND user_id = ${users[0].id}
    `;
    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const history = await sql`
      SELECT views, recorded_at
      FROM post_stats_history
      WHERE saved_post_id = ${postId}
      ORDER BY recorded_at ASC
    `;

    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error("Stats history error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats history" },
      { status: 500 }
    );
  }
}
