import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, content, tone, title, platform = 'linkedin' } = await request.json();

    if (!email || !content) {
      return NextResponse.json({ error: "Email and content are required" }, { status: 400 });
    }

    const user = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const savedPost = await sql`
      INSERT INTO saved_posts (user_id, idea_title, post_content, tone, platform)
      VALUES (${user[0].id}, ${title || null}, ${content}, ${tone || "professional"}, ${platform})
      RETURNING *
    `;

    return NextResponse.json({ post: savedPost[0] });
  } catch (error: unknown) {
    console.error("Save post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save post";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, content, tone, title, platform } = await request.json();

    if (!id || !content) {
      return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 });
    }

    const updatedPost = await sql`
      UPDATE saved_posts
      SET post_content = ${content},
          tone = ${tone || "professional"},
          idea_title = ${title || null},
          platform = COALESCE(${platform}, platform)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedPost.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: updatedPost[0] });
  } catch (error: unknown) {
    console.error("Update post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Ensure published_at column exists (will fail silently if exists)
    try {
      await sql`ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`;
    } catch {
      // Column might already exist
    }

    const updatedPost = await sql`
      UPDATE saved_posts
      SET published_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedPost.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: updatedPost[0] });
  } catch (error: unknown) {
    console.error("Publish post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish post";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    await sql`DELETE FROM saved_posts WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete post";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
