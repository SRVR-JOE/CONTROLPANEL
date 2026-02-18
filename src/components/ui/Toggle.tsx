'use client';

interface ToggleProps {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  warning?: boolean;
}

export function Toggle({ label, enabled, onChange, warning }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted">{label}</span>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => onChange(!enabled)}
        className={`w-10 h-5 rounded-full relative transition-colors ${
          enabled
            ? warning ? 'bg-warning' : 'bg-success'
            : 'bg-muted/30'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
