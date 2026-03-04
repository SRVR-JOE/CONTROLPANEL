# Agent Task Manifest — AV Device Development

This document defines the development domains, ownership boundaries, and task backlog for multi-agent collaboration on the AV Rack Control Panel.

## Agent Roles

### Adapter Agent
**Scope:** `src/lib/device-adapters/`, `src/types/index.ts` (DeviceManufacturer type)

Tasks:
- [ ] Add Yamaha audio DSP adapter (TCP/SCP protocol)
- [ ] Add Roland video switcher adapter (REST API)
- [ ] Add Barco media server adapter (REST/JSON-RPC)
- [ ] Add Dante Director adapter (mDNS + REST)
- [ ] Add Allen & Heath audio mixer adapter (TCP)
- [ ] Add Analog Way presentation switcher adapter (TCP)
- [ ] Add TVOne video processor adapter (SIS protocol)
- [ ] Add Kramer matrix switcher adapter (Protocol 3000)
- [ ] Add Marshall camera adapter (VISCA/HTTP)
- [ ] Add BirdDog NDI encoder adapter (REST API)
- [ ] Add Magewell encoder/decoder adapter (REST API)
- [ ] Add Datapath video wall adapter (REST API)
- [ ] Implement real WebSocket health streaming for Disguise adapter
- [ ] Add firmware version detection to all adapters
- [ ] Standardize error classification across adapters

### Catalog Agent
**Scope:** `src/lib/catalog/`, `src/types/index.ts` (DeviceCategory, FormFactor types)

Tasks:
- [ ] Add Yamaha product catalog (CL/QL/TF/Rio series)
- [ ] Add Roland product catalog (V-series switchers)
- [ ] Add Analog Way product catalog (Aquilon/Picturall/LiveCore)
- [ ] Add Allen & Heath product catalog (dLive/Avantis/SQ series)
- [ ] Add BirdDog product catalog (NDI encoders/decoders)
- [ ] Add Magewell product catalog (Pro Convert series)
- [ ] Expand Blackmagic catalog with ATEM constellation series
- [ ] Expand AJA catalog with FS and Ki Pro series
- [ ] Add port diagram data to catalog entries for visual representation
- [ ] Add firmware compatibility matrix per product

### UI Agent
**Scope:** `src/components/`, `src/app/` (pages)

Tasks:
- [ ] Add device firmware management page
- [ ] Create network topology visualization
- [ ] Add bulk device operations UI (batch power, batch preset recall)
- [ ] Implement signal flow diagram view
- [ ] Add dark mode / theme switcher
- [ ] Create touch-friendly tablet mode for on-site use
- [ ] Add keyboard shortcuts for matrix routing
- [ ] Implement device group management
- [ ] Add audit log viewer for command history
- [ ] Improve responsive layout for mobile monitoring

### API Agent
**Scope:** `src/app/api/`

Tasks:
- [ ] Add WebSocket endpoint for real-time health streaming
- [ ] Implement device firmware upload API
- [ ] Add bulk command dispatch endpoint
- [ ] Create backup/restore API for database export
- [ ] Add RBAC (role-based access control) middleware
- [ ] Implement rate limiting per device for command dispatch
- [ ] Add API versioning (v1 prefix)
- [ ] Create OpenAPI/Swagger documentation endpoint
- [ ] Add device group CRUD endpoints
- [ ] Implement scheduled command execution API

### Events Agent
**Scope:** `src/lib/events/`, `src/app/api/events/`, `src/components/notifications/`

Tasks:
- [ ] Add PagerDuty notification channel
- [ ] Add Microsoft Teams notification channel
- [ ] Implement event correlation (group related events)
- [ ] Add escalation policies (notify different channels based on duration)
- [ ] Create maintenance window support (suppress alerts during planned work)
- [ ] Add event analytics dashboard with trend charts
- [ ] Implement webhook notification channel
- [ ] Add custom event rule engine (user-defined triggers)

### Test Agent
**Scope:** `__tests__/` directories throughout the project

Tasks:
- [ ] Add integration tests for API routes
- [ ] Add component rendering tests for all page components
- [ ] Add end-to-end command dispatch tests
- [ ] Increase adapter test coverage to 90%+
- [ ] Add store action tests for event and notification slices
- [ ] Add matrix routing preset recall tests
- [ ] Create performance benchmarks for health polling
- [ ] Add Docker container smoke tests

### Matrix Agent
**Scope:** `src/components/matrix/`, `src/lib/commands/`, matrix-related API routes

Tasks:
- [ ] Add salvo (multi-crosspoint) routing support
- [ ] Implement lock/protect for critical routes
- [ ] Add routing history with undo support
- [ ] Create virtual router abstraction for multi-router ganging
- [ ] Add input/output grouping (e.g., "Camera Package", "LED Wall")
- [ ] Implement automatic failover routing rules
- [ ] Add signal presence detection display on routing grid

## Coordination Points

These files are shared across agents and require careful coordination:

| File | Coordination Rule |
|---|---|
| `src/types/index.ts` | Append-only to union types. Never reorder. |
| `src/store/index.ts` | Add new slices at the bottom. Don't modify existing slices. |
| `src/lib/device-adapters/index.ts` | Add new adapter imports and registry entries. |
| `src/lib/catalog/data.ts` | Import and spread new manufacturer catalogs. |
| `src/lib/catalog/index.ts` | Re-export new catalog modules. |
| `package.json` | Coordinate dependency additions. |

## Priority Order

1. **High** — New device adapters (expands hardware support)
2. **High** — Test coverage (quality gate stability)
3. **Medium** — API enhancements (WebSocket, bulk operations)
4. **Medium** — UI improvements (firmware, topology, groups)
5. **Medium** — Event system extensions (new channels, correlation)
6. **Lower** — Matrix advanced features (salvo, ganging)
7. **Lower** — Catalog expansion (more products per manufacturer)
