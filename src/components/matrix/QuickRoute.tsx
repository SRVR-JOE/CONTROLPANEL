'use client';

import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import type { MatrixRouter } from '@/types';
import { Search, RotateCcw, ArrowRight } from 'lucide-react';

interface QuickRouteProps {
  router: MatrixRouter;
}

export default function QuickRoute({ router }: QuickRouteProps) {
  const setRoute = useStore((s) => s.setRoute);
  const [filter, setFilter] = useState('');

  const filteredOutputs = useMemo(() => {
    if (!filter.trim()) return router.outputs;
    const term = filter.toLowerCase();
    return router.outputs.filter(
      (o) =>
        o.label.toLowerCase().includes(term) ||
        String(o.index).includes(term),
    );
  }, [router.outputs, filter]);

  const handleRouteChange = useCallback(
    (outputIndex: number, inputIndex: number) => {
      setRoute(router.id, outputIndex, inputIndex);
    },
    [router.id, setRoute],
  );

  const handleOneToOne = useCallback(() => {
    const maxRoutes = Math.min(router.inputs.length, router.outputs.length);
    for (let i = 0; i < maxRoutes; i++) {
      setRoute(router.id, router.outputs[i].index, router.inputs[i].index);
    }
  }, [router, setRoute]);

  const handleClearAll = useCallback(() => {
    // Route all outputs to input 0 (unrouted - we set routedFrom to 0 which
    // won't match any real input index starting at 1)
    for (const output of router.outputs) {
      setRoute(router.id, output.index, 0);
    }
  }, [router, setRoute]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
          Quick Route
        </h3>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-b border-[var(--border)] px-3 py-2">
        <button
          onClick={handleOneToOne}
          className="flex items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/25"
        >
          <ArrowRight className="h-3 w-3" />
          1:1
        </button>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 rounded-md bg-[var(--error)]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--error)] transition-colors hover:bg-[var(--error)]/20"
        >
          <RotateCcw className="h-3 w-3" />
          Clear All
        </button>
      </div>

      {/* Search / Filter */}
      <div className="relative border-b border-[var(--border)] px-3 py-2">
        <Search className="absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter outputs..."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-1.5 pl-7 pr-2 text-xs text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Output list */}
      <div className="flex-1 overflow-y-auto">
        {filteredOutputs.map((output) => {
          const currentInput = output.routedFrom;

          return (
            <div
              key={output.id}
              className="flex items-center gap-2 border-b border-[var(--border)]/50 px-3 py-1.5 last:border-b-0"
            >
              {/* Output label */}
              <div className="flex min-w-[80px] items-center gap-1.5">
                <span className="text-[10px] font-bold text-[var(--muted)]">
                  {output.index}
                </span>
                <span className="truncate text-xs text-[var(--foreground)]">
                  {output.label}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-3 w-3 flex-shrink-0 text-[var(--muted)]" />

              {/* Input dropdown */}
              <select
                value={currentInput ?? 0}
                onChange={(e) =>
                  handleRouteChange(output.index, parseInt(e.target.value, 10))
                }
                className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[11px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              >
                <option value={0}>-- None --</option>
                {router.inputs.map((input) => (
                  <option key={input.id} value={input.index}>
                    {input.label}
                    {input.signal ? ' *' : ''}
                  </option>
                ))}
              </select>

              {/* Current routing label */}
              <span className="hidden min-w-[60px] text-right text-[10px] text-[var(--muted)] sm:block">
                {currentInput && currentInput > 0
                  ? `In ${currentInput}`
                  : '---'}
              </span>
            </div>
          );
        })}

        {filteredOutputs.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-[var(--muted)]">
            No outputs match filter
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="border-t border-[var(--border)] px-3 py-2">
        <span className="text-[10px] text-[var(--muted)]">
          {router.outputs.filter((o) => o.routedFrom && o.routedFrom > 0).length}{' '}
          / {router.outputs.length} outputs routed
        </span>
      </div>
    </div>
  );
}
