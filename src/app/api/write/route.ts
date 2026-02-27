import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Platform } from "@/types";
import { THREAD_SEPARATOR } from "@/lib/constants";
import { scrapeMultipleAccounts, generateStylePrompt } from "@/lib/twitter-scraper";
import { generateWithClaude } from "@/lib/anthropic";

const openai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4"
});

interface ProfileInfo {
  name?: string;
  headline?: string;
  twitterHandle?: string;
}

function createLinkedInPrompt(
  title: string,
  description: string,
  format: string,
  tone: string,
  profile: ProfileInfo | null,
  userType: string,
  niche: string,
  targetAudience: string
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
- Make it feel authentic, not AI-generated

Write the post now. Return ONLY the post text, nothing else:`;
}

function createTwitterPrompt(
  title: string,
  description: string,
  format: string,
  tone: string,
  profile: ProfileInfo | null,
  userType: string,
  niche: string,
  targetAudience: string,
  stylePrompt: string = ""
): string {
  const toneInstructions: Record<string, string> = {
    punchy: `
TONE: Punchy & Direct
- One key idea, maximum impact
- Short, powerful sentences
- No fluff or filler words
- Use line breaks for emphasis
- Strong opinion or statement
- End with a provocative statement or clear CTA`,
    casual: `
TONE: Casual & Conversational
- Write like texting a friend
- Use "you" and "I" freely
- Light humor or wit welcome
- Contractions everywhere
- Relatable observations
- End with a simple question or thought`,
    thread: `
TONE: Thread (Educational/Story)
- This is a THREAD of 3-5 connected tweets
- First tweet: Hook that creates curiosity
- Middle tweets: Value, insights, or story progression
- Last tweet: Key takeaway + soft CTA
- Each tweet should stand alone but connect to the whole
- Number each tweet: 1/, 2/, 3/, etc.`
  };

  const isThreadTone = tone === 'thread';
  const isThreadFormat = format === 'thread-3' || format === 'thread-5';
  const shouldBeThread = isThreadTone || isThreadFormat;
  const threadLength = format === 'thread-5' ? 5 : format === 'thread-3' ? 3 : (isThreadTone ? 3 : 1);

  if (shouldBeThread) {
    return `You are a viral Twitter/X ghostwriter for a ${userType} in ${niche}.

## AUTHOR INFO:
- Name: ${profile?.name || "Creator"}
${profile?.twitterHandle ? `- Handle: @${profile.twitterHandle.replace('@', '')}` : ''}
- Target Audience: ${targetAudience}
${stylePrompt}

## POST IDEA:
- Hook: ${title}
- Topic: ${description || title}
- Format: Thread (${threadLength} tweets)

${toneInstructions.thread}

## THREAD STRUCTURE (${threadLength} tweets):
1/ Hook tweet - grab attention, create curiosity (max 280 chars)
${threadLength >= 2 ? '2/ Expand on the main point or continue the story' : ''}
${threadLength >= 3 ? '3/ Provide value, insight, or plot development' : ''}
${threadLength >= 4 ? '4/ Additional insight or turning point' : ''}
${threadLength >= 5 ? '5/ Conclusion with key takeaway and soft CTA' : ''}

## RULES:
- EACH tweet must be under 280 characters
- Start each tweet with the number (1/, 2/, etc.)
- Separate tweets with "---" on its own line
- Make each tweet valuable standalone
- Build momentum through the thread
- Last tweet should have a takeaway or call to engage

## IMPORTANT:
- Write for ${targetAudience}
- Be authentic, not corporate
- Use simple, punchy language
- Emojis sparingly (1-2 max per tweet)

Write the thread now. Return ONLY the tweets separated by ---, nothing else:`;
  }

  return `You are a viral Twitter/X ghostwriter for a ${userType} in ${niche}.

## AUTHOR INFO:
- Name: ${profile?.name || "Creator"}
${profile?.twitterHandle ? `- Handle: @${profile.twitterHandle.replace('@', '')}` : ''}
- Target Audience: ${targetAudience}
${stylePrompt}

## POST IDEA:
- Hook: ${title}
- Topic: ${description || title}

${toneInstructions[tone] || toneInstructions.punchy}

## RULES FOR SINGLE TWEET:
- MUST be under 280 characters total
- One clear idea or message
- Punchy, direct language
- Line breaks for emphasis if needed
- 0-2 emojis maximum
- Hashtags: 0-1 only (or none)

## IMPORTANT:
- Write for ${targetAudience}
- Be authentic and direct
- No corporate speak
- Make every word count
${stylePrompt ? '- CRITICAL: Match the style of the accounts mentioned above' : ''}

Write the tweet now. Return ONLY the tweet text, nothing else:`;
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, format, profile, userType, niche, targetAudience, platform = 'linkedin', twitterAccountsToCopy } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const platformTyped = platform as Platform;

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
          // Use Claude for Twitter
          const twitterPrompt = createTwitterPrompt(
            title,
            description,
            format,
            tone,
            profile,
            userType || "solopreneur",
            niche || "business",
            targetAudience || "",
            stylePrompt
          );
          return generateWithClaude(twitterPrompt, { temperature: 0.8 });
        } else {
          // Use Z.ai for LinkedIn
          const completion = await openai.chat.completions.create({
            model: "glm-4.5-air",
            messages: [{
              role: "user",
              content: createLinkedInPrompt(
                title,
                description,
                format,
                tone,
                profile,
                userType || "solopreneur",
                niche || "business",
                targetAudience || ""
              )
            }],
            temperature: 0.8,
          });
          return completion.choices[0]?.message?.content?.trim() || "Failed to generate this version";
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
