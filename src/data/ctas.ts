// CTAs & Endings Library - call-to-actions for Solopreneurs & Coaches
// Categories: engagement, follow, save, share, action
// Platforms: linkedin, twitter, both

import { Platform } from '@/types';

export interface CTA {
  id: number;
  text: string;
  category: 'engagement' | 'follow' | 'save' | 'share' | 'action' | 'soft';
  style: 'question' | 'statement' | 'emoji';
  platform: Platform | 'both';
}

export const ctas: CTA[] = [
  // ENGAGEMENT CTAs - Get comments (15) - Both platforms
  { id: 1, text: "What's your take on this? Drop a comment below.", category: 'engagement', style: 'question', platform: 'both' },
  { id: 2, text: "Agree or disagree? I want to hear your perspective.", category: 'engagement', style: 'question', platform: 'both' },
  { id: 3, text: "What would you add to this list?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 4, text: "Share your experience in the comments.", category: 'engagement', style: 'statement', platform: 'linkedin' },
  { id: 5, text: "What's the biggest lesson you've learned about this?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 6, text: "Did this resonate with you? Let me know below.", category: 'engagement', style: 'question', platform: 'linkedin' },
  { id: 7, text: "I'm curious—what's your story?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 8, text: "Tag someone who needs to hear this.", category: 'engagement', style: 'statement', platform: 'linkedin' },
  { id: 9, text: "Which point hit home the hardest?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 10, text: "Tell me in one word: How does this make you feel?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 11, text: "What's your unpopular opinion on this topic?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 12, text: "Drop a 🔥 if you've experienced this.", category: 'engagement', style: 'emoji', platform: 'both' },
  { id: 13, text: "Comment 'YES' if this speaks to you.", category: 'engagement', style: 'statement', platform: 'linkedin' },
  { id: 14, text: "What's stopping you from taking action on this?", category: 'engagement', style: 'question', platform: 'both' },
  { id: 15, text: "I'd love to hear your thoughts. Don't be shy.", category: 'engagement', style: 'statement', platform: 'linkedin' },

  // FOLLOW CTAs (10) - Both platforms
  { id: 16, text: "Follow me for more insights like this.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 17, text: "If this helped, hit the follow button. More coming.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 18, text: "Want more content like this? Follow along.", category: 'follow', style: 'question', platform: 'both' },
  { id: 19, text: "I share tips like this daily. Follow to stay updated.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 20, text: "New here? I help [niche] grow. Hit follow.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 21, text: "Let's connect! Follow + send me a DM.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 22, text: "Building in public. Follow the journey.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 23, text: "More posts like this every week. Don't miss out.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 24, text: "Join 10K+ others learning about [topic]. Follow me.", category: 'follow', style: 'statement', platform: 'both' },
  { id: 25, text: "Follow for the next part of this series.", category: 'follow', style: 'statement', platform: 'both' },

  // SAVE CTAs (8) - LinkedIn focused
  { id: 26, text: "Save this post. You'll need it later.", category: 'save', style: 'statement', platform: 'linkedin' },
  { id: 27, text: "Bookmark this for when you need a reminder.", category: 'save', style: 'statement', platform: 'both' },
  { id: 28, text: "♻️ Repost to help someone in your network.", category: 'save', style: 'emoji', platform: 'linkedin' },
  { id: 29, text: "Save + share with someone who needs this.", category: 'save', style: 'statement', platform: 'linkedin' },
  { id: 30, text: "This one's worth saving. Trust me.", category: 'save', style: 'statement', platform: 'linkedin' },
  { id: 31, text: "Hit save before you scroll. You'll thank me.", category: 'save', style: 'statement', platform: 'linkedin' },
  { id: 32, text: "📌 Pin this to your profile if you agree.", category: 'save', style: 'emoji', platform: 'linkedin' },
  { id: 33, text: "Repost if you want your network to see this.", category: 'save', style: 'statement', platform: 'linkedin' },

  // ACTION CTAs (10) - Both platforms
  { id: 34, text: "Ready to take the next step? DM me 'START'.", category: 'action', style: 'statement', platform: 'both' },
  { id: 35, text: "Want my free guide on this? Comment 'GUIDE'.", category: 'action', style: 'statement', platform: 'linkedin' },
  { id: 36, text: "Link in my bio for more resources.", category: 'action', style: 'statement', platform: 'both' },
  { id: 37, text: "DM me if you want to chat about this.", category: 'action', style: 'statement', platform: 'both' },
  { id: 38, text: "Book a free call—link in comments.", category: 'action', style: 'statement', platform: 'linkedin' },
  { id: 39, text: "Comment 'INFO' and I'll send you details.", category: 'action', style: 'statement', platform: 'linkedin' },
  { id: 40, text: "Take one action today based on this post.", category: 'action', style: 'statement', platform: 'both' },
  { id: 41, text: "Send this to a friend who's struggling with this.", category: 'action', style: 'statement', platform: 'both' },
  { id: 42, text: "Screenshot this and make it your wallpaper.", category: 'action', style: 'statement', platform: 'both' },
  { id: 43, text: "Pick one tip and implement it this week.", category: 'action', style: 'statement', platform: 'both' },

  // SOFT ENDINGS (7) - Both platforms
  { id: 44, text: "Thanks for reading. See you tomorrow.", category: 'soft', style: 'statement', platform: 'both' },
  { id: 45, text: "That's it. Simple, right?", category: 'soft', style: 'question', platform: 'both' },
  { id: 46, text: "The end. Now go take action.", category: 'soft', style: 'statement', platform: 'both' },
  { id: 47, text: "Until next time. 🙌", category: 'soft', style: 'emoji', platform: 'both' },
  { id: 48, text: "Now you know. What will you do with it?", category: 'soft', style: 'question', platform: 'both' },
  { id: 49, text: "Go make it happen.", category: 'soft', style: 'statement', platform: 'both' },
  { id: 50, text: "Your move.", category: 'soft', style: 'statement', platform: 'both' },

  // TWITTER-SPECIFIC CTAs (15)
  { id: 51, text: "RT if you agree 🔄", category: 'engagement', style: 'emoji', platform: 'twitter' },
  { id: 52, text: "Quote tweet your hot take 👇", category: 'engagement', style: 'emoji', platform: 'twitter' },
  { id: 53, text: "Reply with your biggest challenge.", category: 'engagement', style: 'statement', platform: 'twitter' },
  { id: 54, text: "@ someone who needs to see this", category: 'engagement', style: 'statement', platform: 'twitter' },
  { id: 55, text: "Hit like if this hit different ❤️", category: 'engagement', style: 'emoji', platform: 'twitter' },
  { id: 56, text: "Follow for more threads like this 🧵", category: 'follow', style: 'emoji', platform: 'twitter' },
  { id: 57, text: "I tweet about [topic] daily. Follow for more.", category: 'follow', style: 'statement', platform: 'twitter' },
  { id: 58, text: "Like + RT = more content like this", category: 'save', style: 'statement', platform: 'twitter' },
  { id: 59, text: "Bookmark this thread 🔖", category: 'save', style: 'emoji', platform: 'twitter' },
  { id: 60, text: "If you learned something, RT the first tweet.", category: 'save', style: 'statement', platform: 'twitter' },
  { id: 61, text: "DM me 'HELP' for more info", category: 'action', style: 'statement', platform: 'twitter' },
  { id: 62, text: "Link in bio if you want the full guide.", category: 'action', style: 'statement', platform: 'twitter' },
  { id: 63, text: "That's it. That's the tweet.", category: 'soft', style: 'statement', platform: 'twitter' },
  { id: 64, text: "End of thread. Now go execute.", category: 'soft', style: 'statement', platform: 'twitter' },
  { id: 65, text: "See you in the replies 👋", category: 'soft', style: 'emoji', platform: 'twitter' },
];

export const ctaCategories = [
  { id: 'engagement', label: 'Get Comments', emoji: '💬', description: 'Drive discussion and engagement' },
  { id: 'follow', label: 'Gain Followers', emoji: '➕', description: 'Encourage people to follow you' },
  { id: 'save', label: 'Save & Share', emoji: '🔖', description: 'Get saves and reposts' },
  { id: 'action', label: 'Take Action', emoji: '🎯', description: 'Drive specific actions or conversions' },
  { id: 'soft', label: 'Soft Ending', emoji: '👋', description: 'Casual, friendly closings' },
];

export const getCTAsByCategory = (category: string, platform?: Platform) => {
  let filtered = ctas.filter(c => c.category === category);
  if (platform) {
    filtered = filtered.filter(c => c.platform === platform || c.platform === 'both');
  }
  return filtered;
};

export const getCTAsByPlatform = (platform: Platform) =>
  ctas.filter(c => c.platform === platform || c.platform === 'both');

export const getRandomCTA = (category?: string, platform?: Platform) => {
  let filtered = ctas;
  if (category) filtered = filtered.filter(c => c.category === category);
  if (platform) filtered = filtered.filter(c => c.platform === platform || c.platform === 'both');
  return filtered[Math.floor(Math.random() * filtered.length)];
};
