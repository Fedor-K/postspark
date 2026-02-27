import { generateWithClaude } from "@/lib/anthropic";
import { scrapeMultipleAccounts, generateStylePrompt, TwitterAccountStyle } from "@/lib/twitter-scraper";

interface DiscoveryResult {
  accounts: TwitterAccountStyle[];
  stylePrompt: string;
  discoveredHandles: string[];
}

/**
 * Auto-discover relevant Twitter accounts for a niche and generate a style prompt.
 * Gracefully degrades if scraping fails — still returns discovered handles.
 */
export async function discoverTwitterAccounts(
  niche: string,
  targetAudience: string,
  userType: string
): Promise<DiscoveryResult> {
  console.log(`[twitter-discovery] Discovering accounts for niche: ${niche}`);

  // Step 1: Ask Claude to suggest popular Twitter accounts for this niche
  const discoveryPrompt = `You are a Twitter/X expert. Suggest 5 popular, active Twitter accounts that a ${userType} in the "${niche}" niche should study for content inspiration.

These accounts should:
- Post regularly about ${niche} topics
- Have strong engagement (lots of replies and retweets)
- Appeal to an audience of: ${targetAudience}
- Be known for great writing style on Twitter

Return ONLY a JSON array of Twitter handles (without @), nothing else.
Example: ["naval","sahaborhil","dickiebush","coaborhil","alexhormozi"]`;

  let discoveredHandles: string[] = [];

  try {
    const raw = await generateWithClaude(discoveryPrompt, {
      maxTokens: 256,
      temperature: 0.9,
    });

    // Parse JSON array from response
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        discoveredHandles = parsed
          .map((h: unknown) => (typeof h === "string" ? h.replace("@", "").trim() : ""))
          .filter(Boolean)
          .slice(0, 5);
      }
    }
    console.log(`[twitter-discovery] Discovered handles: ${discoveredHandles.join(", ")}`);
  } catch (e) {
    console.error("[twitter-discovery] Discovery prompt failed:", e);
    return { accounts: [], stylePrompt: "", discoveredHandles: [] };
  }

  if (discoveredHandles.length === 0) {
    return { accounts: [], stylePrompt: "", discoveredHandles: [] };
  }

  // Step 2: Scrape top 3 discovered accounts
  let accounts: TwitterAccountStyle[] = [];
  try {
    accounts = await scrapeMultipleAccounts(discoveredHandles.slice(0, 3));
    console.log(`[twitter-discovery] Successfully scraped ${accounts.length} accounts`);
  } catch (e) {
    console.error("[twitter-discovery] Scraping failed, returning handles only:", e);
    // Graceful degradation — we still return the handles so they can be saved
  }

  // Step 3: Generate style prompt from scraped data
  const stylePrompt = accounts.length > 0 ? generateStylePrompt(accounts) : "";

  return { accounts, stylePrompt, discoveredHandles };
}
