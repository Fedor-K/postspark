// Hooks Library - 100 hooks for Solopreneurs & Coaches
// Categories: curiosity, question, statistic, controversial, story, lesson

export interface Hook {
  id: number;
  text: string;
  category: 'curiosity' | 'question' | 'statistic' | 'controversial' | 'story' | 'lesson';
  niche: 'universal' | 'coaching' | 'freelance' | 'consulting' | 'startup';
}

export const hooks: Hook[] = [
  // CURIOSITY HOOKS (20)
  { id: 1, text: "I almost quit my business last year. Here's what changed everything.", category: 'curiosity', niche: 'universal' },
  { id: 2, text: "The worst advice I ever got actually made me successful.", category: 'curiosity', niche: 'universal' },
  { id: 3, text: "Nobody talks about this side of entrepreneurship.", category: 'curiosity', niche: 'startup' },
  { id: 4, text: "I discovered something that tripled my client retention.", category: 'curiosity', niche: 'coaching' },
  { id: 5, text: "My biggest failure taught me the most valuable lesson.", category: 'curiosity', niche: 'universal' },
  { id: 6, text: "This one habit changed how I run my business.", category: 'curiosity', niche: 'universal' },
  { id: 7, text: "I stopped doing this and my revenue doubled.", category: 'curiosity', niche: 'freelance' },
  { id: 8, text: "The real reason most coaches fail (it's not what you think).", category: 'curiosity', niche: 'coaching' },
  { id: 9, text: "I was doing everything wrong for 3 years.", category: 'curiosity', niche: 'universal' },
  { id: 10, text: "What I learned from losing my biggest client.", category: 'curiosity', niche: 'consulting' },
  { id: 11, text: "The secret most successful entrepreneurs won't share.", category: 'curiosity', niche: 'startup' },
  { id: 12, text: "I finally understand why I was stuck for so long.", category: 'curiosity', niche: 'universal' },
  { id: 13, text: "This changed my perspective on work-life balance forever.", category: 'curiosity', niche: 'freelance' },
  { id: 14, text: "My clients don't know I do this before every session.", category: 'curiosity', niche: 'coaching' },
  { id: 15, text: "The uncomfortable truth about building a personal brand.", category: 'curiosity', niche: 'universal' },
  { id: 16, text: "I tried the popular advice. It didn't work. Here's what did.", category: 'curiosity', niche: 'universal' },
  { id: 17, text: "Something shifted in my business this month.", category: 'curiosity', niche: 'universal' },
  { id: 18, text: "I've been keeping this strategy to myself. Until now.", category: 'curiosity', niche: 'consulting' },
  { id: 19, text: "The mindset shift that took me from struggling to thriving.", category: 'curiosity', niche: 'coaching' },
  { id: 20, text: "What nobody tells you about your first 1000 followers.", category: 'curiosity', niche: 'universal' },

  // QUESTION HOOKS (20)
  { id: 21, text: "What would you do if you couldn't fail?", category: 'question', niche: 'coaching' },
  { id: 22, text: "Why do we keep making the same mistakes?", category: 'question', niche: 'universal' },
  { id: 23, text: "Are you building a business or just staying busy?", category: 'question', niche: 'startup' },
  { id: 24, text: "What's holding you back from charging what you're worth?", category: 'question', niche: 'freelance' },
  { id: 25, text: "When was the last time you invested in yourself?", category: 'question', niche: 'coaching' },
  { id: 26, text: "Do you know your real hourly rate?", category: 'question', niche: 'freelance' },
  { id: 27, text: "What if everything you believed about success was wrong?", category: 'question', niche: 'universal' },
  { id: 28, text: "Why do most people give up right before the breakthrough?", category: 'question', niche: 'coaching' },
  { id: 29, text: "Are you solving problems or creating them?", category: 'question', niche: 'consulting' },
  { id: 30, text: "What's the one thing you keep avoiding?", category: 'question', niche: 'universal' },
  { id: 31, text: "How many hours did you actually work this week?", category: 'question', niche: 'freelance' },
  { id: 32, text: "What would your ideal client say about you?", category: 'question', niche: 'consulting' },
  { id: 33, text: "Is your pricing based on value or fear?", category: 'question', niche: 'freelance' },
  { id: 34, text: "When did you last step outside your comfort zone?", category: 'question', niche: 'coaching' },
  { id: 35, text: "What's the cost of staying where you are?", category: 'question', niche: 'coaching' },
  { id: 36, text: "Are you chasing clients or attracting them?", category: 'question', niche: 'universal' },
  { id: 37, text: "What would 10x your business this year?", category: 'question', niche: 'startup' },
  { id: 38, text: "Why do we fear success as much as failure?", category: 'question', niche: 'coaching' },
  { id: 39, text: "What's your biggest bottleneck right now?", category: 'question', niche: 'consulting' },
  { id: 40, text: "Are you working in your business or on it?", category: 'question', niche: 'startup' },

  // STATISTIC HOOKS (15)
  { id: 41, text: "80% of my revenue comes from 20% of my clients.", category: 'statistic', niche: 'consulting' },
  { id: 42, text: "I spent 500+ hours last year on tasks I should have delegated.", category: 'statistic', niche: 'freelance' },
  { id: 43, text: "Only 3% of solopreneurs make it past year 5.", category: 'statistic', niche: 'startup' },
  { id: 44, text: "I raised my rates 40% and got more clients.", category: 'statistic', niche: 'freelance' },
  { id: 45, text: "92% of people never achieve their goals. Here's why.", category: 'statistic', niche: 'coaching' },
  { id: 46, text: "I used to work 70 hours a week. Now I work 30.", category: 'statistic', niche: 'universal' },
  { id: 47, text: "The average coach quits within 18 months.", category: 'statistic', niche: 'coaching' },
  { id: 48, text: "I've had 200+ discovery calls. Here's what I learned.", category: 'statistic', niche: 'consulting' },
  { id: 49, text: "My email open rate went from 15% to 45% with one change.", category: 'statistic', niche: 'universal' },
  { id: 50, text: "It took me 2 years to learn what I'll teach you in 5 minutes.", category: 'statistic', niche: 'coaching' },
  { id: 51, text: "I lost $50K before I figured this out.", category: 'statistic', niche: 'startup' },
  { id: 52, text: "73% of freelancers undercharge by at least 30%.", category: 'statistic', niche: 'freelance' },
  { id: 53, text: "My first 10 clients came from just 2 LinkedIn posts.", category: 'statistic', niche: 'universal' },
  { id: 54, text: "I analyzed 1000 viral posts. Here's the pattern.", category: 'statistic', niche: 'universal' },
  { id: 55, text: "6 months ago I had 0 followers. Now I have 10K+.", category: 'statistic', niche: 'universal' },

  // CONTROVERSIAL HOOKS (15)
  { id: 56, text: "Hustle culture is a scam. Change my mind.", category: 'controversial', niche: 'universal' },
  { id: 57, text: "Stop posting motivational quotes. Nobody cares.", category: 'controversial', niche: 'universal' },
  { id: 58, text: "Most business advice is garbage. Here's what actually works.", category: 'controversial', niche: 'startup' },
  { id: 59, text: "Unpopular opinion: Networking events are a waste of time.", category: 'controversial', niche: 'consulting' },
  { id: 60, text: "I don't believe in work-life balance. Here's why.", category: 'controversial', niche: 'startup' },
  { id: 61, text: "Hot take: You don't need a niche to succeed.", category: 'controversial', niche: 'freelance' },
  { id: 62, text: "Certifications don't make you a good coach.", category: 'controversial', niche: 'coaching' },
  { id: 63, text: "Your morning routine isn't the reason you're not successful.", category: 'controversial', niche: 'universal' },
  { id: 64, text: "I disagree with every productivity guru. Here's why.", category: 'controversial', niche: 'universal' },
  { id: 65, text: "Free advice: Stop giving free advice.", category: 'controversial', niche: 'consulting' },
  { id: 66, text: "Cold outreach is dead. Here's what replaced it.", category: 'controversial', niche: 'freelance' },
  { id: 67, text: "Your 5-year plan is useless. Do this instead.", category: 'controversial', niche: 'startup' },
  { id: 68, text: "Passion won't pay your bills. Strategy will.", category: 'controversial', niche: 'freelance' },
  { id: 69, text: "Stop copying other creators. It's hurting your brand.", category: 'controversial', niche: 'universal' },
  { id: 70, text: "Most coaches shouldn't be coaching. Harsh but true.", category: 'controversial', niche: 'coaching' },

  // STORY HOOKS (15)
  { id: 71, text: "3 years ago I was broke and burned out.", category: 'story', niche: 'universal' },
  { id: 72, text: "Yesterday a client told me something that made me cry.", category: 'story', niche: 'coaching' },
  { id: 73, text: "I got rejected 47 times before my first yes.", category: 'story', niche: 'freelance' },
  { id: 74, text: "My first coaching session was a disaster.", category: 'story', niche: 'coaching' },
  { id: 75, text: "Last week I almost sent the wrong proposal. Saved by luck.", category: 'story', niche: 'consulting' },
  { id: 76, text: "I quit my 6-figure job with no backup plan.", category: 'story', niche: 'startup' },
  { id: 77, text: "A stranger's DM changed my entire business model.", category: 'story', niche: 'universal' },
  { id: 78, text: "I was sitting in a coffee shop when it hit me.", category: 'story', niche: 'universal' },
  { id: 79, text: "My mentor gave me one piece of advice. I ignored it.", category: 'story', niche: 'coaching' },
  { id: 80, text: "The day I fired my biggest client was the best day.", category: 'story', niche: 'freelance' },
  { id: 81, text: "I remember my first $100. It felt like $1 million.", category: 'story', niche: 'freelance' },
  { id: 82, text: "Two years ago I was scrolling LinkedIn with zero followers.", category: 'story', niche: 'universal' },
  { id: 83, text: "My wife asked me a question that changed everything.", category: 'story', niche: 'universal' },
  { id: 84, text: "I wrote this post at 3am because I couldn't sleep.", category: 'story', niche: 'universal' },
  { id: 85, text: "The client said no. Then called back a month later.", category: 'story', niche: 'consulting' },

  // LESSON HOOKS (15)
  { id: 86, text: "The hardest lesson I learned in business: Trust yourself.", category: 'lesson', niche: 'universal' },
  { id: 87, text: "Here's what 5 years of coaching taught me about people.", category: 'lesson', niche: 'coaching' },
  { id: 88, text: "The biggest lie I believed when starting out.", category: 'lesson', niche: 'startup' },
  { id: 89, text: "One lesson I wish I learned earlier: Done beats perfect.", category: 'lesson', niche: 'freelance' },
  { id: 90, text: "After 100+ projects, here's what I know for sure.", category: 'lesson', niche: 'consulting' },
  { id: 91, text: "The most expensive lesson I ever paid for.", category: 'lesson', niche: 'startup' },
  { id: 92, text: "What my clients taught me about resilience.", category: 'lesson', niche: 'coaching' },
  { id: 93, text: "3 things I'd tell my younger self about freelancing.", category: 'lesson', niche: 'freelance' },
  { id: 94, text: "The counterintuitive truth about growing a business.", category: 'lesson', niche: 'startup' },
  { id: 95, text: "I learned more from my failures than my wins.", category: 'lesson', niche: 'universal' },
  { id: 96, text: "What nobody told me about being my own boss.", category: 'lesson', niche: 'freelance' },
  { id: 97, text: "The real secret to client retention (it's not what you sell).", category: 'lesson', niche: 'consulting' },
  { id: 98, text: "Here's what matters after 1000 days of building in public.", category: 'lesson', niche: 'startup' },
  { id: 99, text: "The one skill that pays for itself 10x over.", category: 'lesson', niche: 'universal' },
  { id: 100, text: "What I finally understood about success.", category: 'lesson', niche: 'universal' },
];

export const hookCategories = [
  { id: 'curiosity', label: 'Curiosity', emoji: '🤔', description: 'Create intrigue and make readers want more' },
  { id: 'question', label: 'Question', emoji: '❓', description: 'Engage readers by making them reflect' },
  { id: 'statistic', label: 'Statistic', emoji: '📊', description: 'Use numbers to build credibility' },
  { id: 'controversial', label: 'Controversial', emoji: '🔥', description: 'Challenge common beliefs' },
  { id: 'story', label: 'Story', emoji: '📖', description: 'Start with a personal narrative' },
  { id: 'lesson', label: 'Lesson', emoji: '💡', description: 'Share wisdom and insights' },
];

export const getHooksByCategory = (category: string) => 
  hooks.filter(h => h.category === category);

export const getHooksByNiche = (niche: string) => 
  hooks.filter(h => h.niche === niche || h.niche === 'universal');

export const getRandomHook = (category?: string, niche?: string) => {
  let filtered = hooks;
  if (category) filtered = filtered.filter(h => h.category === category);
  if (niche) filtered = filtered.filter(h => h.niche === niche || h.niche === 'universal');
  return filtered[Math.floor(Math.random() * filtered.length)];
};
