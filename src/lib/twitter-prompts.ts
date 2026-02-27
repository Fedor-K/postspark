export interface ProfileInfo {
  name?: string;
  headline?: string;
  twitterHandle?: string;
}

export function createTwitterPrompt(
  title: string,
  description: string,
  format: string,
  tone: string,
  profile: ProfileInfo | null,
  userType: string,
  niche: string,
  targetAudience: string,
  stylePrompt: string = "",
  twitterPremium: boolean = false
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

  const isLongForm = format === 'long-form' || (twitterPremium && tone !== 'thread' && format !== 'thread-3' && format !== 'thread-5' && format !== 'single-tweet');
  const isThreadTone = tone === 'thread';
  const isThreadFormat = format === 'thread-3' || format === 'thread-5';
  const shouldBeThread = isThreadTone || isThreadFormat;
  const threadLength = format === 'thread-5' ? 5 : format === 'thread-3' ? 3 : (isThreadTone ? 3 : 1);

  // Long-form post for premium users
  if (isLongForm && twitterPremium) {
    return `You are a viral Twitter/X ghostwriter for a ${userType} in ${niche}.

## AUTHOR INFO:
- Name: ${profile?.name || "Creator"}
${profile?.twitterHandle ? `- Handle: @${profile.twitterHandle.replace('@', '')}` : ''}
- Target Audience: ${targetAudience}
${stylePrompt}

## POST IDEA:
- Hook: ${title}
- Topic: ${description || title}
- Format: Long-form post (500-1500 characters)

${toneInstructions[tone] || toneInstructions.punchy}

## RULES FOR LONG-FORM POST:
- Target 500-1500 characters (this is a Twitter Premium long-form post)
- Start with the hook to grab attention
- Use line breaks between short paragraphs for readability
- Structure: Hook → Context → Key insight/story → Takeaway → CTA
- Short paragraphs (1-3 sentences each)
- Use white space generously — line breaks for emphasis
- End with a clear call-to-action or question
- 0-3 emojis maximum
- Hashtags: 0-2 only

## IMPORTANT:
- Write for ${targetAudience}
- Be authentic and direct
- No corporate speak
- This is NOT a 280-char tweet — go deep, add nuance and structure
- Make it feel like a mini-essay or in-depth take
${stylePrompt ? '- CRITICAL: Match the style of the accounts mentioned above' : ''}

Write the post now. Return ONLY the post text, nothing else:`;
  }

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

const DAY_THEMES: Record<number, string> = {
  0: "poll",     // Sunday
  1: "roundup",  // Monday
  2: "thread",   // Tuesday
  3: "roundup",  // Wednesday
  4: "thread",   // Thursday
  5: "tip",      // Friday
  6: "stats",    // Saturday
};

export function getDayTheme(dayOfWeek: number): string {
  return DAY_THEMES[dayOfWeek] || "roundup";
}

export function getContentTypes(dayTheme: string, twitterPremium: boolean, count: number = 3): string[] {
  const typeMap: Record<string, { premium: string[]; standard: string[] }> = {
    roundup: {
      premium: ["long-form", "single-tweet", "thread-3"],
      standard: ["single-tweet", "single-tweet", "thread-3"],
    },
    thread: {
      premium: ["thread-5", "long-form", "single-tweet"],
      standard: ["thread-3", "single-tweet", "single-tweet"],
    },
    tip: {
      premium: ["single-tweet", "single-tweet", "long-form"],
      standard: ["single-tweet", "single-tweet", "single-tweet"],
    },
    stats: {
      premium: ["long-form", "single-tweet", "single-tweet"],
      standard: ["single-tweet", "single-tweet", "single-tweet"],
    },
    poll: {
      premium: ["single-tweet", "single-tweet", "long-form"],
      standard: ["single-tweet", "single-tweet", "single-tweet"],
    },
  };

  const types = typeMap[dayTheme] || typeMap.roundup;
  const selected = twitterPremium ? types.premium : types.standard;
  return selected.slice(0, count);
}

export function createIdeaPrompt(
  userType: string,
  niche: string,
  targetAudience: string,
  twitterPremium: boolean,
  dayTheme: string,
  previousTitles: string[],
  count: number = 3
): string {
  const contentTypes = getContentTypes(dayTheme, twitterPremium, count);
  const formatsList = contentTypes.join(", ");

  const themeInstructions: Record<string, string> = {
    roundup: "Focus on curated insights, industry observations, and collected wisdom.",
    thread: "Focus on educational breakdowns, step-by-step guides, and deep dives.",
    tip: "Focus on quick actionable tips, hacks, and practical advice.",
    stats: "Focus on data-driven takes, trends, statistics, and numbers-backed insights.",
    poll: "Focus on engaging questions, opinions, and discussion starters that invite replies.",
  };

  let diversityClause = "";
  if (previousTitles.length > 0) {
    diversityClause = `\nDIVERSITY: Do NOT reuse these previously generated topics:\n${previousTitles.map(t => `- ${t}`).join('\n')}\nGenerate completely fresh angles and topics.\n`;
  }

  return `You are a viral Twitter/X content strategist for a ${userType} in ${niche}.

TARGET AUDIENCE: ${targetAudience}

TODAY'S THEME: ${dayTheme}
${themeInstructions[dayTheme] || themeInstructions.roundup}

Generate exactly ${count} Twitter post ideas.

REQUIRED FORMATS (in this order): ${formatsList}

For each idea provide:
1. "title": A scroll-stopping hook (max 50 characters)
2. "description": Brief summary of the post content
3. "format": Must match the required format for that position
${diversityClause}
RESPOND WITH VALID JSON ONLY:
{"ideas":[{"title":"hook line","description":"brief description","format":"single-tweet"}]}`;
}
