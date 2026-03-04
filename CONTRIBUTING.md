# Contributing to AV Rack Control Panel

Welcome to the CONTROLPANEL project — a professional AV rack management system for live events, broadcast, and installation environments. This guide covers how multiple agents and contributors can collaborate effectively on AV device development.

## Project Architecture

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # REST endpoints (devices, commands, events, health)
│   └── [feature]/          # Page routes (matrix, racks, brompton, disguise-config, etc.)
├── components/             # React UI components organized by domain
│   ├── brompton/           # LED processor controls
│   ├── devices/            # Device management UI
│   ├── disguise/           # Media server configuration
│   ├── health/             # Health monitoring dashboards
│   ├── matrix/             # Matrix routing grid
│   ├── rack/               # Rack visualization & drag-and-drop
│   ├── recording/          # Transport & clip management
│   └── layout/             # Shell, sidebar, status bar
├── lib/                    # Core business logic
│   ├── device-adapters/    # Protocol adapters per manufacturer
│   ├── catalog/            # Device catalog & manufacturer data
│   ├── commands/           # Structured command registry
│   ├── events/             # Event detection, dispatch, notification channels
│   └── timecode/           # LTC timecode generation
├── store/                  # Zustand state management
├── hooks/                  # React hooks
└── types/                  # TypeScript type definitions
```

## Development Domains for Agent Teams

The codebase is divided into parallel workstreams that agents can own independently:

### 1. Device Adapters (`src/lib/device-adapters/`)
Each manufacturer gets its own adapter file implementing the common interface from `types.ts`. Adapters handle protocol-specific communication (REST, TCP, VISCA, SIS, CIP, PJLink, SNMP, etc.).

**Current adapters:** AJA, Adder, APC, Avitech, Blackmagic, Brompton, Christie, Crestron, CyberPower, Dante, Disguise, Eaton, Epson, Extron, Generic, Gude, Lightware, Luminex, Netgear, Novastar, Panasonic, QSC, Raritan, Shure, Sonifex, Sony, Toshiba UPS

**To add a new adapter:**
1. Create `src/lib/device-adapters/<manufacturer>.ts`
2. Implement the adapter interface from `src/lib/device-adapters/types.ts`
3. Register it in `src/lib/device-adapters/index.ts`
4. Add manufacturer to `DeviceManufacturer` type in `src/types/index.ts`
5. Add catalog entries in `src/lib/catalog/manufacturers/`
6. Write tests in `src/lib/device-adapters/__tests__/`

### 2. UI Components (`src/components/`)
React components using Tailwind CSS. Each feature domain has its own directory.

### 3. API Routes (`src/app/api/`)
Next.js API route handlers for device communication, health polling, event management, and commands.

### 4. Device Catalog (`src/lib/catalog/`)
Product definitions with specs, port layouts, connection info, and form factors for auto-populating device configurations.

### 5. Event System (`src/lib/events/`)
Event detection, dispatching, and notification channels (email, SMS, Slack, Discord, in-app).

### 6. Matrix Routing (`src/components/matrix/`, `src/lib/commands/`)
Cross-point routing grid, presets, and command dispatch for matrix switchers.

## Branching Strategy

```
main                          ← stable releases
├── claude/<feature>-<id>     ← agent development branches
├── feat/<feature-name>       ← human feature branches
├── fix/<issue-number>        ← bug fixes
└── test/<domain>             ← test infrastructure
```

### Rules
- Never push directly to `main`
- All work goes through pull requests
- Agent branches use the `claude/` prefix
- Each agent should work on a focused domain to avoid merge conflicts
- Rebase onto main before opening a PR

## Adding a New AV Device Manufacturer

### Step-by-step

1. **Propose** — Open an issue using the "New Device Adapter" template
2. **Research** — Document the device's control protocol, default ports, API endpoints
3. **Types** — Add the manufacturer to `DeviceManufacturer` union in `src/types/index.ts`
4. **Adapter** — Create `src/lib/device-adapters/<name>.ts` implementing the adapter interface
5. **Catalog** — Add product entries in `src/lib/catalog/manufacturers/<name>.ts`
6. **Commands** — If the device has controllable features, add command definitions to `src/lib/commands/registry.ts`
7. **Tests** — Write adapter tests covering connection, status polling, and command dispatch
8. **PR** — Submit a pull request referencing the proposal issue

### Device Categories
Supported categories: media-server, led-processor, matrix-switcher, video-processor, converter, production-switcher, ptz-camera, camera-controller, projector, wireless-microphone, audio-dsp, audio-interface, amplifier, network-switch, control-processor, streaming-processor, recorder, fiber-extender, encoder-decoder, graphics-processor, ups, pdu, kvm-switch, kvm-extender, multiviewer, opengear-frame, audio-monitor

### Protocol Support
Supported protocols: REST, JSON-RPC, TCP, CGI, VISCA, SIS, CIP, PJLink, mDNS, HTTPS, SNMP, Dashboard

## Multi-Agent Workflow

### Parallel Development
Multiple agents can work simultaneously on different domains:

| Agent Role | Domain | Key Files |
|---|---|---|
| Adapter Agent | Device protocol adapters | `src/lib/device-adapters/` |
| UI Agent | React components & pages | `src/components/`, `src/app/` |
| API Agent | REST endpoints & middleware | `src/app/api/` |
| Test Agent | Test coverage & QA | `__tests__/` directories |
| Catalog Agent | Device product catalog | `src/lib/catalog/` |
| Events Agent | Monitoring & notifications | `src/lib/events/` |

### Conflict Avoidance
- Each agent owns a specific directory subtree
- Shared files (`src/types/index.ts`, `src/store/index.ts`) require coordination
- Use additive changes to union types (append, don't reorder)
- API routes are isolated per feature path

### Quality Gates
All PRs must pass:
- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript type checking
- `npm run build` — Next.js production build
- `npm run test:run` — Vitest test suite

## Code Style

- **TypeScript** — Strict mode, no `any` types
- **React** — Functional components with hooks
- **Styling** — Tailwind CSS utility classes
- **State** — Zustand for global state
- **Testing** — Vitest + Testing Library
- **Naming** — kebab-case files, PascalCase components, camelCase functions

## Running the Project

```bash
npm install          # Install dependencies
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run test:run     # Run test suite
npm run lint         # Lint check
```

## Docker

```bash
docker compose up    # Run with Docker Compose
```

## Community Guidelines

- Be specific in issues and PRs — include device model, protocol docs, firmware version
- Test with real hardware when possible, document mock behavior otherwise
- Keep adapters self-contained — each manufacturer file should work independently
- Follow the existing patterns — look at `src/lib/device-adapters/blackmagic.ts` or `extron.ts` as reference implementations
