import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.ZAI_API_KEY, 
  baseURL: "https://api.z.ai/api/paas/v4" 
});

interface ProfileInfo {
  name?: string;
  headline?: string;
}

function createPrompt(
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

export async function POST(request: NextRequest) {
  try {
    const { title, description, format, profile, userType, niche, targetAudience } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    // Generate all 3 versions in parallel
    const tones = ["professional", "casual", "storytelling"];
    
    const completions = await Promise.all(
      tones.map(tone => 
        openai.chat.completions.create({
          model: "glm-4.5-air",
          messages: [{ 
            role: "user", 
            content: createPrompt(title, description, format, tone, profile, userType || "solopreneur", niche || "business", targetAudience || "")
          }],
          temperature: 0.8,
        })
      )
    );

    const posts: Record<string, string> = {};
    tones.forEach((tone, index) => {
      const content = completions[index].choices[0]?.message?.content;
      posts[tone] = content?.trim() || "Failed to generate this version";
    });

    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("Write error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
