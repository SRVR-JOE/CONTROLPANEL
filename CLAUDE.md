# CLAUDE.md — Agent Intelligence File

## Project Overview
AV Rack Control Panel — a Next.js 14 application for managing professional AV equipment racks in live events, broadcast, and permanent installation environments. Controls devices from 25+ manufacturers across video, audio, networking, power, and KVM categories.

## Tech Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **UI:** React 18, Tailwind CSS, Lucide icons, dnd-kit (drag-and-drop)
- **State:** Zustand
- **Database:** better-sqlite3 (embedded)
- **Testing:** Vitest + Testing Library + jsdom
- **Deployment:** Docker (multi-stage), standalone Next.js output
- **CI:** GitHub Actions (lint → typecheck → build → docker)

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (next lint)
npx tsc --noEmit     # Type check
npm run test:run     # Run all tests
npm test             # Watch mode tests
```

## Architecture Decisions

### Device Adapters
Each manufacturer has a dedicated adapter in `src/lib/device-adapters/`. Adapters implement a common interface (`types.ts`) and handle protocol translation. The adapter index (`index.ts`) provides a factory for instantiation by manufacturer name.

### State Management
Single Zustand store in `src/store/index.ts` manages all application state: devices, racks, routers, presets, sessions, events, and notifications. State is persisted via the `/api/store` endpoint to SQLite.

### API Routes
Next.js API routes in `src/app/api/` provide REST endpoints. Each feature (devices, commands, health, events, deploy, discover) has its own route directory.

### Types
All shared TypeScript types live in `src/types/index.ts`. This is a coordination point — agents adding new features should append to existing union types rather than reordering them.

## File Patterns

| Pattern | Purpose |
|---|---|
| `src/lib/device-adapters/<manufacturer>.ts` | Protocol adapter for a specific brand |
| `src/lib/device-adapters/__tests__/<domain>.test.ts` | Adapter test suites grouped by domain |
| `src/lib/catalog/manufacturers/<group>.ts` | Product catalog entries |
| `src/app/api/<feature>/route.ts` | API endpoint handler |
| `src/app/<page>/page.tsx` | Page component |
| `src/components/<domain>/<Component>.tsx` | UI component |
| `src/lib/events/channels/<channel>.ts` | Notification channel implementation |

## Testing Conventions
- Test files go in `__tests__/` subdirectories adjacent to source
- Domain-grouped test files (e.g., `audio-network.test.ts` tests Dante, Shure, QSC, Luminex, Sonifex adapters)
- Use `describe` blocks per adapter/feature, `it` blocks per behavior
- Mock network calls — adapters should be testable without real hardware

## Common Pitfalls
- `better-sqlite3` requires native compilation — `npm ci` handles this on Linux x64
- The store hydration component (`StoreHydrator.tsx`) must load before interactive components
- Matrix routing commands are manufacturer-specific — check the command registry before dispatching
- Device health polling intervals are per-adapter — don't assume uniform timing

## Multi-Agent Coordination
- **Shared files** requiring coordination: `src/types/index.ts`, `src/store/index.ts`, `src/lib/device-adapters/index.ts`
- **Safe parallel zones**: Each adapter file, each component directory, each API route directory
- **Conflict-prone**: Store slices, type union extensions, adapter index exports
- **Strategy**: Append-only changes to union types; additive store slices; isolated adapter files
