'use client';

import { Platform } from '@/types';
import { PLATFORM_CONFIGS } from '@/lib/constants';

interface PlatformSelectorProps {
  platform: Platform;
  onChange: (platform: Platform) => void;
}

export default function PlatformSelector({ platform, onChange }: PlatformSelectorProps) {
  const platforms: Platform[] = ['linkedin', 'twitter'];

  return (
    <div className="flex gap-2">
      {platforms.map((p) => {
        const config = PLATFORM_CONFIGS[p];
        const isSelected = platform === p;

        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? p === 'linkedin'
                  ? 'bg-[#0a66c2] text-white'
                  : 'bg-black text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <span className="text-base">{config.icon}</span>
            <span>{config.name}</span>
          </button>
        );
      })}
    </div>
  );
}
