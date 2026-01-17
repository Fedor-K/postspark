// Twitter Hooks Library - 55 hooks for Solopreneurs & Coaches
// Categories: hot-take, thread-starter, listicle, story, question, insight

export interface TwitterHook {
  id: number;
  text: string;
  category: 'hot-take' | 'thread-starter' | 'listicle' | 'story' | 'question' | 'insight';
  niche: 'universal' | 'coaching' | 'freelance' | 'consulting' | 'startup';
  format: 'single-tweet' | 'thread';
}

export const twitterHooks: TwitterHook[] = [
  // HOT TAKES (12)
  { id: 1, text: "Unpopular opinion: Hustle culture is dead.", category: 'hot-take', niche: 'universal', format: 'single-tweet' },
  { id: 2, text: "Most business advice is just survivorship bias.", category: 'hot-take', niche: 'startup', format: 'single-tweet' },
  { id: 3, text: "You don't need 10k followers to make money.", category: 'hot-take', niche: 'freelance', format: 'single-tweet' },
  { id: 4, text: "Certifications don't make you good at your job.", category: 'hot-take', niche: 'coaching', format: 'single-tweet' },
  { id: 5, text: "The best marketing is a great product.", category: 'hot-take', niche: 'startup', format: 'single-tweet' },
  { id: 6, text: "Networking events are a waste of time.", category: 'hot-take', niche: 'consulting', format: 'single-tweet' },
  { id: 7, text: "Your morning routine isn't why you're successful.", category: 'hot-take', niche: 'universal', format: 'single-tweet' },
  { id: 8, text: "Cold DMs work. You're just doing them wrong.", category: 'hot-take', niche: 'freelance', format: 'single-tweet' },
  { id: 9, text: "Content < distribution. Always.", category: 'hot-take', niche: 'universal', format: 'single-tweet' },
  { id: 10, text: "Degrees are becoming irrelevant in tech.", category: 'hot-take', niche: 'startup', format: 'single-tweet' },
  { id: 11, text: "Work-life balance is a myth. Work-life integration is real.", category: 'hot-take', niche: 'freelance', format: 'single-tweet' },
  { id: 12, text: "Most coaches teach what they learned, not what they did.", category: 'hot-take', niche: 'coaching', format: 'single-tweet' },

  // THREAD STARTERS (12)
  { id: 13, text: "I went from $0 to $100k/year. Here's how:", category: 'thread-starter', niche: 'freelance', format: 'thread' },
  { id: 14, text: "5 years of freelancing. Here's what I learned:", category: 'thread-starter', niche: 'freelance', format: 'thread' },
  { id: 15, text: "I've coached 100+ clients. The #1 pattern I see:", category: 'thread-starter', niche: 'coaching', format: 'thread' },
  { id: 16, text: "My biggest business failure (and what it taught me):", category: 'thread-starter', niche: 'startup', format: 'thread' },
  { id: 17, text: "I studied 50 viral tweets. Here's what they have in common:", category: 'thread-starter', niche: 'universal', format: 'thread' },
  { id: 18, text: "How I built my first 1000 followers:", category: 'thread-starter', niche: 'universal', format: 'thread' },
  { id: 19, text: "The exact system I use to close clients:", category: 'thread-starter', niche: 'consulting', format: 'thread' },
  { id: 20, text: "I quit my 6-figure job. Here's what happened:", category: 'thread-starter', niche: 'startup', format: 'thread' },
  { id: 21, text: "10 lessons I learned the hard way:", category: 'thread-starter', niche: 'universal', format: 'thread' },
  { id: 22, text: "My content creation system (step by step):", category: 'thread-starter', niche: 'universal', format: 'thread' },
  { id: 23, text: "The mindset shift that changed everything:", category: 'thread-starter', niche: 'coaching', format: 'thread' },
  { id: 24, text: "How to build a personal brand from scratch:", category: 'thread-starter', niche: 'universal', format: 'thread' },

  // LISTICLES (10)
  { id: 25, text: "7 tools that 10x'd my productivity:", category: 'listicle', niche: 'universal', format: 'single-tweet' },
  { id: 26, text: "5 books that made me a better coach:", category: 'listicle', niche: 'coaching', format: 'single-tweet' },
  { id: 27, text: "3 skills that will never become obsolete:", category: 'listicle', niche: 'universal', format: 'single-tweet' },
  { id: 28, text: "4 red flags in clients (run away):", category: 'listicle', niche: 'freelance', format: 'single-tweet' },
  { id: 29, text: "6 things I wish I knew at 25:", category: 'listicle', niche: 'universal', format: 'single-tweet' },
  { id: 30, text: "5 ways to double your rates:", category: 'listicle', niche: 'consulting', format: 'single-tweet' },
  { id: 31, text: "8 habits of highly effective founders:", category: 'listicle', niche: 'startup', format: 'single-tweet' },
  { id: 32, text: "3 questions I ask every new client:", category: 'listicle', niche: 'coaching', format: 'single-tweet' },
  { id: 33, text: "4 marketing mistakes killing your business:", category: 'listicle', niche: 'startup', format: 'single-tweet' },
  { id: 34, text: "5 signs you're ready to go full-time:", category: 'listicle', niche: 'freelance', format: 'single-tweet' },

  // STORY HOOKS (10)
  { id: 35, text: "2 years ago I was broke and lost.", category: 'story', niche: 'universal', format: 'single-tweet' },
  { id: 36, text: "Yesterday a client said something that hit hard.", category: 'story', niche: 'coaching', format: 'single-tweet' },
  { id: 37, text: "I got rejected 30 times before my first yes.", category: 'story', niche: 'freelance', format: 'single-tweet' },
  { id: 38, text: "Last month I almost quit. Then this happened.", category: 'story', niche: 'startup', format: 'single-tweet' },
  { id: 39, text: "My first client paid me $50. My last paid $5000.", category: 'story', niche: 'consulting', format: 'single-tweet' },
  { id: 40, text: "I remember my first viral tweet. It changed everything.", category: 'story', niche: 'universal', format: 'single-tweet' },
  { id: 41, text: "A stranger's DM changed my entire career.", category: 'story', niche: 'universal', format: 'single-tweet' },
  { id: 42, text: "The day I fired my biggest client.", category: 'story', niche: 'freelance', format: 'single-tweet' },
  { id: 43, text: "I made $0 for 6 months. Here's why I kept going.", category: 'story', niche: 'startup', format: 'single-tweet' },
  { id: 44, text: "This one email cost me $10k.", category: 'story', niche: 'consulting', format: 'single-tweet' },

  // QUESTIONS (6)
  { id: 45, text: "What's the one skill that transformed your career?", category: 'question', niche: 'universal', format: 'single-tweet' },
  { id: 46, text: "Why do most people give up right before success?", category: 'question', niche: 'coaching', format: 'single-tweet' },
  { id: 47, text: "What's holding you back from charging premium?", category: 'question', niche: 'freelance', format: 'single-tweet' },
  { id: 48, text: "If you could start over, what would you do different?", category: 'question', niche: 'startup', format: 'single-tweet' },
  { id: 49, text: "What's your biggest bottleneck right now?", category: 'question', niche: 'consulting', format: 'single-tweet' },
  { id: 50, text: "Are you building a business or a job?", category: 'question', niche: 'universal', format: 'single-tweet' },

  // INSIGHTS (5)
  { id: 51, text: "The difference between $50k and $500k? Positioning.", category: 'insight', niche: 'consulting', format: 'single-tweet' },
  { id: 52, text: "Success leaves clues. Most people aren't paying attention.", category: 'insight', niche: 'universal', format: 'single-tweet' },
  { id: 53, text: "Your network is your net worth is still true in 2024.", category: 'insight', niche: 'startup', format: 'single-tweet' },
  { id: 54, text: "The best time to start was yesterday. The next best is now.", category: 'insight', niche: 'coaching', format: 'single-tweet' },
  { id: 55, text: "Consistency beats intensity. Every. Single. Time.", category: 'insight', niche: 'freelance', format: 'single-tweet' },
];

