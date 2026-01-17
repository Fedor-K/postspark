import { ApifyClient } from "apify-client";

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface ScrapedTweet {
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string;
}

export interface TwitterAccountStyle {
  handle: string;
  name: string;
  bio: string;
  tweets: ScrapedTweet[];
  styleAnalysis: {
    avgLength: number;
    usesEmojis: boolean;
    usesHashtags: boolean;
    commonPatterns: string[];
    tone: string;
  };
}

/**
 * Scrape recent tweets from a Twitter/X account using Apify
 */
export async function scrapeTwitterAccount(handle: string): Promise<TwitterAccountStyle | null> {
  try {
    const cleanHandle = handle.replace('@', '').trim();
    console.log(`Scraping Twitter account: @${cleanHandle}`);

    // Use Apify's Twitter scraper
    const run = await apify.actor("apidojo/tweet-scraper").call({
      startUrls: [{ url: `https://twitter.com/${cleanHandle}` }],
      maxTweets: 20,
      addUserInfo: true,
      scrapeTweetReplies: false,
      proxyConfiguration: { useApifyProxy: true },
    });

    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      console.log(`No tweets found for @${cleanHandle}`);
      return null;
    }

    // Extract tweets
    const tweets: ScrapedTweet[] = items
      .filter((item: Record<string, unknown>) => item.full_text || item.text)
      .slice(0, 15)
      .map((item: Record<string, unknown>) => ({
        text: (item.full_text as string) || (item.text as string) || "",
        likes: (item.favorite_count as number) || (item.likes as number) || 0,
        retweets: (item.retweet_count as number) || (item.retweets as number) || 0,
        replies: (item.reply_count as number) || (item.replies as number) || 0,
        createdAt: (item.created_at as string) || "",
      }));

    // Get user info from first tweet
    const firstItem = items[0] as Record<string, unknown>;
    const user = (firstItem.user as Record<string, unknown>) || firstItem;

    // Analyze style
    const styleAnalysis = analyzeStyle(tweets);

    return {
      handle: cleanHandle,
      name: (user.name as string) || (user.screen_name as string) || cleanHandle,
      bio: (user.description as string) || "",
      tweets,
      styleAnalysis,
    };
  } catch (error) {
    console.error(`Error scraping @${handle}:`, error);
    return null;
  }
}

/**
 * Analyze the writing style from a list of tweets
 */
function analyzeStyle(tweets: ScrapedTweet[]): TwitterAccountStyle["styleAnalysis"] {
  if (tweets.length === 0) {
    return {
      avgLength: 150,
      usesEmojis: false,
      usesHashtags: false,
      commonPatterns: [],
      tone: "neutral",
    };
  }

  const texts = tweets.map(t => t.text);

  // Calculate average length
  const avgLength = Math.round(texts.reduce((sum, t) => sum + t.length, 0) / texts.length);

  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const usesEmojis = texts.filter(t => emojiRegex.test(t)).length > texts.length * 0.3;

  // Check for hashtags
  const usesHashtags = texts.filter(t => t.includes('#')).length > texts.length * 0.3;

  // Detect common patterns
  const commonPatterns: string[] = [];

  // Check for threads
  if (texts.some(t => /^\d+[\/\.]/.test(t))) {
    commonPatterns.push("Uses numbered threads");
  }

  // Check for line breaks
  if (texts.filter(t => t.includes('\n')).length > texts.length * 0.5) {
    commonPatterns.push("Uses line breaks for emphasis");
  }

  // Check for questions
  if (texts.filter(t => t.includes('?')).length > texts.length * 0.3) {
    commonPatterns.push("Often asks questions");
  }

  // Check for lists/bullets
  if (texts.some(t => /[-•→]/.test(t))) {
    commonPatterns.push("Uses lists and bullets");
  }

  // Check for short punchy sentences
  const avgSentenceLength = texts.map(t => t.split(/[.!?]/).filter(Boolean).map(s => s.length))
    .flat()
    .reduce((a, b) => a + b, 0) / texts.length;

  if (avgSentenceLength < 50) {
    commonPatterns.push("Short punchy sentences");
  }

  // Detect tone
  let tone = "conversational";
  const joinedText = texts.join(' ').toLowerCase();

  if (joinedText.includes('💀') || joinedText.includes('lmao') || joinedText.includes('lol')) {
    tone = "humorous/casual";
  } else if (texts.some(t => t.startsWith("Thread:") || t.includes("🧵"))) {
    tone = "educational/thread-based";
  } else if (joinedText.includes('hot take') || joinedText.includes('unpopular opinion')) {
    tone = "provocative/bold";
  } else if (avgLength < 100) {
    tone = "punchy/direct";
  }

  return {
    avgLength,
    usesEmojis,
    usesHashtags,
    commonPatterns,
    tone,
  };
}

/**
 * Scrape multiple Twitter accounts and combine their styles
 */
export async function scrapeMultipleAccounts(handles: string[]): Promise<TwitterAccountStyle[]> {
  const results: TwitterAccountStyle[] = [];

  for (const handle of handles.slice(0, 3)) { // Limit to 3 accounts
    const style = await scrapeTwitterAccount(handle);
    if (style) {
      results.push(style);
    }
  }

  return results;
}

/**
 * Generate a style prompt from scraped accounts
 */
export function generateStylePrompt(accounts: TwitterAccountStyle[]): string {
  if (accounts.length === 0) {
    return "";
  }

  const styleDescriptions = accounts.map(account => {
    const { styleAnalysis, tweets } = account;
    const topTweets = tweets
      .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets))
      .slice(0, 5)
      .map(t => `"${t.text.slice(0, 200)}${t.text.length > 200 ? '...' : ''}"`)
      .join('\n');

    return `
@${account.handle} (${account.name}):
- Style: ${styleAnalysis.tone}
- Avg tweet length: ${styleAnalysis.avgLength} chars
- ${styleAnalysis.usesEmojis ? 'Uses emojis' : 'Minimal emojis'}
- ${styleAnalysis.usesHashtags ? 'Uses hashtags' : 'Rarely uses hashtags'}
${styleAnalysis.commonPatterns.length > 0 ? `- Patterns: ${styleAnalysis.commonPatterns.join(', ')}` : ''}

Top performing tweets:
${topTweets}`;
  });

  return `
## STYLE INSPIRATION (IMPORTANT - Match this style closely):
The user wants content similar to these accounts:
${styleDescriptions.join('\n\n')}

STYLE RULES TO FOLLOW:
- Match the tone and energy of these accounts
- Use similar sentence structures and lengths
- ${accounts.some(a => a.styleAnalysis.usesEmojis) ? 'Include emojis strategically' : 'Keep emojis minimal'}
- ${accounts.some(a => a.styleAnalysis.usesHashtags) ? 'Use 1-2 relevant hashtags' : 'Skip hashtags'}
- Emulate their hook patterns and engagement tactics
`;
}
