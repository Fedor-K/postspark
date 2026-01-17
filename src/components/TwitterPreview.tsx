'use client';

import { useState } from 'react';
import { parseThread, countTwitterChars, TWITTER_CHAR_LIMIT } from '@/lib/constants';

interface TwitterPreviewProps {
  content: string;
  authorName: string;
  authorHandle?: string;
}

export default function TwitterPreview({ content, authorName, authorHandle }: TwitterPreviewProps) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');

  const tweets = parseThread(content);
  const isThread = tweets.length > 1;

  const initials = authorName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handle = authorHandle || authorName.toLowerCase().replace(/\s+/g, '');

  const renderTweet = (tweetContent: string, index: number) => {
    const charCount = countTwitterChars(tweetContent);
    const isOverLimit = charCount > TWITTER_CHAR_LIMIT;

    return (
      <div key={index} className={`${index > 0 ? 'border-t border-gray-700' : ''}`}>
        {/* Tweet Header */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Author Info */}
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-white text-sm">{authorName}</span>
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
                <span className="text-gray-500 text-sm">@{handle}</span>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-sm">now</span>
              </div>

              {/* Thread indicator */}
              {isThread && (
                <div className="text-gray-500 text-xs mb-2">
                  {index + 1}/{tweets.length}
                </div>
              )}

              {/* Tweet Text */}
              <div className={`text-white text-[15px] leading-5 whitespace-pre-wrap break-words ${isOverLimit ? 'text-red-400' : ''}`}>
                {tweetContent}
              </div>

              {/* Engagement Bar */}
              <div className="flex items-center justify-between mt-3 max-w-[425px]">
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400 group">
                  <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-xs">12</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-green-400 group">
                  <div className="p-2 rounded-full group-hover:bg-green-400/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-xs">45</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-pink-400 group">
                  <div className="p-2 rounded-full group-hover:bg-pink-400/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-xs">234</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400 group">
                  <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setView('desktop')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'desktop'
              ? 'bg-black text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          🖥️ Desktop
        </button>
        <button
          onClick={() => setView('mobile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'mobile'
              ? 'bg-black text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          📱 Mobile
        </button>
      </div>

      {/* Preview Container */}
      <div className={`mx-auto bg-black rounded-xl border border-gray-700 overflow-hidden ${
        view === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'
      }`}>
        {/* X/Twitter Header */}
        <div className="bg-black px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <span className="text-white font-bold">Post</span>
          <div className="w-6" />
        </div>

        {/* Tweets */}
        {isThread ? (
          <div>
            {tweets.map((tweet, index) => renderTweet(tweet, index))}
          </div>
        ) : (
          renderTweet(content, 0)
        )}
      </div>

      {/* Character/Thread Info */}
      <div className="flex justify-center gap-4">
        {isThread ? (
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
            📝 Thread with {tweets.length} tweets
          </span>
        ) : (
          <span className={`text-xs px-3 py-1 rounded-full ${
            countTwitterChars(content) <= TWITTER_CHAR_LIMIT
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {countTwitterChars(content) <= TWITTER_CHAR_LIMIT
              ? `✓ ${countTwitterChars(content)}/${TWITTER_CHAR_LIMIT} characters`
              : `✗ ${countTwitterChars(content)}/${TWITTER_CHAR_LIMIT} - over limit!`
            }
          </span>
        )}
      </div>
    </div>
  );
}
