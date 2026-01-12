interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.SMTP2GO_API_KEY,
        to: [to],
        sender: "PostSpark <hello@postspark.pro>",
        subject,
        html_body: html,
        text_body: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    const data = await response.json();
    
    if (data.data?.succeeded > 0) {
      console.log("Email sent successfully to:", to);
      return true;
    } else {
      console.error("Email failed:", data);
      return false;
    }
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}

export function generateWelcomeEmail(name: string | null, ideas: Array<{title: string}>, niche: string): string {
  const ideasList = ideas.slice(0, 5).map((idea, i) => 
    `<li style="margin-bottom: 10px;">${i + 1}. ${idea.title}</li>`
  ).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #f97316, #ec4899); border-radius: 10px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">P</div>
    <h1 style="margin: 10px 0 0; color: #1a1a2e;">PostSpark</h1>
  </div>

  <h2 style="color: #1a1a2e;">Hey${name ? ` ${name}` : ""}! 👋</h2>
  
  <p>Your personalized LinkedIn post ideas are ready!</p>
  
  <p>Here's a preview of your ideas for <strong>${niche}</strong>:</p>
  
  <ul style="background: #f8f9fa; padding: 20px 20px 20px 40px; border-radius: 10px; border-left: 4px solid #f97316;">
    ${ideasList}
  </ul>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://postspark.pro" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f97316, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View All Ideas & Write Posts</a>
  </div>

  <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1a1a2e;">📌 Quick Tips for LinkedIn Success:</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Post between 8-10 AM or 5-7 PM for best reach</li>
      <li>Your first line is the hook - make it count!</li>
      <li>End with a question to boost comments</li>
      <li>Be consistent - aim for 3-4 posts per week</li>
    </ul>
  </div>

  <p style="color: #666;">We'll send you fresh ideas every Monday to keep your content flowing.</p>
  
  <p>Happy posting! 🚀<br>
  <strong>The PostSpark Team</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    You're receiving this because you signed up at postspark.pro<br>
    <a href="https://postspark.pro/unsubscribe" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>
`;
}

export function generateWeeklyEmail(name: string | null, ideas: Array<{title: string; description: string}>, niche: string): string {
  const ideasList = ideas.map((idea, i) => 
    `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
      <strong style="color: #f97316;">#${i + 1}</strong> ${idea.title}
      <p style="margin: 5px 0 0; font-size: 14px; color: #666;">${idea.description}</p>
    </div>`
  ).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #f97316, #ec4899); border-radius: 10px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">P</div>
    <h1 style="margin: 10px 0 0; color: #1a1a2e;">Your Weekly Ideas</h1>
  </div>

  <p>Hey${name ? ` ${name}` : ""}! Here are 5 fresh LinkedIn post ideas for your <strong>${niche}</strong> audience this week:</p>
  
  ${ideasList}
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://postspark.pro" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f97316, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Write These Posts Now</a>
  </div>

  <p style="color: #666;">Have a great week! 🚀</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    <a href="https://postspark.pro/unsubscribe" style="color: #999;">Unsubscribe</a> from weekly emails
  </p>
</body>
</html>
`;
}
