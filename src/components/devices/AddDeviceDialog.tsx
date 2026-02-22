'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { DeviceManufacturer, DeviceCategory } from '@/types';
import { CATALOG, ALL_CATALOG_PRODUCTS, createDeviceFromCatalog } from '@/lib/catalog';
import { CATEGORY_LABELS } from '@/lib/constants';
import DeviceCatalogCard from './DeviceCatalogCard';
import ConnectionTester from './ConnectionTester';
import {
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
} from 'lucide-react';

type Step = 1 | 2 | 3;

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDeviceDialog({ open, onClose }: AddDeviceDialogProps) {
  const addDevice = useStore((s) => s.addDevice);
  const racks = useStore((s) => s.racks);

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: Browse
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Step 2: Configure
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [rackId, setRackId] = useState('');
  const [rackSlot, setRackSlot] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [firmware, setFirmware] = useState('');

  // Step 3: Test
  const [testDone, setTestDone] = useState(false);
  const [testReachable, setTestReachable] = useState(false);
  const [discoveredFirmware, setDiscoveredFirmware] = useState<string | undefined>();

  // Derived
  const selectedProduct = useMemo(
    () => ALL_CATALOG_PRODUCTS.find((p) => p.modelId === selectedProductId),
    [selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    return ALL_CATALOG_PRODUCTS.filter((p) => {
      if (filterManufacturer !== 'all' && p.manufacturer !== filterManufacturer) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          p.modelName.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [filterManufacturer, filterCategory, searchQuery]);

  // Get unique categories from visible products
  const visibleCategories = useMemo(() => {
    const cats = new Set<DeviceCategory>();
    for (const p of ALL_CATALOG_PRODUCTS) {
      if (filterManufacturer === 'all' || p.manufacturer === filterManufacturer) {
        cats.add(p.category);
      }
    }
    return Array.from(cats);
  }, [filterManufacturer]);

  const ipValid = /^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddress);

  const resetForm = () => {
    setStep(1);
    setFilterManufacturer('all');
    setFilterCategory('all');
    setSearchQuery('');
    setSelectedProductId(null);
    setDeviceName('');
    setIpAddress('');
    setRackId('');
    setRackSlot('');
    setSerialNumber('');
    setFirmware('');
    setTestDone(false);
    setTestReachable(false);
    setDiscoveredFirmware(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const product = ALL_CATALOG_PRODUCTS.find((p) => p.modelId === productId);
    if (product) {
      setDeviceName(product.modelName);
    }
  };

  const handleAddDevice = () => {
    if (!selectedProduct) return;

    const device = createDeviceFromCatalog(
      selectedProduct.manufacturer as DeviceManufacturer,
      selectedProduct,
      ipAddress,
      deviceName || selectedProduct.modelName,
      {
        rackId: rackId || undefined,
        rackSlot: rackSlot ? parseInt(rackSlot, 10) : undefined,
        serialNumber: serialNumber || undefined,
        firmware: discoveredFirmware ?? (firmware || undefined),
      }
    );

    // If test was successful, set status to online
    if (testReachable) {
      (device as typeof device & { status: string }).status = 'online';
    }

    addDevice(device);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card flex w-full max-w-4xl flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Add Device</h2>
            <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
              Step {step} of 3
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 border-b border-border px-5 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  s === step
                    ? 'bg-accent text-white'
                    : s < step
                      ? 'bg-success text-white'
                      : 'bg-surface-2 text-muted'
                }`}
              >
                {s < step ? <Check className="h-3 w-3" /> : s}
              </div>
              <span className={`text-xs ${s === step ? 'text-foreground' : 'text-muted'}`}>
                {s === 1 ? 'Browse' : s === 2 ? 'Configure' : 'Test'}
              </span>
              {s < 3 && <ChevronRight className="mx-1 h-3 w-3 text-muted" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ─── Step 1: Browse Catalog ─── */}
          {step === 1 && (
            <div className="flex gap-4" style={{ minHeight: '400px' }}>
              {/* Left sidebar — manufacturers */}
              <div className="w-44 flex-shrink-0 space-y-1">
                <p className="mb-2 text-xs font-medium text-muted">Manufacturers</p>
                <button
                  onClick={() => setFilterManufacturer('all')}
                  className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    filterManufacturer === 'all'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  All ({ALL_CATALOG_PRODUCTS.length})
                </button>
                {CATALOG.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFilterManufacturer(m.id)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                      filterManufacturer === m.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:bg-surface-2 hover:text-foreground'
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: m.brandColor }}
                    />
                    <span className="truncate">{m.displayName}</span>
                    <span className="ml-auto text-[10px] text-muted">{m.products.length}</span>
                  </button>
                ))}
              </div>

              {/* Right content area */}
              <div className="flex-1 space-y-3">
                {/* Search + category filter */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
                  >
                    <option value="all">All Categories</option>
                    {visibleCategories.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c] ?? c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <DeviceCatalogCard
                      key={p.modelId}
                      product={p}
                      manufacturer={p.manufacturer as DeviceManufacturer}
                      brandColor={p.brandColor}
                      displayName={p.displayName}
                      selected={selectedProductId === p.modelId}
                      onClick={() => handleSelectProduct(p.modelId)}
                    />
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted">No products match the current filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 2: Configure ─── */}
          {step === 2 && selectedProduct && (
            <div className="mx-auto max-w-md space-y-4">
              {/* Selected product summary */}
              <div className="rounded-md border border-border bg-surface p-3">
                <p className="text-sm font-semibold text-foreground">{selectedProduct.modelName}</p>
                <p className="text-xs text-muted">
                  {selectedProduct.displayName} &middot;{' '}
                  {CATEGORY_LABELS[selectedProduct.category] ?? selectedProduct.category}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder={selectedProduct.modelName}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
                />
              </div>

              {/* IP Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">IP Address *</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 10.0.1.100"
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted ${
                    ipAddress && !ipValid
                      ? 'border-error focus:border-error'
                      : 'border-border focus:border-accent'
                  }`}
                />
                {ipAddress && !ipValid && (
                  <p className="text-xs text-error">Enter a valid IP address</p>
                )}
              </div>

              {/* Rack assignment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Rack</label>
                  <select
                    value={rackId}
                    onChange={(e) => setRackId(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  >
                    <option value="">None</option>
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                {rackId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">Starting RU</label>
                    <input
                      type="number"
                      min={1}
                      max={26}
                      value={rackSlot}
                      onChange={(e) => setRackSlot(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
                    />
                  </div>
                )}
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Firmware</label>
                  <input
                    type="text"
                    value={firmware}
                    onChange={(e) => setFirmware(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Test & Confirm ─── */}
          {step === 3 && selectedProduct && (
            <div className="mx-auto max-w-md space-y-4">
              {/* Summary */}
              <div className="rounded-md border border-border bg-surface p-3">
                <p className="text-sm font-semibold text-foreground">
                  {deviceName || selectedProduct.modelName}
                </p>
                <p className="text-xs text-muted">
                  {selectedProduct.displayName} &middot; {ipAddress}
                </p>
              </div>

              {/* Connection tester */}
              <ConnectionTester
                ip={ipAddress}
                manufacturer={selectedProduct.manufacturer as DeviceManufacturer}
                onResult={(result) => {
                  setTestDone(true);
                  setTestReachable(result.reachable);
                  if (result.firmware) setDiscoveredFirmware(result.firmware);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Cancel
            </button>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!selectedProductId}
                className="flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!ipValid}
                className="flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleAddDevice}
                className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
              >
                <Plus className="h-4 w-4" />
                {testDone && !testReachable ? 'Add Anyway' : 'Add Device'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
