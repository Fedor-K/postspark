import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { generateWithClaude } from "@/lib/anthropic";
import { createTwitterPrompt, createIdeaPrompt, getDayTheme, getContentTypes } from "@/lib/twitter-prompts";

const sql = neon(process.env.DATABASE_URL!);
const CRON_SECRET = process.env.CRON_SECRET || "postspark-weekly-2024-secret";

interface AutopilotUser {
  id: number;
  email: string;
  user_type: string;
  niche: string;
  target_audience: string;
  twitter_handle: string;
  twitter_premium: boolean;
}

interface Idea {
  title: string;
  description: string;
  format: string;
}

function cleanAndParseIdeas(text: string): Idea[] {
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/([\r\n]+)/g, " ")
      .replace(/\s+/g, " ");

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.ideas && Array.isArray(parsed.ideas)) {
        return parsed.ideas;
      }
    } catch (e) {
      console.log("JSON parse failed for ideas, trying manual extraction", e);
    }
  }

  // Manual extraction fallback
  const ideas: Idea[] = [];
  const titleMatches = Array.from(text.matchAll(/"title"\s*:\s*"([^"]+)"/g));
  const descMatches = Array.from(text.matchAll(/"description"\s*:\s*"([^"]+)"/g));
  const formatMatches = Array.from(text.matchAll(/"format"\s*:\s*"([^"]+)"/g));

  for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
    ideas.push({
      title: titleMatches[i]?.[1] || `Post idea ${i + 1}`,
      description: descMatches[i]?.[1] || "A post about your expertise",
      format: formatMatches[i]?.[1] || "single-tweet",
    });
  }

  return ideas;
}

async function generatePostsForUser(user: AutopilotUser): Promise<number> {
  const dayOfWeek = new Date().getDay();
  const dayTheme = getDayTheme(dayOfWeek);
  const contentTypes = getContentTypes(dayTheme, user.twitter_premium, 3);

  // Get previous titles for diversity
  let previousTitles: string[] = [];
  try {
    const prevPosts = await sql`
      SELECT idea_title FROM twitter_post_queue
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC LIMIT 30
    `;
    previousTitles = prevPosts
      .map(p => p.idea_title as string)
      .filter(Boolean);
  } catch (e) {
    console.log("Failed to fetch previous titles for diversity", e);
  }

  // Generate ideas
  const ideaPrompt = createIdeaPrompt(
    user.user_type,
    user.niche,
    user.target_audience,
    user.twitter_premium,
    dayTheme,
    previousTitles,
    3
  );

  console.log(`Generating ideas for ${user.email} (theme: ${dayTheme})...`);
  const ideaResponse = await generateWithClaude(ideaPrompt, {
    temperature: 0.8,
    maxTokens: 2048,
  });

  const ideas = cleanAndParseIdeas(ideaResponse);
  if (ideas.length === 0) {
    console.log(`No ideas generated for ${user.email}`);
    return 0;
  }

  let postsGenerated = 0;

  for (let i = 0; i < Math.min(ideas.length, 3); i++) {
    const idea = ideas[i];
    const contentType = contentTypes[i] || "single-tweet";
    const tone = contentType.startsWith("thread") ? "thread" : "punchy";

    const profile = {
      twitterHandle: user.twitter_handle,
    };

    const writePrompt = createTwitterPrompt(
      idea.title,
      idea.description,
      contentType,
      tone,
      profile,
      user.user_type,
      user.niche,
      user.target_audience,
      "",
      user.twitter_premium
    );

    console.log(`Writing post ${i + 1}/3: "${idea.title}" (${contentType})...`);
    const postContent = await generateWithClaude(writePrompt, {
      temperature: 0.8,
      maxTokens: 2048,
    });

    if (postContent && postContent.trim().length > 0) {
      await sql`
        INSERT INTO twitter_post_queue (user_id, idea_title, post_content, content_type, tone, day_theme, status)
        VALUES (${user.id}, ${idea.title}, ${postContent.trim()}, ${contentType}, ${tone}, ${dayTheme}, 'queued')
      `;
      postsGenerated++;
    }

    // Small delay between Claude calls
    if (i < ideas.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return postsGenerated;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting Twitter autopilot generation...");

    // Get autopilot users
    const users = await sql`
      SELECT id, email, user_type, niche, target_audience, twitter_handle, twitter_premium
      FROM users
      WHERE twitter_autopilot = true AND twitter_handle IS NOT NULL
    ` as AutopilotUser[];

    console.log(`Found ${users.length} autopilot users`);

    let usersProcessed = 0;
    let totalPostsGenerated = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Skip if already generated in last 20 hours
        const recent = await sql`
          SELECT COUNT(*) as count FROM twitter_post_queue
          WHERE user_id = ${user.id} AND created_at > NOW() - INTERVAL '20 hours'
        `;

        if (Number(recent[0]?.count) > 0) {
          console.log(`Skipping ${user.email} — already generated today`);
          continue;
        }

        const postsGenerated = await generatePostsForUser(user);
        totalPostsGenerated += postsGenerated;
        usersProcessed++;
        console.log(`Generated ${postsGenerated} posts for ${user.email}`);
      } catch (error) {
        const msg = `Error for ${user.email}: ${error instanceof Error ? error.message : "Unknown"}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed,
      postsGenerated: totalPostsGenerated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error("Generate Twitter cron error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
