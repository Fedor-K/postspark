import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, content, tone, title } = await request.json();

    if (!email || !content) {
      return NextResponse.json({ error: "Email and content are required" }, { status: 400 });
    }

    // Get user by email
    const user = await sql`SELECT id FROM users WHERE email = ${email}`;
    
    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save the post
    const savedPost = await sql`
      INSERT INTO saved_posts (user_id, idea_title, post_content, tone)
      VALUES (${user[0].id}, ${title || null}, ${content}, ${tone || "professional"})
      RETURNING *
    `;

    return NextResponse.json({ post: savedPost[0] });
  } catch (error: unknown) {
    console.error("Save post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save post";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
