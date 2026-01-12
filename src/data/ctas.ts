// CTAs & Endings Library - 50 call-to-actions for Solopreneurs & Coaches
// Categories: engagement, follow, save, share, action

export interface CTA {
  id: number;
  text: string;
  category: 'engagement' | 'follow' | 'save' | 'share' | 'action' | 'soft';
  style: 'question' | 'statement' | 'emoji';
}

export const ctas: CTA[] = [
  // ENGAGEMENT CTAs - Get comments (15)
  { id: 1, text: "What's your take on this? Drop a comment below.", category: 'engagement', style: 'question' },
  { id: 2, text: "Agree or disagree? I want to hear your perspective.", category: 'engagement', style: 'question' },
  { id: 3, text: "What would you add to this list?", category: 'engagement', style: 'question' },
  { id: 4, text: "Share your experience in the comments.", category: 'engagement', style: 'statement' },
  { id: 5, text: "What's the biggest lesson you've learned about this?", category: 'engagement', style: 'question' },
  { id: 6, text: "Did this resonate with you? Let me know below.", category: 'engagement', style: 'question' },
  { id: 7, text: "I'm curious—what's your story?", category: 'engagement', style: 'question' },
  { id: 8, text: "Tag someone who needs to hear this.", category: 'engagement', style: 'statement' },
  { id: 9, text: "Which point hit home the hardest?", category: 'engagement', style: 'question' },
  { id: 10, text: "Tell me in one word: How does this make you feel?", category: 'engagement', style: 'question' },
  { id: 11, text: "What's your unpopular opinion on this topic?", category: 'engagement', style: 'question' },
  { id: 12, text: "Drop a 🔥 if you've experienced this.", category: 'engagement', style: 'emoji' },
  { id: 13, text: "Comment 'YES' if this speaks to you.", category: 'engagement', style: 'statement' },
  { id: 14, text: "What's stopping you from taking action on this?", category: 'engagement', style: 'question' },
  { id: 15, text: "I'd love to hear your thoughts. Don't be shy.", category: 'engagement', style: 'statement' },

  // FOLLOW CTAs (10)
  { id: 16, text: "Follow me for more insights like this.", category: 'follow', style: 'statement' },
  { id: 17, text: "If this helped, hit the follow button. More coming.", category: 'follow', style: 'statement' },
  { id: 18, text: "Want more content like this? Follow along.", category: 'follow', style: 'question' },
  { id: 19, text: "I share tips like this daily. Follow to stay updated.", category: 'follow', style: 'statement' },
  { id: 20, text: "New here? I help [niche] grow. Hit follow.", category: 'follow', style: 'statement' },
  { id: 21, text: "Let's connect! Follow + send me a DM.", category: 'follow', style: 'statement' },
  { id: 22, text: "Building in public. Follow the journey.", category: 'follow', style: 'statement' },
  { id: 23, text: "More posts like this every week. Don't miss out.", category: 'follow', style: 'statement' },
  { id: 24, text: "Join 10K+ others learning about [topic]. Follow me.", category: 'follow', style: 'statement' },
  { id: 25, text: "Follow for the next part of this series.", category: 'follow', style: 'statement' },

  // SAVE CTAs (8)
  { id: 26, text: "Save this post. You'll need it later.", category: 'save', style: 'statement' },
  { id: 27, text: "Bookmark this for when you need a reminder.", category: 'save', style: 'statement' },
  { id: 28, text: "♻️ Repost to help someone in your network.", category: 'save', style: 'emoji' },
  { id: 29, text: "Save + share with someone who needs this.", category: 'save', style: 'statement' },
  { id: 30, text: "This one's worth saving. Trust me.", category: 'save', style: 'statement' },
  { id: 31, text: "Hit save before you scroll. You'll thank me.", category: 'save', style: 'statement' },
  { id: 32, text: "📌 Pin this to your profile if you agree.", category: 'save', style: 'emoji' },
  { id: 33, text: "Repost if you want your network to see this.", category: 'save', style: 'statement' },

  // ACTION CTAs (10)
  { id: 34, text: "Ready to take the next step? DM me 'START'.", category: 'action', style: 'statement' },
  { id: 35, text: "Want my free guide on this? Comment 'GUIDE'.", category: 'action', style: 'statement' },
  { id: 36, text: "Link in my bio for more resources.", category: 'action', style: 'statement' },
  { id: 37, text: "DM me if you want to chat about this.", category: 'action', style: 'statement' },
  { id: 38, text: "Book a free call—link in comments.", category: 'action', style: 'statement' },
  { id: 39, text: "Comment 'INFO' and I'll send you details.", category: 'action', style: 'statement' },
  { id: 40, text: "Take one action today based on this post.", category: 'action', style: 'statement' },
  { id: 41, text: "Send this to a friend who's struggling with this.", category: 'action', style: 'statement' },
  { id: 42, text: "Screenshot this and make it your wallpaper.", category: 'action', style: 'statement' },
  { id: 43, text: "Pick one tip and implement it this week.", category: 'action', style: 'statement' },

  // SOFT ENDINGS (7)
  { id: 44, text: "Thanks for reading. See you tomorrow.", category: 'soft', style: 'statement' },
  { id: 45, text: "That's it. Simple, right?", category: 'soft', style: 'question' },
  { id: 46, text: "The end. Now go take action.", category: 'soft', style: 'statement' },
  { id: 47, text: "Until next time. 🙌", category: 'soft', style: 'emoji' },
  { id: 48, text: "Now you know. What will you do with it?", category: 'soft', style: 'question' },
  { id: 49, text: "Go make it happen.", category: 'soft', style: 'statement' },
  { id: 50, text: "Your move.", category: 'soft', style: 'statement' },
];

export const ctaCategories = [
  { id: 'engagement', label: 'Get Comments', emoji: '💬', description: 'Drive discussion and engagement' },
  { id: 'follow', label: 'Gain Followers', emoji: '➕', description: 'Encourage people to follow you' },
  { id: 'save', label: 'Save & Share', emoji: '🔖', description: 'Get saves and reposts' },
  { id: 'action', label: 'Take Action', emoji: '🎯', description: 'Drive specific actions or conversions' },
  { id: 'soft', label: 'Soft Ending', emoji: '👋', description: 'Casual, friendly closings' },
];

export const getCTAsByCategory = (category: string) => 
  ctas.filter(c => c.category === category);

export const getRandomCTA = (category?: string) => {
  let filtered = category ? ctas.filter(c => c.category === category) : ctas;
  return filtered[Math.floor(Math.random() * filtered.length)];
};
