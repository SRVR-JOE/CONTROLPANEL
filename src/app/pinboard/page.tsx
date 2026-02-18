'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import PinBoardCanvas from '@/components/pinboard/PinBoardCanvas';
import AddPinDialog from '@/components/pinboard/AddPinDialog';
import { Plus } from 'lucide-react';

export default function PinBoardPage() {
  const pinBoards = useStore((s) => s.pinBoards);
  const [dialogOpen, setDialogOpen] = useState(false);

  const board = pinBoards[0];

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No pin boards configured.
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="relative h-full w-full">
        <PinBoardCanvas boardId={board.id} />

        {/* Floating add button */}
        <button
          onClick={() => setDialogOpen(true)}
          className="absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-transform hover:scale-110 active:scale-95"
          title="Add Device"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Board name label */}
        <div className="absolute left-4 top-4 z-20 rounded-md bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
          {board.name}
        </div>
      </div>

      <AddPinDialog
        boardId={board.id}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
