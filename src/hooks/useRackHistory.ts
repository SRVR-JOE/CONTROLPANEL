'use client';

import { useCallback, useRef, useState } from 'react';
import { useStore } from '@/store';

// ============================================================
// Types
// ============================================================

interface RackLocation {
  rackId: string;
  slot: number;
  column: number;
}

export interface RackHistoryAction {
  /** assign = device placed into rack from unassigned tray */
  type: 'assign' | 'unassign' | 'move';
  deviceId: string;
  /** Previous location before this action (undefined for assign from tray) */
  from?: RackLocation;
  /** Target location this action moved the device to (undefined for unassign) */
  to?: RackLocation;
}

// ============================================================
// Constants
// ============================================================

const MAX_HISTORY = 50;

// ============================================================
// Hook
// ============================================================

export function useRackHistory() {
  const assignDeviceToRack = useStore((s) => s.assignDeviceToRack);
  const removeDeviceFromRack = useStore((s) => s.removeDeviceFromRack);

  // Use refs for stacks to avoid triggering re-renders on every push/pop
  const historyRef = useRef<RackHistoryAction[]>([]);
  const redoRef = useRef<RackHistoryAction[]>([]);

  // Expose length as state so consumers can derive canUndo / canRedo reactively
  const [historyLength, setHistoryLength] = useState(0);
  const [redoLength, setRedoLength] = useState(0);

  /** Add a new action to the history stack. Clears redo stack. */
  const pushAction = useCallback((action: RackHistoryAction) => {
    historyRef.current = [...historyRef.current, action].slice(-MAX_HISTORY);
    redoRef.current = [];
    setHistoryLength(historyRef.current.length);
    setRedoLength(0);
  }, []);

  /** Reverse a single action using the store's mutations */
  const reverseAction = useCallback(
    (action: RackHistoryAction) => {
      switch (action.type) {
        case 'assign':
          // Undo an assign: remove the device from rack back to unassigned tray
          removeDeviceFromRack(action.deviceId);
          break;

        case 'unassign':
          // Undo an unassign: put device back into its prior rack slot
          if (action.from) {
            assignDeviceToRack(
              action.deviceId,
              action.from.rackId,
              action.from.slot,
              action.from.column
            );
          }
          break;

        case 'move':
          // Undo a move: return device to its prior location
          if (action.from) {
            assignDeviceToRack(
              action.deviceId,
              action.from.rackId,
              action.from.slot,
              action.from.column
            );
          } else {
            // Had no prior location — means it came from unassigned tray
            removeDeviceFromRack(action.deviceId);
          }
          break;
      }
    },
    [assignDeviceToRack, removeDeviceFromRack]
  );

  /** Re-apply a single action (used by redo) */
  const reapplyAction = useCallback(
    (action: RackHistoryAction) => {
      switch (action.type) {
        case 'assign':
        case 'move':
          if (action.to) {
            assignDeviceToRack(
              action.deviceId,
              action.to.rackId,
              action.to.slot,
              action.to.column
            );
          }
          break;

        case 'unassign':
          removeDeviceFromRack(action.deviceId);
          break;
      }
    },
    [assignDeviceToRack, removeDeviceFromRack]
  );

  /** Pop the last action from history, reverse it, and push to redo stack */
  const undo = useCallback(() => {
    const history = historyRef.current;
    if (history.length === 0) return;

    const action = history[history.length - 1];
    historyRef.current = history.slice(0, -1);
    redoRef.current = [...redoRef.current, action];

    reverseAction(action);

    setHistoryLength(historyRef.current.length);
    setRedoLength(redoRef.current.length);
  }, [reverseAction]);

  /** Pop from redo stack, re-apply it, push back to history */
  const redo = useCallback(() => {
    const redoStack = redoRef.current;
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    redoRef.current = redoStack.slice(0, -1);
    historyRef.current = [...historyRef.current, action].slice(-MAX_HISTORY);

    reapplyAction(action);

    setHistoryLength(historyRef.current.length);
    setRedoLength(redoRef.current.length);
  }, [reapplyAction]);

  return {
    pushAction,
    undo,
    redo,
    canUndo: historyLength > 0,
    canRedo: redoLength > 0,
    historyLength,
    redoLength,
  };
}
