'use client';

import { useState } from 'react';
import { DeviceManufacturer, DeviceHealth } from '@/types';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';

interface ConnectionTestResult {
  reachable: boolean;
  health?: DeviceHealth | null;
  firmware?: string;
  errors?: string[];
}

type TestState = 'idle' | 'testing' | 'success' | 'failed';

interface ConnectionTesterProps {
  ip: string;
  manufacturer: DeviceManufacturer;
  port?: number;
  onResult: (result: ConnectionTestResult) => void;
}

export default function ConnectionTester({
  ip,
  manufacturer,
  port,
  onResult,
}: ConnectionTesterProps) {
  const [state, setState] = useState<TestState>('idle');
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const runTest = async () => {
    setState('testing');
    setResult(null);

    try {
      const res = await fetch('/api/devices/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, manufacturer, port }),
      });

      const data: ConnectionTestResult = await res.json();
      setResult(data);
      setState(data.reachable ? 'success' : 'failed');
      onResult(data);
    } catch {
      const failResult: ConnectionTestResult = {
        reachable: false,
        errors: ['Network error — could not reach test endpoint'],
      };
      setResult(failResult);
      setState('failed');
      onResult(failResult);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={runTest}
        disabled={state === 'testing' || !ip}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === 'testing' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            Test Connection
          </>
        )}
      </button>

      {/* Result display */}
      {state === 'success' && result && (
        <div className="rounded-md border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <Wifi className="h-4 w-4" />
            Device reachable
          </div>
          {result.firmware && (
            <p className="mt-1 text-xs text-muted">
              Firmware: <span className="font-mono text-foreground">{result.firmware}</span>
            </p>
          )}
          {result.health && result.health.temperature > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              Temperature: <span className="font-mono text-foreground">{result.health.temperature.toFixed(1)}&deg;C</span>
            </p>
          )}
          {result.health && result.health.warnings && result.health.warnings.length > 0 && (
            <div className="mt-1">
              {result.health.warnings.map((w, i) => (
                <p key={i} className="text-xs text-warning">{w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {state === 'failed' && result && (
        <div className="rounded-md border border-error/30 bg-error/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-error">
            <WifiOff className="h-4 w-4" />
            Device unreachable
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-muted">{e}</p>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            You can still add the device — it will appear as offline.
          </div>
        </div>
      )}
    </div>
  );
}