export const twitterHookCategories = [
  { id: 'hot-take', label: 'Hot Takes', emoji: '🔥', description: 'Controversial opinions that spark debate' },
  { id: 'thread-starter', label: 'Thread Starters', emoji: '🧵', description: 'Perfect openers for longer threads' },
  { id: 'listicle', label: 'Listicles', emoji: '📝', description: 'Numbered lists that get saves' },
  { id: 'story', label: 'Story Hooks', emoji: '📖', description: 'Personal narratives that connect' },
  { id: 'question', label: 'Questions', emoji: '❓', description: 'Engage followers with reflection' },
  { id: 'insight', label: 'Insights', emoji: '💡', description: 'Share wisdom in one line' },
];

export const getTwitterHooksByCategory = (category: string) =>
  twitterHooks.filter(h => h.category === category);

export const getTwitterHooksByNiche = (niche: string) =>
  twitterHooks.filter(h => h.niche === niche || h.niche === 'universal');

export const getTwitterHooksByFormat = (format: 'single-tweet' | 'thread') =>
  twitterHooks.filter(h => h.format === format);

export const getRandomTwitterHook = (category?: string, niche?: string, format?: 'single-tweet' | 'thread') => {
  let filtered = twitterHooks;
  if (category) filtered = filtered.filter(h => h.category === category);
  if (niche) filtered = filtered.filter(h => h.niche === niche || h.niche === 'universal');
  if (format) filtered = filtered.filter(h => h.format === format);
  return filtered[Math.floor(Math.random() * filtered.length)];
};
