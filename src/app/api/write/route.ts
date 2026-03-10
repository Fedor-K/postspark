import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Platform } from "@/types";
import { THREAD_SEPARATOR } from "@/lib/constants";
import { scrapeMultipleAccounts, generateStylePrompt } from "@/lib/twitter-scraper";
import { generateWithClaude } from "@/lib/anthropic";
import { createTwitterPrompt, ProfileInfo } from "@/lib/twitter-prompts";

const sql = neon(process.env.DATABASE_URL!);

function createLinkedInPrompt(
  title: string,
  description: string,
  format: string,
  tone: string,
  profile: ProfileInfo | null,
  userType: string,
  niche: string,
  targetAudience: string,
  performanceContext: string = ""
): string {
  const toneInstructions: Record<string, string> = {
    professional: `
TONE: Professional & Authoritative
- Use industry terminology appropriately
- Be direct and confident
- Focus on data, results, and expertise
- Maintain formal but approachable language
- End with a thought-provoking question for professionals`,
    casual: `
TONE: Casual & Conversational
- Write like you're talking to a friend
- Use contractions and everyday language
- Add personality and humor where appropriate
- Be relatable and down-to-earth
- End with a simple, engaging question`,
    storytelling: `
TONE: Story-driven & Emotional
- Start with a vivid scene or moment
- Use sensory details and emotions
- Build tension or curiosity
- Include a clear transformation or lesson
- End with a reflection that invites comments`
  };

  return `You are a LinkedIn ghostwriter for a ${userType} in ${niche}.

## AUTHOR INFO:
- Name: ${profile?.name || "Professional"}
- Headline: ${profile?.headline || `${userType} | ${niche}`}
- Target Audience: ${targetAudience}

## POST IDEA:
- Hook: ${title}
- Topic: ${description || title}
- Format: ${format || "tips"}

${toneInstructions[tone] || toneInstructions.professional}

## STRUCTURE RULES:
1. START with the hook exactly as given (first line)
2. One sentence per line for readability
3. Short paragraphs (2-3 lines max)
4. Use → or • for lists when appropriate
5. Include specific examples or numbers
6. Show the transformation (before → after)
7. End with a question to drive comments
8. Add 2-3 relevant hashtags at the end

## LENGTH: 150-200 words (optimal for LinkedIn engagement)

## IMPORTANT:
- Write for the TARGET AUDIENCE: ${targetAudience}
- Subtly position the author as an expert who can help
- Don't be salesy - provide genuine value
- Make it feel authentic, not AI-generated${performanceContext}

Write the post now. Return ONLY the post text, nothing else:`;
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, format, profile, email, userType, niche, targetAudience, platform = 'linkedin', twitterAccountsToCopy, twitterPremium } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const platformTyped = platform as Platform;

    // Fetch top performing posts for context
    let performanceContext = "";
    if (email) {
      try {
        const user = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (user.length > 0) {
          const topPosts = await sql`
            SELECT idea_title, post_content, views, likes, comments, tone, published_at
            FROM saved_posts
            WHERE user_id = ${user[0].id} AND published_at IS NOT NULL AND views > 0
            ORDER BY views DESC
            LIMIT 3
          `;
          if (topPosts.length > 0) {
            const now = new Date();
            performanceContext = `\n\nTOP PERFORMING POSTS BY THIS AUTHOR (write in a similar style):\n${topPosts.map((p, i) => {
              const days = Math.max(1, Math.round((now.getTime() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24)));
              const viewsPerDay = Math.round(p.views / days);
              return `${i + 1}. "${p.idea_title}" (${p.views} views in ${days} days, ~${viewsPerDay}/day, ${p.likes} likes) — Tone: ${p.tone}\nContent preview: ${p.post_content.substring(0, 200)}...`;
            }).join('\n\n')}\nPrioritize patterns from posts with higher views/day.\n`;
          }
        }
      } catch (e) {
        console.log("Failed to fetch performance data for write", e);
      }
    }

    // Scrape Twitter accounts to copy style from (if provided)
    let stylePrompt = "";

    if (platformTyped === 'twitter' && twitterAccountsToCopy) {
      const handles = twitterAccountsToCopy
        .split(/[,\s]+/)
        .map((h: string) => h.trim().replace('@', ''))
        .filter(Boolean)
        .slice(0, 3);

      if (handles.length > 0) {
        try {
          const scrapedAccounts = await scrapeMultipleAccounts(handles);
          if (scrapedAccounts.length > 0) {
            stylePrompt = generateStylePrompt(scrapedAccounts);
          }
        } catch (e) {
          console.log("Twitter scraping failed for write", e);
        }
      }
    }

    // Different tones for different platforms
    const tones = platformTyped === 'twitter'
      ? ["punchy", "casual", "thread"]
      : ["professional", "casual", "storytelling"];

    const results = await Promise.all(
      tones.map(async (tone): Promise<string> => {
        if (platformTyped === 'twitter') {
          const twitterPrompt = createTwitterPrompt(
            title,
            description,
            format,
            tone,
            profile,
            userType || "solopreneur",
            niche || "business",
            targetAudience || "",
            stylePrompt,
            twitterPremium ?? false,
            performanceContext
          );
          return generateWithClaude(twitterPrompt, { temperature: 0.8 });
        } else {
          const linkedinPrompt = createLinkedInPrompt(
            title,
            description,
            format,
            tone,
            profile,
            userType || "solopreneur",
            niche || "business",
            targetAudience || "",
            performanceContext
          );
          return generateWithClaude(linkedinPrompt, { temperature: 0.8 });
        }
      })
    );

    const posts: Record<string, string> = {};
    tones.forEach((tone, index) => {
      let content = results[index]?.trim() || "Failed to generate this version";

      // For thread tone, ensure proper formatting
      if (platformTyped === 'twitter' && tone === 'thread') {
        // Normalize thread separators
        content = content
          .replace(/\n{2,}(?=\d+\/)/g, THREAD_SEPARATOR) // Multiple newlines before numbering
          .replace(/---+/g, '---'); // Normalize dashes
      }

      posts[tone] = content;
    });

    return NextResponse.json({ posts, platform: platformTyped });
  } catch (error: unknown) {
    console.error("Write error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
