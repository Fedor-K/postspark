'use client';

interface CharacterCounterProps {
  text: string;
  maxLength?: number;
}

export default function CharacterCounter({ text, maxLength = 3000 }: CharacterCounterProps) {
  const length = text.length;
  const SEE_MORE_LIMIT = 210;
  
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
