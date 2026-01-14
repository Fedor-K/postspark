import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    // Get session to verify user
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify session and get user info
    const sessions = await sql`
      SELECT s.user_id, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;

    // Reset onboarding fields (keep email, ref_code, created_at, saved_posts, generations)
    await sql`
      UPDATE users
      SET user_type = NULL,
          niche = NULL,
          target_audience = NULL,
          linkedin_url = NULL,
          linkedin_name = NULL,
          linkedin_headline = NULL,
          email_frequency = NULL,
          email_days = NULL,
          email_time = NULL,
          timezone = NULL
      WHERE id = ${userId}
    `;

    // Delete session to force re-login after onboarding
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;

    // Clear session cookie
    const response = NextResponse.json({ success: true, message: "Onboarding reset. Please complete onboarding again." });
    response.cookies.delete("session");

    return response;
  } catch (error: unknown) {
    console.error("Reset onboarding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to reset onboarding";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
