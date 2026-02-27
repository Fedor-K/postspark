// Platform configurations and constants

import { Platform, PlatformConfig } from '@/types';

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    maxLength: 3000,
    seeMoreLimit: 210,
    tones: [
      { id: 'professional', label: 'Professional', description: 'Authoritative and data-driven' },
      { id: 'casual', label: 'Casual', description: 'Friendly and conversational' },
      { id: 'storytelling', label: 'Storytelling', description: 'Narrative and emotional' },
    ],
  },
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    maxLength: 280,
    tones: [
      { id: 'punchy', label: 'Punchy', description: 'Direct, sharp, one key idea' },
      { id: 'casual', label: 'Casual', description: 'Conversational, like talking to a friend' },
      { id: 'thread', label: 'Thread', description: '3-5 connected tweets with narrative' },
    ],
  },
};

export const TWITTER_CHAR_LIMIT = 280;
export const TWITTER_PREMIUM_CHAR_LIMIT = 4000;
export const LINKEDIN_CHAR_LIMIT = 3000;
export const LINKEDIN_SEE_MORE_LIMIT = 210;

export const TWITTER_FORMATS = [
  { id: 'single-tweet', label: 'Single Tweet', maxTweets: 1 },
  { id: 'long-form', label: 'Long-form Post', description: '500-1500 character deep post' },
  { id: 'thread-3', label: 'Short Thread (3)', maxTweets: 3 },
  { id: 'thread-5', label: 'Long Thread (5)', maxTweets: 5 },
];

export const DEFAULT_PLATFORM: Platform = 'linkedin';

// Thread separator for parsing
export const THREAD_SEPARATOR = '\n---\n';

// Helper to parse thread content into individual tweets
export function parseThread(content: string): string[] {
  // Normalize various separator patterns to a single format
  let normalized = content
    // Handle multiple dashes with any whitespace around them
    .replace(/\s*---+\s*/g, '\n|||SPLIT|||\n')
    // Also split on numbered patterns like "2/" at start of line
    .replace(/\n(\d+\/)/g, '\n|||SPLIT|||\n$1');

  // Split by our normalized separator
  const tweets = normalized
    .split('|||SPLIT|||')
    .map(t => t.trim())
    .filter(Boolean);

  return tweets.length > 0 ? tweets : [content];
}

// Helper to check if content is a thread
export function isThread(content: string): boolean {
  const tweets = parseThread(content);
  return tweets.length > 1;
}

// Helper to count characters in tweet (considering t.co link shortening)
export function countTwitterChars(text: string): number {
  // Twitter counts all URLs as 23 characters
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let charCount = text.length;
  const urls = text.match(urlRegex);

  if (urls) {
    for (const url of urls) {
      charCount = charCount - url.length + 23;
    }
  }

  return charCount;
}

// Storage keys
export const STORAGE_KEYS = {
  PLATFORM: 'postspark_platform',
};
