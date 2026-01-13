import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const sessions = await sql`
      SELECT s.*, u.email, u.linkedin_name, u.user_type, u.niche
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ user: null });
    }

    const session = sessions[0];

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        name: session.linkedin_name,
        userType: session.user_type,
        niche: session.niche,
      }
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null });
  }
}
