import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    // Get session to verify user
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify session and get user email
    const session = await sql`
      SELECT user_email FROM sessions
      WHERE id = ${sessionId} AND expires_at > NOW()
    `;

    if (session.length === 0) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const email = session[0].user_email;

    // Reset onboarding fields (keep email, ref_code, created_at)
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
      WHERE email = ${email}
    `;

    // Delete session to force re-login after onboarding
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;

    // Clear session cookie
    const response = NextResponse.json({ success: true, message: "Onboarding reset. Please complete onboarding again." });
    response.cookies.delete("session_id");

    return response;
  } catch (error: unknown) {
    console.error("Reset onboarding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to reset onboarding";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
