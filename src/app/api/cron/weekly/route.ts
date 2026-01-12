import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import { sendEmail, generateWeeklyEmail } from "@/lib/email";

const sql = neon(process.env.DATABASE_URL!);

const openai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4",
});

// Secret key to protect the endpoint
const CRON_SECRET = process.env.CRON_SECRET || "postspark-weekly-cron-2024";

interface User {
  id: number;
  email: string;
  user_type: string;
  niche: string;
  target_audience: string;
  linkedin_name: string | null;
}

interface Idea {
  title: string;
  description: string;
}

async function generateWeeklyIdeas(user: User): Promise<Idea[]> {
  const prompt = `Generate 5 LinkedIn post ideas for a ${user.user_type} in ${user.niche}.

Target audience: ${user.target_audience}

Return exactly 5 ideas with scroll-stopping hooks.

RESPOND WITH VALID JSON ONLY:
{"ideas":[{"title":"hook line","description":"brief description"}]}

Make each hook specific and attention-grabbing.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "glm-4.5-air",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Parse JSON
    const startIdx = content.indexOf("{");
    const endIdx = content.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("No JSON found");
    }
    
    const json = JSON.parse(content.substring(startIdx, endIdx + 1));
    return json.ideas || [];
  } catch (error) {
    console.error("Failed to generate ideas for user:", user.email, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting weekly email job...");

    // Get all users who haven't received weekly email in last 6 days
    const users = await sql`
      SELECT u.* FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM emails_sent e 
        WHERE e.user_id = u.id 
        AND e.email_type = 'weekly' 
        AND e.sent_at > NOW() - INTERVAL '6 days'
      )
      LIMIT 50
    ` as User[];

    console.log(`Found ${users.length} users to email`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Generate personalized ideas
        const ideas = await generateWeeklyIdeas(user);
        
        if (ideas.length === 0) {
          console.log(`No ideas generated for ${user.email}, skipping`);
          continue;
        }

        // Generate and send email
        const emailHtml = generateWeeklyEmail(
          user.linkedin_name,
          ideas,
          user.niche
        );

        const success = await sendEmail({
          to: user.email,
          subject: `📬 5 Fresh LinkedIn Post Ideas for This Week`,
          html: emailHtml,
        });

        if (success) {
          // Record email sent
          await sql`INSERT INTO emails_sent (user_id, email_type) VALUES (${user.id}, 'weekly')`;
          sent++;
          console.log(`✓ Sent to ${user.email}`);
        } else {
          failed++;
          console.log(`✗ Failed for ${user.email}`);
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      sent,
      failed,
    });
  } catch (error: unknown) {
    console.error("Weekly cron error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
