import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, userType, niche, targetAudience, linkedinUrl, linkedinName, linkedinHeadline } = await request.json();

    if (!email || !userType) {
      return NextResponse.json({ error: "Email and user type are required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (existingUser.length > 0) {
      // Update existing user
      const updated = await sql`
        UPDATE users 
        SET user_type = ${userType}, 
            niche = ${niche}, 
            target_audience = ${targetAudience},
            linkedin_url = ${linkedinUrl || null},
            linkedin_name = ${linkedinName || null},
            linkedin_headline = ${linkedinHeadline || null},
            last_active = NOW()
        WHERE email = ${email}
        RETURNING *
      `;
      return NextResponse.json({ user: updated[0], isNew: false });
    }

    // Create new user
    const refCode = generateRefCode();
    const newUser = await sql`
      INSERT INTO users (email, user_type, niche, target_audience, linkedin_url, linkedin_name, linkedin_headline, ref_code)
      VALUES (${email}, ${userType}, ${niche}, ${targetAudience}, ${linkedinUrl || null}, ${linkedinName || null}, ${linkedinHeadline || null}, ${refCode})
      RETURNING *
    `;

    return NextResponse.json({ user: newUser[0], isNew: true });
  } catch (error: unknown) {
    console.error("User API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error: unknown) {
    console.error("User GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { email, twitterAccountsToCopy, twitterHandle } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE users
      SET
        twitter_accounts_to_copy = COALESCE(${twitterAccountsToCopy}, twitter_accounts_to_copy),
        twitter_handle = COALESCE(${twitterHandle}, twitter_handle),
        last_active = NOW()
      WHERE email = ${email}
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated[0] });
  } catch (error: unknown) {
    console.error("User PATCH error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
