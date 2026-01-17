'use client';

import { Platform } from '@/types';
import { parseThread, countTwitterChars, TWITTER_CHAR_LIMIT, LINKEDIN_CHAR_LIMIT, LINKEDIN_SEE_MORE_LIMIT } from '@/lib/constants';

interface CharacterCounterProps {
  text: string;
  platform?: Platform;
  maxLength?: number;
}

export default function CharacterCounter({ text, platform = 'linkedin', maxLength }: CharacterCounterProps) {
  if (platform === 'twitter') {
    return <TwitterCounter text={text} />;
  }

  return <LinkedInCounter text={text} maxLength={maxLength || LINKEDIN_CHAR_LIMIT} />;
}

function LinkedInCounter({ text, maxLength }: { text: string; maxLength: number }) {
  const length = text.length;
  const SEE_MORE_LIMIT = LINKEDIN_SEE_MORE_LIMIT;

  // Calculate percentages
  const seeMorePercent = Math.min((length / SEE_MORE_LIMIT) * 100, 100);
  const totalPercent = (length / maxLength) * 100;

  // Determine colors
  const getSeeMoreColor = () => {
    if (length <= SEE_MORE_LIMIT) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getTotalColor = () => {
    if (length <= maxLength * 0.7) return 'bg-blue-500';
    if (length <= maxLength * 0.9) return 'bg-yellow-500';
    if (length <= maxLength) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2 text-xs">
      {/* See More Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-20">See more:</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${getSeeMoreColor()} transition-all`}
            style={{ width: `${seeMorePercent}%` }}
          />
        </div>
        <span className={`w-16 text-right ${length > SEE_MORE_LIMIT ? 'text-yellow-400' : 'text-green-400'}`}>
          {length}/{SEE_MORE_LIMIT}
        </span>
      </div>

      {/* Total Character Count */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-20">Total:</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${getTotalColor()} transition-all`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        <span className={`w-16 text-right ${length > maxLength ? 'text-red-400' : 'text-gray-300'}`}>
          {length}/{maxLength}
        </span>
      </div>

      {/* Status Messages */}
      <div className="flex gap-4 text-[10px]">
        {length <= SEE_MORE_LIMIT ? (
          <span className="text-green-400">✓ No "see more" cutoff</span>
        ) : (
          <span className="text-yellow-400">⚠ "See more" will appear</span>
        )}
        {length > maxLength && (
          <span className="text-red-400">✗ Over LinkedIn limit!</span>
        )}
      </div>
    </div>
  );
}

function TwitterCounter({ text }: { text: string }) {
  const tweets = parseThread(text);
  const isThread = tweets.length > 1;

  if (isThread) {
    return (
      <div className="space-y-2 text-xs">
        {/* Thread Overview */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400">Thread:</span>
          <span className="text-blue-400 font-medium">{tweets.length} tweets</span>
        </div>

        {/* Individual Tweet Counts */}
        {tweets.map((tweet, index) => {
          const charCount = countTwitterChars(tweet);
          const percent = Math.min((charCount / TWITTER_CHAR_LIMIT) * 100, 100);
          const isOver = charCount > TWITTER_CHAR_LIMIT;

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-gray-400 w-20">Tweet {index + 1}:</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isOver ? 'bg-red-500' : charCount > TWITTER_CHAR_LIMIT * 0.9 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className={`w-20 text-right ${isOver ? 'text-red-400' : 'text-gray-300'}`}>
                {charCount}/{TWITTER_CHAR_LIMIT}
              </span>
            </div>
          );
        })}

        {/* Status */}
        <div className="text-[10px]">
          {tweets.every(t => countTwitterChars(t) <= TWITTER_CHAR_LIMIT) ? (
            <span className="text-green-400">✓ All tweets within limit</span>
          ) : (
            <span className="text-red-400">✗ Some tweets over limit!</span>
          )}
        </div>
      </div>
    );
  }

  // Single tweet
  const charCount = countTwitterChars(text);
  const percent = Math.min((charCount / TWITTER_CHAR_LIMIT) * 100, 100);
  const isOver = charCount > TWITTER_CHAR_LIMIT;

  const getColor = () => {
    if (isOver) return 'bg-red-500';
    if (charCount > TWITTER_CHAR_LIMIT * 0.9) return 'bg-yellow-500';
    if (charCount > TWITTER_CHAR_LIMIT * 0.7) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Character Count */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-20">Characters:</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`w-20 text-right ${isOver ? 'text-red-400' : 'text-gray-300'}`}>
          {charCount}/{TWITTER_CHAR_LIMIT}
        </span>
      </div>

      {/* Status */}
      <div className="text-[10px]">
        {isOver ? (
          <span className="text-red-400">✗ Over Twitter limit by {charCount - TWITTER_CHAR_LIMIT} chars</span>
        ) : charCount > TWITTER_CHAR_LIMIT * 0.9 ? (
          <span className="text-yellow-400">⚠ Almost at limit ({TWITTER_CHAR_LIMIT - charCount} left)</span>
        ) : (
          <span className="text-green-400">✓ {TWITTER_CHAR_LIMIT - charCount} characters remaining</span>
        )}
      </div>
    </div>
  );
}
