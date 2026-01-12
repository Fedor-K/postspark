'use client';
import { useState } from 'react';
import { ctas, ctaCategories, CTA } from '../data/ctas';

interface CTAsLibraryProps {
  onSelect: (cta: string) => void;
}

export default function CTAsLibrary({ onSelect }: CTAsLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState<number | null>(null);

  const filteredCTAs = selectedCategory === 'all' 
    ? ctas 
    : ctas.filter(c => c.category === selectedCategory);

  const handleCopy = (cta: CTA) => {
    navigator.clipboard.writeText(cta.text);
    setCopied(cta.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🎯 CTAs & Endings</h3>
        <span className="text-xs text-gray-400">{filteredCTAs.length} endings</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-pink-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          All
        </button>
        {ctaCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-pink-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* CTAs List */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
        {filteredCTAs.map(cta => (
          <div 
            key={cta.id}
            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all group"
          >
            <p className="text-gray-200 text-sm mb-2">{cta.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded">
                {ctaCategories.find(c => c.id === cta.category)?.label}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(cta)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
                >
                  {copied === cta.id ? '✓' : 'Copy'}
                </button>
                <button
                  onClick={() => onSelect(cta.text)}
                  className="px-2 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded text-xs"
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
