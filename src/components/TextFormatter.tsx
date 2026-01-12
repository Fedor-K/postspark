'use client';
import { useState } from 'react';

// Unicode character maps for LinkedIn formatting
const BOLD_MAP: { [key: string]: string } = {
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵',
  'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽',
  'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅',
  'y': '𝘆', 'z': '𝘇',
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛',
  'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣',
  'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫',
  'Y': '𝗬', 'Z': '𝗭',
  '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

const ITALIC_MAP: { [key: string]: string } = {
  'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩',
  'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱',
  'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹',
  'y': '𝘺', 'z': '𝘻',
  'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏',
  'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗',
  'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟',
  'Y': '𝘠', 'Z': '𝘡'
};

export const toBold = (text: string): string => {
  return text.split('').map(char => BOLD_MAP[char] || char).join('');
};

export const toItalic = (text: string): string => {
  return text.split('').map(char => ITALIC_MAP[char] || char).join('');
};

interface TextFormatterProps {
  text: string;
  onFormat: (formattedText: string) => void;
}

export default function TextFormatter({ text, onFormat }: TextFormatterProps) {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleFormat = (type: 'bold' | 'italic' | 'bullet' | 'numbered') => {
    const before = text.slice(0, selection.start);
    const selected = text.slice(selection.start, selection.end);
    const after = text.slice(selection.end);

    let formatted = '';
    
    switch (type) {
      case 'bold':
        formatted = before + toBold(selected) + after;
        break;
      case 'italic':
        formatted = before + toItalic(selected) + after;
        break;
      case 'bullet':
        formatted = before + selected.split('\n').map(line => '• ' + line).join('\n') + after;
        break;
      case 'numbered':
        formatted = before + selected.split('\n').map((line, i) => `${i + 1}. ` + line).join('\n') + after;
        break;
    }
    
    onFormat(formatted);
  };

  const insertEmoji = (emoji: string) => {
    const before = text.slice(0, selection.start);
    const after = text.slice(selection.end);
    onFormat(before + emoji + after);
  };

  const popularEmojis = ['✅', '🚀', '💡', '🎯', '📈', '⚡', '🔥', '💪', '👇', '➡️'];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-white/5 rounded-lg border border-white/10">
      <button
        onClick={() => handleFormat('bold')}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-bold"
        title="Bold (select text first)"
      >
        B
      </button>
      <button
        onClick={() => handleFormat('italic')}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm italic"
        title="Italic (select text first)"
      >
        I
      </button>
      <button
        onClick={() => handleFormat('bullet')}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
        title="Bullet list"
      >
        • List
      </button>
      <button
        onClick={() => handleFormat('numbered')}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
        title="Numbered list"
      >
        1. List
      </button>
      
      <div className="w-px bg-white/20 mx-1" />
      
      {popularEmojis.map(emoji => (
        <button
          key={emoji}
          onClick={() => insertEmoji(emoji)}
          className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
