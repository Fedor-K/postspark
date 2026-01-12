'use client';
import { useState } from 'react';

interface LinkedInPreviewProps {
  content: string;
  authorName: string;
  authorHeadline?: string;
}

export default function LinkedInPreview({ content, authorName, authorHeadline }: LinkedInPreviewProps) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [expanded, setExpanded] = useState(false);

  // LinkedIn truncates at ~210 characters for "see more"
  const SEE_MORE_LIMIT = 210;
  const shouldTruncate = content.length > SEE_MORE_LIMIT && !expanded;
  
  const displayContent = shouldTruncate 
    ? content.slice(0, SEE_MORE_LIMIT).trim() + '...'
    : content;

  const initials = authorName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setView('desktop')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'desktop'
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          🖥️ Desktop
        </button>
        <button
          onClick={() => setView('mobile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'mobile'
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          📱 Mobile
        </button>
      </div>

      {/* Preview Container */}
      <div className={`mx-auto bg-white rounded-lg shadow-xl overflow-hidden ${
        view === 'mobile' ? 'max-w-[375px]' : 'max-w-[550px]'
      }`}>
        {/* LinkedIn Header */}
        <div className="bg-[#0a66c2] px-4 py-2 flex items-center justify-between">
          <span className="text-white font-semibold text-lg">LinkedIn</span>
          <div className="flex gap-2">
            <div className="w-5 h-5 bg-white/20 rounded"></div>
            <div className="w-5 h-5 bg-white/20 rounded"></div>
          </div>
        </div>

        {/* Post Card */}
        <div className="p-4">
          {/* Author Info */}
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{authorName}</p>
              <p className="text-gray-500 text-xs truncate">{authorHeadline || 'LinkedIn Member'}</p>
              <p className="text-gray-400 text-xs">Just now · 🌐</p>
            </div>
            <button className="text-blue-600 text-sm font-semibold">+ Follow</button>
          </div>

          {/* Post Content */}
          <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
            {displayContent}
            {shouldTruncate && (
              <button 
                onClick={() => setExpanded(true)}
                className="text-gray-500 hover:text-gray-700 ml-1"
              >
                ...see more
              </button>
            )}
          </div>

          {/* Engagement Bar */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <span className="flex -space-x-1">
                  <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">👍</span>
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white">❤️</span>
                </span>
                <span className="ml-1">You and 42 others</span>
              </div>
              <span>8 comments</span>
            </div>
            <div className="flex justify-between">
              {['👍 Like', '💬 Comment', '🔄 Repost', '📤 Send'].map((action) => (
                <button key={action} className="text-gray-500 text-xs font-medium hover:bg-gray-100 px-3 py-2 rounded">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* See More Indicator */}
      <div className="text-center">
        <span className={`text-xs px-3 py-1 rounded-full ${
          content.length <= SEE_MORE_LIMIT 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {content.length <= SEE_MORE_LIMIT 
            ? '✓ Full post visible without "see more"'
            : `"See more" appears at char ${SEE_MORE_LIMIT}`
          }
        </span>
      </div>
    </div>
  );
}
