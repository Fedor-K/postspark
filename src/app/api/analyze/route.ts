import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { neon } from "@neondatabase/serverless";
import { sendEmail, generateWelcomeEmail } from "@/lib/email";
import { Platform } from "@/types";
import { scrapeMultipleAccounts, generateStylePrompt, TwitterAccountStyle } from "@/lib/twitter-scraper";
import { generateWithClaude } from "@/lib/anthropic";
import { discoverTwitterAccounts } from "@/lib/twitter-discovery";

const sql = neon(process.env.DATABASE_URL!);

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

interface LinkedInProfile {
  name: string;
  headline: string;
  about: string;
  experience: string[];
  skills: string[];
}

interface Topic {
  title: string;
  description: string;
  format: string;
}

function normalizeLinkedInUrl(url: string): string {
  let normalized = url.split("?")[0].replace(/\/+$/, "");
  if (!normalized.startsWith("http")) {
    normalized = "https://" + normalized;
  }
  normalized = normalized.replace("://linkedin.com", "://www.linkedin.com");
  return normalized;
}

async function scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfile> {
  try {
    const normalizedUrl = normalizeLinkedInUrl(profileUrl);
    console.log("Scraping profile:", normalizedUrl);

    const run = await apify.actor("dev_fusion/linkedin-profile-scraper").call({
      profileUrls: [normalizedUrl],
      proxyConfiguration: { useApifyProxy: true },
    });

    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error("No profile data returned");
    }

    const profile = items[0] as Record<string, unknown>;
    const firstName = (profile.firstName as string) || "";
    const lastName = (profile.lastName as string) || "";
    const fullName = (profile.fullName as string) || (firstName + " " + lastName).trim() || "Unknown";

    return {
      name: fullName,
      headline: (profile.headline as string) || (profile.title as string) || "",
      about: (profile.about as string) || (profile.summary as string) || "",
      experience: ((profile.experiences as Array<Record<string, unknown>>) || (profile.experience as Array<Record<string, unknown>>) || []).map((exp) =>
        ((exp.title as string) || "") + " at " + ((exp.companyName as string) || (exp.company as string) || "")
      ).filter((s: string) => s.length > 5).slice(0, 5),
      skills: ((profile.skills as Array<unknown>) || []).map((s) => typeof s === "string" ? s : (s as Record<string, unknown>).name as string).filter(Boolean).slice(0, 10),
    };
  } catch (error: unknown) {
    console.error("Profile scraping error:", error);
    throw new Error("Failed to scrape profile: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function saveUserAndGeneration(
  email: string,
  userType: string,
  niche: string,
  targetAudience: string,
  linkedinUrl: string | null,
  linkedinName: string | null,
  linkedinHeadline: string | null,
  emailFrequency: string,
  emailDays: string,
  emailTime: string,
  timezone: string,
  ideas: Topic[],
  platform: Platform = 'linkedin',
  twitterHandle: string | null = null,
  twitterAccountsToCopy: string | null = null,
  twitterPremium: boolean = false
): Promise<{ user: Record<string, unknown>; isNew: boolean }> {
  let user = await sql`SELECT * FROM users WHERE email = ${email}`;
  let isNew = false;

  if (user.length === 0) {
    const refCode = generateRefCode();
    user = await sql`
      INSERT INTO users (email, user_type, niche, target_audience, linkedin_url, linkedin_name, linkedin_headline, twitter_handle, twitter_accounts_to_copy, twitter_premium, ref_code, email_frequency, email_days, email_time, timezone)
      VALUES (${email}, ${userType}, ${niche}, ${targetAudience}, ${linkedinUrl}, ${linkedinName}, ${linkedinHeadline}, ${twitterHandle}, ${twitterAccountsToCopy}, ${twitterPremium}, ${refCode}, ${emailFrequency}, ${emailDays}, ${emailTime}, ${timezone})
      RETURNING *
    `;
    isNew = true;
  } else {
    user = await sql`
      UPDATE users
      SET user_type = ${userType}, niche = ${niche}, target_audience = ${targetAudience},
          linkedin_url = ${linkedinUrl}, linkedin_name = ${linkedinName},
          linkedin_headline = ${linkedinHeadline},
          twitter_handle = COALESCE(${twitterHandle}, twitter_handle),
          twitter_accounts_to_copy = COALESCE(${twitterAccountsToCopy}, twitter_accounts_to_copy),
          twitter_premium = ${twitterPremium},
          last_active = NOW(),
          email_frequency = ${emailFrequency}, email_days = ${emailDays}, email_time = ${emailTime}, timezone = ${timezone}
      WHERE email = ${email}
      RETURNING *
    `;
  }

  await sql`
    INSERT INTO generations (user_id, ideas, platform)
    VALUES (${user[0].id}, ${JSON.stringify(ideas)}, ${platform})
  `;

  return { user: user[0], isNew };
}

function cleanAndParseJSON(text: string): { niche: string; topics: Topic[] } {
  console.log("Parsing AI response...");
  
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
      if (parsed.topics && Array.isArray(parsed.topics)) {
        return parsed;
      }
    } catch (e) {
      console.log("JSON parse failed, trying manual extraction", e);
    }
  }

  console.log("Using manual field extraction");
  
  const topics: Topic[] = [];
  
  const titleMatches = text.matchAll(/"title"\s*:\s*"([^"]+)"/g);
  const descMatches = text.matchAll(/"description"\s*:\s*"([^"]+)"/g);
  const formatMatches = text.matchAll(/"format"\s*:\s*"([^"]+)"/g);
  
  const titles = Array.from(titleMatches).map(m => m[1]);
  const descriptions = Array.from(descMatches).map(m => m[1]);
  const formats = Array.from(formatMatches).map(m => m[1]);
  
  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    topics.push({
      title: titles[i] || "Post idea " + (i + 1),
      description: descriptions[i] || "A post about your expertise",
      format: formats[i] || "tips"
    });
  }

  if (topics.length === 0) {
    const defaultTopics = [
      { title: "The biggest mistake I see in my industry", description: "Share a common mistake and how to avoid it", format: "tips" },
      { title: "What I wish I knew when I started", description: "Lessons learned from your journey", format: "story" },
      { title: "My unpopular opinion about [your niche]", description: "A contrarian take that sparks discussion", format: "opinion" },
      { title: "How I helped a client achieve [result]", description: "A case study showcasing your expertise", format: "case-study" },
      { title: "Stop doing this if you want [outcome]", description: "Actionable advice for your audience", format: "tips" },
      { title: "The truth about [topic] nobody talks about", description: "Reveal insider knowledge", format: "confession" },
      { title: "3 things I do every morning for success", description: "Share your productivity secrets", format: "tips" },
      { title: "Why I turned down [opportunity]", description: "A story about staying true to your values", format: "story" },
      { title: "The question I get asked most often", description: "Answer a common question from your audience", format: "how-to" },
      { title: "What successful [audience] have in common", description: "Patterns you've observed in your work", format: "tips" }
    ];
    return { niche: "Business", topics: defaultTopics };
  }

  const nicheMatch = text.match(/"niche"\s*:\s*"([^"]+)"/);
  const niche = nicheMatch ? nicheMatch[1] : "Business";

  return { niche, topics };
}

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl, userType, niche, targetAudience, email, emailFrequency, emailDays, emailTime, timezone, platform = 'linkedin', twitterHandle, twitterAccountsToCopy, twitterPremium } = await request.json();

    if (!email || !userType || !niche || !targetAudience) {
      return NextResponse.json(
        { error: "Please provide all required information" },
        { status: 400 }
      );
    }

    let profile: LinkedInProfile | null = null;

    if (linkedinUrl && linkedinUrl.includes("linkedin.com/in/")) {
      try {
        profile = await scrapeLinkedInProfile(linkedinUrl);
        console.log("Profile scraped:", profile.name);
      } catch (e) {
        console.log("LinkedIn scrape failed, continuing without profile data", e);
      }
    }

    const userTypeLabels: Record<string, string> = {
      solopreneur: "Solopreneur",
      coach: "Coach/Mentor",
      consultant: "Consultant",
      freelancer: "Freelancer"
    };

    // Scrape Twitter accounts to copy style from
    let stylePrompt = "";
    let scrapedAccounts: TwitterAccountStyle[] = [];
    let discoveredHandlesForSave: string[] | null = null;

    if (platform === 'twitter') {
      if (twitterAccountsToCopy) {
        // User provided accounts — scrape them
        const handles = twitterAccountsToCopy
          .split(/[,\s]+/)
          .map((h: string) => h.trim().replace('@', ''))
          .filter(Boolean)
          .slice(0, 3);

        if (handles.length > 0) {
          console.log(`Scraping user-provided Twitter accounts: ${handles.join(', ')}`);
          try {
            scrapedAccounts = await scrapeMultipleAccounts(handles);
            if (scrapedAccounts.length > 0) {
              stylePrompt = generateStylePrompt(scrapedAccounts);
              console.log(`Style analysis complete for ${scrapedAccounts.length} accounts`);
            }
          } catch (e) {
            console.log("Twitter scraping failed, continuing without style analysis", e);
          }
        }
      } else {
        // No accounts provided — auto-discover
        console.log("No twitter_accounts_to_copy — running auto-discovery");
        try {
          const discovery = await discoverTwitterAccounts(niche, targetAudience, userType);
          scrapedAccounts = discovery.accounts;
          stylePrompt = discovery.stylePrompt;
          if (discovery.discoveredHandles.length > 0) {
            discoveredHandlesForSave = discovery.discoveredHandles;
            console.log(`Auto-discovered accounts: ${discovery.discoveredHandles.join(', ')}`);
          }
        } catch (e) {
          console.log("Auto-discovery failed, continuing without style analysis", e);
        }
      }
    }

    // Fetch previous Twitter generations for diversity
    let diversityClause = "";
    if (platform === 'twitter') {
      try {
        const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
          const prevGens = await sql`
            SELECT ideas FROM generations
            WHERE user_id = ${existingUser[0].id} AND platform = 'twitter'
            ORDER BY created_at DESC LIMIT 3
          `;
          if (prevGens.length > 0) {
            const prevTitles: string[] = prevGens
              .flatMap(g => {
                const ideas = typeof g.ideas === 'string' ? JSON.parse(g.ideas) : g.ideas;
                return Array.isArray(ideas) ? ideas.map((i: { title?: string }) => i.title).filter((t): t is string => typeof t === 'string') : [];
              });
            if (prevTitles.length > 0) {
              diversityClause = `\nDIVERSITY: Do NOT reuse these previously generated topics:\n${prevTitles.map(t => `- ${t}`).join('\n')}\nGenerate completely fresh angles and topics.\n`;
            }
          }
        }
      } catch (e) {
        console.log("Failed to fetch previous generations for diversity, continuing", e);
      }
    }

    // Fetch top performing posts for adaptive generation
    let performanceContext = "";
    try {
      const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        const topPosts = await sql`
          SELECT idea_title, views, likes, comments, tone, platform as post_platform, published_at
          FROM saved_posts
          WHERE user_id = ${existingUser[0].id} AND published_at IS NOT NULL AND views > 0
          ORDER BY views DESC
          LIMIT 5
        `;
        if (topPosts.length > 0) {
          const now = new Date();
          performanceContext = `\n\nPERFORMANCE DATA — These are the author's best-performing posts. Generate ideas similar in style, angle, and format to the top performers:\n${topPosts.map((p, i) => {
            const days = Math.max(1, Math.round((now.getTime() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24)));
            const viewsPerDay = Math.round(p.views / days);
            return `${i + 1}. "${p.idea_title}" — ${p.views} views in ${days} days (~${viewsPerDay}/day), ${p.likes} likes, ${p.comments} comments (tone: ${p.tone}, platform: ${p.post_platform})`;
          }).join('\n')}\nPosts with higher views/day ratio indicate stronger content patterns. Prioritize those patterns.\n`;
        }
      }
    } catch (e) {
      console.log("Failed to fetch performance data, continuing", e);
    }

    let prompt: string;

    if (platform === 'twitter') {
      prompt = `You are a viral Twitter/X ghostwriter specializing in content for ${userTypeLabels[userType] || userType}s.

WHO YOU ARE WRITING FOR:
- Type: ${userTypeLabels[userType] || userType}
- Niche: ${niche}
- Target Audience: ${targetAudience}
${profile ? `- Name: ${profile.name}
- Expertise: ${profile.headline}` : ""}
${twitterHandle ? `- Twitter Handle: @${twitterHandle.replace('@', '')}` : ""}
${stylePrompt}

YOUR TASK:
Generate 10 Twitter post ideas that will help this ${userTypeLabels[userType]} grow their audience and attract clients.

REQUIREMENTS FOR EACH IDEA:
1. Hook (title): Scroll-stopping first line (max 50 characters). Must grab attention.
2. Description: Brief summary of what the post covers
3. Format: MUST be one of: ${twitterPremium ? 'single-tweet, long-form, thread-3, thread-5' : 'single-tweet, thread-3, thread-5'}

${twitterPremium ? `FORMAT "long-form": A 500-1500 character post with structure, line breaks, and depth. Think mini-essay or in-depth take.` : ''}

TWITTER HOOK FORMULAS THAT WORK:
- Hot take: "[Controversial statement]"
- Thread starter: "I [did X]. Here's what I learned:"
- Listicle: "[Number] [things] that [outcome]:"
- Pattern interrupt: "[Common belief] is wrong."
- Story hook: "[Timeframe] ago I was [state]. Now I [outcome]."
- Question: "Why do most [audience] [problem]?"

IMPORTANT:
- Make hooks PUNCHY and direct (Twitter rewards brevity)
${twitterPremium
  ? '- 6-7 ideas should be long-form, 2-3 should be single-tweet, 1 should be thread-5'
  : '- 4-5 ideas should be single-tweet, 3-4 should be thread-3, 1-2 should be thread-5'}
- Focus on topics that spark engagement (replies, retweets)
- Use numbers and specific outcomes in hooks
- Vary the formats across the 10 ideas
${scrapedAccounts.length > 0 ? '- CRITICAL: Match the style and tone of the accounts mentioned above' : ''}
${diversityClause}${performanceContext}
Return ONLY valid JSON in this exact format:
{"niche":"detected niche","topics":[{"title":"hook line","description":"brief description","format":"single-tweet"}]}`;
    } else {
      prompt = `You are a viral LinkedIn ghostwriter specializing in content for ${userTypeLabels[userType] || userType}s.

WHO YOU ARE WRITING FOR:
- Type: ${userTypeLabels[userType] || userType}
- Niche: ${niche}
- Target Audience: ${targetAudience}
${profile ? `- Name: ${profile.name}
- Headline: ${profile.headline}
- About: ${profile.about}
- Experience: ${profile.experience.join(", ")}
- Skills: ${profile.skills.join(", ")}` : ""}

YOUR TASK:
Generate 10 LinkedIn post ideas that will help this ${userTypeLabels[userType]} attract their ideal clients.

REQUIREMENTS FOR EACH IDEA:
1. Hook (title): The scroll-stopping first line. Must create curiosity or tension.
2. Description: Brief summary of what the post is about
3. Format: story, tips, opinion, case-study, confession, or how-to

HOOK FORMULAS THAT WORK:
- I [did X]. [Unexpected result].
- Stop [common advice]. Do this instead.
- [Number] things I wish I knew [timeframe] ago
- The truth about [topic] no one talks about
- I was wrong about [thing]. Here is what I learned.
- My client went from [before] to [after]. Here is how:

IMPORTANT:
- Make hooks SPECIFIC with numbers and results
- Focus on topics that attract CLIENTS
- Each idea should showcase expertise without being salesy
- Vary the formats across the 10 ideas
${performanceContext}
Return ONLY valid JSON in this exact format:
{"niche":"detected niche","topics":[{"title":"hook line","description":"brief description","format":"tips"}]}`;
    }

    let content: string;

    console.log(`Calling Claude API for ${platform}...`);
    content = await generateWithClaude(prompt, {
      temperature: 0.8,
      maxTokens: 4096,
    });

    console.log("AI response length:", content?.length);

    if (!content) {
      throw new Error("No response from AI");
    }

    const aiResponse = cleanAndParseJSON(content);
    const topics = aiResponse.topics;

    // If we auto-discovered handles, pass them as twitterAccountsToCopy
    const accountsToCopySave = twitterAccountsToCopy || (discoveredHandlesForSave ? discoveredHandlesForSave.join(', ') : null);

    const { user, isNew } = await saveUserAndGeneration(
      email,
      userType,
      niche,
      targetAudience,
      linkedinUrl || null,
      profile?.name || null,
      profile?.headline || null,
      emailFrequency || "weekly",
      emailDays || "monday",
      emailTime || "09:00",
      timezone || "America/New_York",
      topics,
      platform as Platform,
      twitterHandle || null,
      accountsToCopySave,
      twitterPremium ?? false
    );

    if (isNew) {
      const welcomeHtml = generateWelcomeEmail(
        profile?.name || null,
        topics,
        niche
      );
      
      sendEmail({
        to: email,
        subject: "Your LinkedIn Post Ideas Are Ready!",
        html: welcomeHtml,
      }).then(success => {
        if (success) {
          sql`INSERT INTO emails_sent (user_id, email_type) VALUES (${user.id}, 'welcome')`;
        }
      }).catch(console.error);
    }

    return NextResponse.json({
      profile: profile ? {
        name: profile.name,
        headline: profile.headline,
      } : {
        name: null,
        headline: null,
      },
      niche: aiResponse.niche,
      topics: topics,
      platform: platform,
    });
  } catch (error: unknown) {
    console.error("Analyze error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
