import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { cookies } from "next/headers";

const sql = neon(process.env.DATABASE_URL!);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://postspark.pro";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/login?error=invalid`);
    }

    // Find token
    const tokens = await sql`
      SELECT * FROM magic_tokens 
      WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
    `;

    if (tokens.length === 0) {
      return NextResponse.redirect(`${APP_URL}/login?error=expired`);
    }

    const magicToken = tokens[0];

    // Mark token as used
    await sql`UPDATE magic_tokens SET used = TRUE WHERE id = ${magicToken.id}`;

    // Find user
    const users = await sql`SELECT * FROM users WHERE email = ${magicToken.email}`;
    
    if (users.length === 0) {
      return NextResponse.redirect(`${APP_URL}/login?error=nouser`);
    }

    const user = users[0];

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sql`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `;

    // Update last_active
    await sql`UPDATE users SET last_active = NOW() WHERE id = ${user.id}`;

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(`${APP_URL}/login?error=server`);
  }
}
