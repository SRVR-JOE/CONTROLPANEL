'use client';

import { Sparkles } from 'lucide-react';

interface CopilotButtonProps {
  onClick: () => void;
  alertCount: number;
}

export default function CopilotButton({ onClick, alertCount }: CopilotButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/25 transition-transform hover:scale-110 active:scale-95"
      aria-label={`Open AI Copilot${alertCount > 0 ? ` (${alertCount} alerts)` : ''}`}
    >
      <Sparkles className="h-5 w-5" />
      {alertCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
          {alertCount > 9 ? '9+' : alertCount}
        </span>
      )}
    </button>
  );
}
