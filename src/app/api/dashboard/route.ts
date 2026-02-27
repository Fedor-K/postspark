import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    // One-time migration: add twitter_premium column (safe to run multiple times, remove after deployed)
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_premium BOOLEAN DEFAULT FALSE`; } catch { /* already exists */ }

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

    // Get generations history with ideas
    const generations = await sql`
      SELECT id, created_at, ideas, platform
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
        linkedinUrl: user.linkedin_url,
        linkedinName: user.linkedin_name,
        linkedinHeadline: user.linkedin_headline,
        emailFrequency: user.email_frequency,
        emailDays: user.email_days,
        emailTime: user.email_time,
        timezone: user.timezone,
        twitterHandle: user.twitter_handle,
        twitterAccountsToCopy: user.twitter_accounts_to_copy,
        twitterPremium: user.twitter_premium ?? false,
        createdAt: user.created_at,
      },
      savedPosts,
      generations: generations.map(g => ({
        id: g.id,
        createdAt: g.created_at,
        platform: g.platform || 'linkedin',
        ideasCount: Array.isArray(g.ideas) ? g.ideas.length : 0,
        ideas: g.ideas || [],
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
