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

    // Get user
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Get saved posts
    const savedPosts = await sql`
      SELECT * FROM saved_posts 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Get generations history
    const generations = await sql`
      SELECT id, created_at, ideas 
      FROM generations 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Get stats
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM saved_posts WHERE user_id = ${user.id}) as saved_count,
        (SELECT COUNT(*) FROM generations WHERE user_id = ${user.id}) as generation_count
    `;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        niche: user.niche,
        targetAudience: user.target_audience,
        linkedinName: user.linkedin_name,
        linkedinHeadline: user.linkedin_headline,
        createdAt: user.created_at,
      },
      savedPosts,
      generations: generations.map(g => ({
        id: g.id,
        createdAt: g.created_at,
        ideasCount: Array.isArray(g.ideas) ? g.ideas.length : 0,
      })),
      stats: {
        savedCount: Number(stats[0]?.saved_count || 0),
        generationCount: Number(stats[0]?.generation_count || 0),
      }
    });
  } catch (error: unknown) {
    console.error("Dashboard API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get dashboard data";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
