import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { parseThread } from "@/lib/constants";

const sql = neon(process.env.DATABASE_URL!);
const CRON_SECRET = process.env.CRON_SECRET || "postspark-weekly-2024-secret";

// GET — return the oldest queued post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT q.id, q.post_content, q.content_type, q.idea_title, u.twitter_handle
      FROM twitter_post_queue q
      JOIN users u ON q.user_id = u.id
      WHERE q.status = 'queued'
      ORDER BY q.created_at ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ hasPost: false });
    }

    const row = rows[0];
    const postContent = row.post_content as string;
    const contentType = row.content_type as string;
    const isThreadContent = contentType.startsWith("thread");
    const threadParts = isThreadContent ? parseThread(postContent) : null;

    return NextResponse.json({
      hasPost: true,
      postContent,
      queueItemId: row.id,
      twitterHandle: row.twitter_handle,
      contentType,
      ideaTitle: row.idea_title,
      isThread: isThreadContent && threadParts !== null && threadParts.length > 1,
      threadParts: isThreadContent && threadParts && threadParts.length > 1 ? threadParts : null,
    });
  } catch (error: unknown) {
    console.error("Next-post GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH — mark a queued post as posted or failed
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { queueItemId, status, errorMessage } = body;

    if (!queueItemId || !status) {
      return NextResponse.json(
        { error: "Missing queueItemId or status" },
        { status: 400 }
      );
    }

    if (status !== "posted" && status !== "failed") {
      return NextResponse.json(
        { error: "Status must be 'posted' or 'failed'" },
        { status: 400 }
      );
    }

    if (status === "posted") {
      await sql`
        UPDATE twitter_post_queue
        SET status = 'posted', posted_at = NOW()
        WHERE id = ${queueItemId}
      `;
    } else {
      await sql`
        UPDATE twitter_post_queue
        SET status = 'failed', error_message = ${errorMessage || null}
        WHERE id = ${queueItemId}
      `;
    }

    return NextResponse.json({ success: true, queueItemId, status });
  } catch (error: unknown) {
    console.error("Next-post PATCH error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
