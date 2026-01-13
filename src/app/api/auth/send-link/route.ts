import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://postspark.pro";

async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
  const magicLink = `${APP_URL}/api/auth/verify?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f97316; margin: 0;">PostSpark</h1>
        <p style="color: #6b7280;">LinkedIn Content for Solopreneurs</p>
      </div>
      
      <h2 style="color: #1f2937;">Sign in to PostSpark</h2>
      
      <p style="color: #4b5563; font-size: 16px;">
        Click the button below to sign in to your account. This link expires in 15 minutes.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}" 
           style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Sign In to PostSpark
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Or copy and paste this link in your browser:<br>
        <a href="${magicLink}" style="color: #f97316; word-break: break-all;">${magicLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PostSpark <hello@postspark.pro>",
        to: [email],
        subject: "Sign in to PostSpark",
        html: html,
      }),
    });

    const data = await response.json();
    console.log("Resend response:", data);
    return response.ok;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Check if user exists
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      return NextResponse.json({ error: "No account found with this email. Please complete onboarding first." }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old tokens for this email
    await sql`DELETE FROM magic_tokens WHERE email = ${email}`;

    // Save new token
    await sql`
      INSERT INTO magic_tokens (email, token, expires_at)
      VALUES (${email}, ${token}, ${expiresAt})
    `;

    // Send email
    const sent = await sendMagicLinkEmail(email, token);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Magic link sent!" });
  } catch (error) {
    console.error("Send link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
