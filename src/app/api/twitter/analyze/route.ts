import { NextRequest, NextResponse } from "next/server";
import { scrapeTwitterAccount, TwitterAccountStyle } from "@/lib/twitter-scraper";

export async function POST(request: NextRequest) {
  try {
    const { handles } = await request.json();

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json({ error: "No handles provided" }, { status: 400 });
    }

    // Limit to 5 accounts
    const limitedHandles = handles.slice(0, 5);
    const results: TwitterAccountStyle[] = [];
    const errors: string[] = [];

    for (const handle of limitedHandles) {
      const cleanHandle = handle.replace('@', '').trim();
      if (!cleanHandle) continue;

      console.log(`Analyzing Twitter account: @${cleanHandle}`);

      try {
        const style = await scrapeTwitterAccount(cleanHandle);
        if (style) {
          results.push(style);
        } else {
          errors.push(`@${cleanHandle}: No tweets found`);
        }
      } catch (e) {
        console.error(`Error analyzing @${cleanHandle}:`, e);
        errors.push(`@${cleanHandle}: Failed to analyze`);
      }
    }

    return NextResponse.json({
      accounts: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error("Twitter analyze error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
