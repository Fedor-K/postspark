import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { generateWithClaude } from "@/lib/anthropic";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, experience, platform = "linkedin" } = await request.json();

    if (!email || !experience?.trim()) {
      return NextResponse.json({ error: "Email and experience are required" }, { status: 400 });
    }

    // Get user profile + top posts for style context
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = users[0];

    let performanceContext = "";
    try {
      const topPosts = await sql`
        SELECT idea_title, post_content, views, likes, tone, published_at, stats_updated_at
        FROM saved_posts
        WHERE user_id = ${user.id} AND published_at IS NOT NULL AND views > 0
        ORDER BY views DESC
        LIMIT 3
      `;
      if (topPosts.length > 0) {
        performanceContext = `\n\nAUTHOR'S BEST POSTS (match this writing style):\n${topPosts.map((p, i) => {
          const endDate = p.stats_updated_at ? new Date(p.stats_updated_at) : new Date();
          const days = Math.max(1, Math.round((endDate.getTime() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24)));
          return `${i + 1}. ${p.views} views in ${days} days | Tone: ${p.tone}\n"${p.post_content.substring(0, 150)}..."`;
        }).join('\n\n')}`;
      }
    } catch {
      // ignore
    }

    const platformInstructions = platform === "twitter"
      ? `FORMAT: Twitter/X post. Max 280 chars per tweet. Can be a thread of 3-5 tweets separated by "---". Each tweet must stand alone.`
      : `FORMAT: LinkedIn post. 150-250 words. Short paragraphs (1-2 lines). One thought per line.`;

    const prompt = `You are a ghostwriter turning raw daily experiences into viral ${platform === "twitter" ? "Twitter/X" : "LinkedIn"} posts.

AUTHOR PROFILE:
- Type: ${user.user_type || "solopreneur"}
- Niche: ${user.niche || "business"}
- Audience: ${user.target_audience || "professionals"}
- Name: ${user.linkedin_name || ""}
${performanceContext}

TODAY'S RAW EXPERIENCE (what the author shared):
"${experience.trim()}"

YOUR JOB:
Transform this raw observation into a compelling, authentic post that feels like it happened today — because it did.

RULES:
1. Keep the SPECIFIC details (numbers, names of things, exact situations) — they make it feel real
2. Find the universal insight hidden in this personal story — what does this mean for the audience?
3. Hook: Start with the most surprising or emotional moment from the experience
4. Don't generalize — stay concrete and specific
5. End with a question that invites the reader to share their own experience
6. Sound like a human, not a content marketer
7. NO generic advice like "consistency is key" — tie every lesson back to the specific story
8. NO hashtags in the main text (add 2-3 at the very end)

HOOK FORMULA OPTIONS (pick the best fit for this experience):
- "Today [something specific happened]."
- "I just [did/learned/realized X]."  
- "[Number] [units] ago I [did X]. Here's what I didn't expect:"
- "Honest confession: [what happened]"

${platformInstructions}

Write 3 versions with different angles:
1. STORY — lead with the narrative arc, emotional journey
2. INSIGHT — lead with the surprising lesson/realization
3. CONTRAST — lead with the before/after or expectation vs reality

Return as JSON:
{"story": "post text here", "insight": "post text here", "contrast": "post text here", "suggested_hook": "one-line hook that best captures this experience"}`;

    const content = await generateWithClaude(prompt, { temperature: 0.85, maxTokens: 2000 });

    // Parse JSON response
    let result;
    try {
      const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      result = JSON.parse(cleaned.substring(start, end + 1));
    } catch {
      // Fallback: return raw as story
      result = { story: content, insight: content, contrast: content, suggested_hook: "" };
    }

    return NextResponse.json({
      versions: {
        story: result.story || "",
        insight: result.insight || "",
        contrast: result.contrast || "",
      },
      suggested_hook: result.suggested_hook || "",
    });
  } catch (error: unknown) {
    console.error("From experience error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate post" },
      { status: 500 }
    );
  }
}
