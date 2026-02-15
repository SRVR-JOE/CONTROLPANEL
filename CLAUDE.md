# AV Rack Control Panel

## Project Overview
Professional AV rack monitoring and control system built with Next.js 14, TypeScript, Tailwind CSS, and Zustand.

## Tech Stack
- **Framework**: Next.js 14 (App Router, client-side rendered pages)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom dark theme
- **State**: Zustand (single store at `src/store/index.ts`)
- **Icons**: lucide-react
- **IDs**: uuid v4

## Architecture

### Directory Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Main dashboard (rack overview)
│   ├── layout.tsx    # Root layout with AppShell wrapper
│   ├── globals.css   # Theme variables and custom CSS
│   ├── brompton/     # Brompton LED wall monitoring
│   ├── devices/      # Device catalog and detail pages
│   ├── health/       # Health & temperature monitoring
│   ├── matrix/       # Universal matrix routing panel
│   ├── pinboard/     # Custom device pin board
│   ├── presets/      # Preset management
│   ├── racks/        # Rack visualization & assignment
│   └── timecode/     # Timecode generator & audio routing
├── components/       # Reusable UI components
│   ├── layout/       # AppShell, Sidebar, StatusBar
│   ├── rack/         # RackUnit, RackView, DeviceSlotAssigner
│   ├── matrix/       # MatrixGrid, RouterSelector, QuickRoute
│   ├── health/       # TemperatureGauge, DeviceHealthCard, BromptonStatusPanel
│   ├── pinboard/     # PinBoardCanvas, AddPinDialog
│   ├── presets/      # PresetCard, SavePresetDialog
│   └── timecode/     # TimecodeDisplay, TransportControls, AudioRouter
├── store/            # Zustand store (single file)
│   └── index.ts
└── types/            # TypeScript type definitions
    └── index.ts
```

### Adding a New Feature
1. Add types to `src/types/index.ts`
2. Add state + actions to `src/store/index.ts`
3. Create components in `src/components/<feature>/`
4. Create page at `src/app/<feature>/page.tsx` (must start with `'use client';`)
5. Add navigation entry in `src/components/layout/Sidebar.tsx`

### Conventions
- All pages use `'use client'` directive (client-side rendered)
- Components are default-exported
- Manufacturer color mapping is consistent across all components:
  - disguise: `#ff3366` (pink/red)
  - barco: `#00b4d8` (cyan)
  - brompton: `#10b981` (green)
  - lightware: `#8b5cf6` (purple)
  - aja: `#f59e0b` (amber)
  - blackmagic: `#6366f1` (indigo)
  - ross: `#ef4444` (red)
- Tailwind custom colors defined in `tailwind.config.ts` and `globals.css`:
  - `background`, `foreground`, `surface`, `surface-2`, `border`, `accent`, `success`, `warning`, `error`, `muted`

### Supported Device Manufacturers
disguise, Barco, Brompton, Lightware, AJA, Blackmagic Design, Ross

## Development
```bash
npm run dev      # Development server on port 3000
npm run build    # Production build
npm run start    # Run production build
./start.sh       # Quick-start production
```

## Lint / Build Check
```bash
npm run lint     # ESLint check
npm run build    # TypeScript + ESLint + production build
```

## Important Notes
- Do NOT leave unused variables — the build will fail (ESLint `no-unused-vars`)
- Always run `npm run build` before pushing to catch lint errors
- Mock data is in `src/store/index.ts` — replace with real API calls when ready
