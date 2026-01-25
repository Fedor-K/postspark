import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

type VoiceStyle = "professional" | "casual" | "provocative";

interface ProfileUpdate {
  email: string;
  audience_pains?: string[];
  topics?: string[];
  voice_style?: VoiceStyle;
  examples_good?: string[];
}

// GET /api/profile?email=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await sql`
      SELECT
        id,
        email,
        user_type,
        niche,
        target_audience,
        linkedin_url,
        linkedin_name,
        linkedin_headline,
        twitter_handle,
        audience_pains,
        topics,
        voice_style,
        examples_good,
        created_at
      FROM users
      WHERE email = ${email}
    `;

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Форматируем профиль
    const profile = {
      // Базовые данные
      id: user[0].id,
      email: user[0].email,
      name: user[0].linkedin_name,
      role: user[0].user_type,
      niche: user[0].niche,
      linkedin_url: user[0].linkedin_url,
      linkedin_headline: user[0].linkedin_headline,
      twitter_handle: user[0].twitter_handle,

      // Аудитория
      audience_who: user[0].target_audience,
      audience_pains: user[0].audience_pains || [],

      // Контент
      topics: user[0].topics || [],

      // Голос
      voice_style: user[0].voice_style || "professional",
      examples_good: user[0].examples_good || [],

      // Мета
      created_at: user[0].created_at,

      // Статус заполненности профиля
      completion: calculateCompletion(user[0]),
    };

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get profile";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/profile — обновить профиль эксперта
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json() as ProfileUpdate;
    const { email, audience_pains, topics, voice_style, examples_good } = data;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Валидация voice_style
    if (voice_style) {
      const validStyles: VoiceStyle[] = ["professional", "casual", "provocative"];
      if (!validStyles.includes(voice_style)) {
        return NextResponse.json(
          { error: `Invalid voice_style. Must be one of: ${validStyles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const updated = await sql`
      UPDATE users
      SET
        audience_pains = COALESCE(${audience_pains || null}, audience_pains),
        topics = COALESCE(${topics || null}, topics),
        voice_style = COALESCE(${voice_style || null}, voice_style),
        examples_good = COALESCE(${examples_good || null}, examples_good),
        last_active = NOW()
      WHERE email = ${email}
      RETURNING
        id,
        email,
        user_type,
        niche,
        target_audience,
        linkedin_name,
        linkedin_headline,
        audience_pains,
        topics,
        voice_style,
        examples_good
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = updated[0];

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.linkedin_name,
        role: user.user_type,
        niche: user.niche,
        audience_who: user.target_audience,
        audience_pains: user.audience_pains || [],
        topics: user.topics || [],
        voice_style: user.voice_style || "professional",
        examples_good: user.examples_good || [],
        completion: calculateCompletion(user),
      },
    });
  } catch (error: unknown) {
    console.error("Update profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Рассчёт заполненности профиля
function calculateCompletion(user: Record<string, unknown>): {
  percent: number;
  missing: string[];
} {
  const fields = [
    { key: "user_type", label: "Тип пользователя" },
    { key: "niche", label: "Ниша" },
    { key: "target_audience", label: "Целевая аудитория" },
    { key: "audience_pains", label: "Боли аудитории", isArray: true },
    { key: "topics", label: "Темы контента", isArray: true },
    { key: "voice_style", label: "Стиль голоса" },
    { key: "examples_good", label: "Примеры фраз", isArray: true },
  ];

  const missing: string[] = [];

  for (const field of fields) {
    const value = user[field.key];
    if (field.isArray) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missing.push(field.label);
      }
    } else {
      if (!value) {
        missing.push(field.label);
      }
    }
  }

  const filled = fields.length - missing.length;
  const percent = Math.round((filled / fields.length) * 100);

  return { percent, missing };
}
