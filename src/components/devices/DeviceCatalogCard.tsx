'use client';

import { DeviceCategory, DeviceManufacturer } from '@/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import { Server } from 'lucide-react';

interface CatalogCardProduct {
  modelId: string;
  modelName: string;
  category: DeviceCategory;
  rackUnits: number;
  features: string[];
  description?: string;
  defaultPorts: Array<{ label: string; count: number }>;
}

interface DeviceCatalogCardProps {
  product: CatalogCardProduct;
  manufacturer: DeviceManufacturer;
  brandColor: string;
  displayName: string;
  selected: boolean;
  onClick: () => void;
}

export default function DeviceCatalogCard({
  product,
  brandColor,
  displayName,
  selected,
  onClick,
}: DeviceCatalogCardProps) {
  const totalPorts = product.defaultPorts.reduce((sum, p) => sum + p.count, 0);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all hover:bg-surface-2/50 ${
        selected
          ? 'border-accent bg-accent/5 ring-1 ring-accent'
          : 'border-border bg-surface'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {product.modelName}
          </p>
          <span
            className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            {displayName}
          </span>
        </div>
        <span className="flex-shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
          {CATEGORY_LABELS[product.category] ?? product.category}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
        {product.rackUnits > 0 && (
          <span className="flex items-center gap-1">
            <Server className="h-3 w-3" />
            {product.rackUnits}U
          </span>
        )}
        <span>{totalPorts} ports</span>
      </div>

      {/* Features */}
      {product.features.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {product.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
            >
              {f}
            </span>
          ))}
          {product.features.length > 3 && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
              +{product.features.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
