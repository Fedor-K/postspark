// Platform types for multi-platform support

export type Platform = 'linkedin' | 'twitter';

export interface Tweet {
  content: string;
  characterCount: number;
}

export interface ThreadPost {
  tweets: Tweet[];
  totalTweets: number;
}

export interface PostIdea {
  title: string;
  description: string;
  format: string;
  platform?: Platform;
}

export interface TwitterIdea extends PostIdea {
  format: 'single-tweet' | 'thread-3' | 'thread-5';
}

export interface LinkedInIdea extends PostIdea {
  format: 'story' | 'tips' | 'opinion' | 'case-study' | 'confession' | 'how-to';
}

export interface PlatformConfig {
  name: string;
  icon: string;
  maxLength: number;
  seeMoreLimit?: number;
  tones: { id: string; label: string; description: string }[];
}

export interface GeneratedPost {
  content: string;
  platform: Platform;
  tone: string;
  isThread?: boolean;
  threadParts?: string[];
}
