'use client';
import { useState } from 'react';
import { hooks, hookCategories, Hook } from '../data/hooks';

interface HooksLibraryProps {
  onSelect: (hook: string) => void;
  userNiche?: string;
}

export default function HooksLibrary({ onSelect, userNiche }: HooksLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState<number | null>(null);

  const filteredHooks = selectedCategory === 'all' 
    ? hooks 
    : hooks.filter(h => h.category === selectedCategory);

  // Prioritize hooks matching user's niche
  const sortedHooks = [...filteredHooks].sort((a, b) => {
    if (userNiche) {
      const aMatch = a.niche === userNiche || a.niche === 'universal';
      const bMatch = b.niche === userNiche || b.niche === 'universal';
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return 0;
  });

  const handleCopy = (hook: Hook) => {
    navigator.clipboard.writeText(hook.text);
    setCopied(hook.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🪝 Hooks Library</h3>
        <span className="text-xs text-gray-400">{sortedHooks.length} hooks</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          All
        </button>
        {hookCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Hooks List */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
        {sortedHooks.map(hook => (
          <div 
            key={hook.id}
            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all group"
          >
            <p className="text-gray-200 text-sm mb-2">{hook.text}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                  {hook.category}
                </span>
                {hook.niche !== 'universal' && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                    {hook.niche}
                  </span>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(hook)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
                >
                  {copied === hook.id ? '✓' : 'Copy'}
                </button>
                <button
                  onClick={() => onSelect(hook.text)}
                  className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
