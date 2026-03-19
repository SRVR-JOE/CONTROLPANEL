import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { NamingTemplate, NamingAssignment } from '@/types';
import { NAMING_PRESETS } from '@/lib/constants';
import {
  generateBatchNames,
  detectConflicts,
  type NamingConflict,
} from '@/lib/naming-engine';
import { useStore } from '@/store';

// ============================================================
// Hydrate built-in presets
// ============================================================

const now = new Date().toISOString();

const builtInTemplates: NamingTemplate[] = NAMING_PRESETS.map((p) => ({
  ...p,
  createdAt: now,
  updatedAt: now,
}));

// ============================================================
// Store interface
// ============================================================

interface NamingStore {
  templates: NamingTemplate[];
  assignments: NamingAssignment[];
  selectedDeviceIds: string[];
  selectedTemplateId: string | null;
  variableOverrides: Record<string, string>;
  startNumber: number;
  numberPadding: number;

  // Template CRUD
  addTemplate: (template: Omit<NamingTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) => string;
  updateTemplate: (id: string, updates: Partial<Pick<NamingTemplate, 'name' | 'pattern' | 'variables' | 'locationType'>>) => void;
  deleteTemplate: (id: string) => void;

  // Selection
  setSelectedDeviceIds: (ids: string[]) => void;
  toggleDeviceSelection: (id: string) => void;
  selectAllDevices: () => void;
  clearSelection: () => void;
  setSelectedTemplate: (id: string | null) => void;
  setVariableOverrides: (overrides: Record<string, string>) => void;
  setStartNumber: (n: number) => void;
  setNumberPadding: (n: number) => void;

  // Preview & apply
  getPreviewNames: () => { deviceId: string; name: string }[];
  getConflicts: () => NamingConflict[];
  applyNames: () => void;

  // Batch state
  lastAppliedAt: string | null;
}

// ============================================================
// Store
// ============================================================

export const useNamingStore = create<NamingStore>((set, get) => ({
  templates: builtInTemplates,
  assignments: [],
  selectedDeviceIds: [],
  selectedTemplateId: null,
  variableOverrides: {},
  startNumber: 1,
  numberPadding: 2,
  lastAppliedAt: null,

  // Template CRUD
  addTemplate: (template) => {
    const id = `tpl-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    set((state) => ({
      templates: [
        ...state.templates,
        { ...template, id, isBuiltIn: false, createdAt: now, updatedAt: now },
      ],
    }));
    return id;
  },

  updateTemplate: (id, updates) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id && !t.isBuiltIn
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    })),

  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id || t.isBuiltIn),
      selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
    })),

  // Selection
  setSelectedDeviceIds: (ids) => set({ selectedDeviceIds: ids }),

  toggleDeviceSelection: (id) =>
    set((state) => ({
      selectedDeviceIds: state.selectedDeviceIds.includes(id)
        ? state.selectedDeviceIds.filter((d) => d !== id)
        : [...state.selectedDeviceIds, id],
    })),

  selectAllDevices: () => {
    const devices = useStore.getState().devices;
    set({ selectedDeviceIds: devices.map((d) => d.id) });
  },

  clearSelection: () => set({ selectedDeviceIds: [] }),

  setSelectedTemplate: (id) => {
    const state = get();
    const template = state.templates.find((t) => t.id === id);
    set({
      selectedTemplateId: id,
      variableOverrides: template ? { ...template.variables } : {},
    });
  },

  setVariableOverrides: (overrides) => set({ variableOverrides: overrides }),
  setStartNumber: (n) => set({ startNumber: n }),
  setNumberPadding: (n) => set({ numberPadding: n }),

  // Preview
  getPreviewNames: () => {
    const { selectedDeviceIds, selectedTemplateId, templates, variableOverrides, startNumber, numberPadding } = get();
    if (!selectedTemplateId || selectedDeviceIds.length === 0) return [];

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return [];

    const mergedVars = { ...template.variables, ...variableOverrides };
    const names = generateBatchNames(
      template.pattern,
      mergedVars,
      selectedDeviceIds.length,
      startNumber,
      numberPadding,
    );

    return selectedDeviceIds.map((deviceId, i) => ({
      deviceId,
      name: names[i],
    }));
  },

  // Conflicts
  getConflicts: () => {
    const proposed = get().getPreviewNames();
    if (proposed.length === 0) return [];
    const devices = useStore.getState().devices;
    const excludeIds = get().selectedDeviceIds;
    return detectConflicts(proposed, devices, excludeIds);
  },

  // Apply
  applyNames: () => {
    const proposed = get().getPreviewNames();
    if (proposed.length === 0) return;

    const { selectedTemplateId, variableOverrides } = get();

    // Update assignments
    const newAssignments: NamingAssignment[] = proposed.map(({ deviceId, name }) => ({
      deviceId,
      templateId: selectedTemplateId!,
      generatedName: name,
      variableOverrides: { ...variableOverrides },
      applied: true,
    }));

    // Apply names to devices in the main store
    const appStore = useStore.getState();
    for (const { deviceId, name } of proposed) {
      const device = appStore.devices.find((d) => d.id === deviceId);
      if (device) {
        // Use the main store's internal setter
        useStore.setState((state) => ({
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, name } : d
          ),
        }));
      }
    }

    set((state) => ({
      assignments: [
        ...state.assignments.filter(
          (a) => !proposed.some((p) => p.deviceId === a.deviceId)
        ),
        ...newAssignments,
      ],
      lastAppliedAt: new Date().toISOString(),
    }));
  },
}));
