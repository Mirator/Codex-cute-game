# Mischief Cat MVP Overview

## Summary Description
Mischief Cat is a browser-based vertical slice that showcases a freeform mischief loop in a compact Old Town Alleyways district. Players control a nimble third-person cat who explores, interacts with props, and provokes chain reactions while managing a heat meter and combo-based scoring. The MVP targets reliable 60 FPS performance on mid-range hardware, emphasizing responsive movement, deterministic physics via Rapier, and a tightly scoped set of interactions, AI behaviors, and level content. Supporting systems include data-driven configuration, ECS-based architecture, and build/test automation through Vite and Vitest. The goal is to deliver a polished, replayable slice that communicates the core loop of explore → cause mischief → escape.

## Detailed Checklist

### Core Scope & Content
- [ ] Build Old Town Alleyways district (~80×80 m) featuring three interactive hotspots and one scripted set-piece chain reaction.
- [ ] Implement third-person cat controller with walk, run, sprint, jump (with coyote time and buffer), mantle, crouch, pounce, and camera follow with collision handling.
- [ ] Integrate Rapier physics with rigidbodies, colliders, sleep/wake policy, and deterministic 60 Hz fixed steps.
- [ ] Deliver ten interactive prop archetypes spanning small/medium, breakable, container, food, and mechanism categories.
- [ ] Support push/bump interactions, scratch action on tagged surfaces, and item pick-up/carry/drop/throw mechanics for lightweight props.
- [ ] Create one human NPC (Investigate → Warn → Chase), one dog chaser, and a flock of pigeons with scatter/regroup behavior.
- [ ] Author scoring system with combo window, chain bonuses, and data-driven configuration files.
- [ ] Implement heat meter with thresholds, decay logic, line-of-sight modifiers, and hide spots.
- [ ] Provide HUD elements for score, combo, heat, prompts, and an end-of-run summary card.
- [ ] Hook up audio and VFX for footsteps, meows, impacts, dust puffs, and interactable highlights.
- [ ] Enable LocalStorage persistence for settings and best score.
- [ ] Configure Vite build with lazy-loaded assets, KTX2 textures, and Draco-compressed meshes.

### Architecture & Data
- [ ] Establish Vite + TypeScript project with Three.js and Rapier integrations and strict TS settings.
- [ ] Organize source under prescribed directory structure (`core`, `ecs`, `systems`, `input`, `scene`, `ui`, `utils`).
- [ ] Implement ECS framework with typed components, system ticks, and event bus (`InteractionEvent`, `BreakEvent`, `SpillEvent`, `HeatChanged`, `ComboTick`, etc.).
- [ ] Externalize gameplay constants to `/data/categories.json`, `/data/scoring.json`, and `/data/heat.json`; expand as needed without hardcoding magic numbers.
- [ ] Maintain one-responsibility modules ≤200 LOC; ensure deterministic update order and render interpolation.

### AI & Gameplay Systems
- [ ] Human NPC patrols/guards hotspots, escalates based on heat thresholds, and transitions between investigate, warn, and chase states with LoS checks.
- [ ] Dog AI reacts to LoS, respects leash radius when applicable, and responds to loud break events with cooldown logic.
- [ ] Pigeon flock scatters on proximity or loud events and regroups at food spills with population cap ≤40.
- [ ] Integrate event-driven interactions for breaking, spilling, flock scattering, and impacts, updating score and heat systems accordingly.
- [ ] Ensure hide volumes accelerate heat decay by 2× and that combo multipliers reset when timers expire.

### Level Design & Set-Piece
- [ ] Block out alleyway geometry, hide spots, and cat-only shortcuts within target footprint.
- [ ] Place interactive props to encourage emergent chain reactions and align with the authored set-piece cascade.
- [ ] Script the marquee chain reaction (e.g., laundry line → pots → human tray → break cascade) with timed triggers and event emissions.

### UI/UX & Onboarding
- [ ] Implement HUD for core meters plus contextual prompts for interactions.
- [ ] Add tutorial prompts covering movement/jump, push/break, and hide/heat concepts.
- [ ] Provide controls reference in-game and document in README.

### Audio/VFX/Performance
- [ ] Author surface-based footstep audio, cat vocalizations, and prop impact sounds with debounced playback.
- [ ] Create dust, scratch decals, sparkles, and shard effects with pooling to avoid spikes.
- [ ] Apply instancing, object pooling, and rigidbody limits (≤150 awake) to maintain ≤1,000 draw calls and stable 60 FPS.

### Tooling, Testing & Delivery
- [ ] Supply automated linting and build scripts; integrate Vitest for unit tests.
- [ ] Write unit tests covering scoring combo math, heat thresholds, and break→spill→flock integration.
- [ ] Complete README with setup, build/run instructions, controls, and troubleshooting.
- [ ] Produce distributable build in `/dist` alongside source repository.
- [ ] Verify browser performance and stability via soak tests and telemetry checks.
- [ ] Prepare short demo GIF for major features and document in release notes.

### Milestones & Validation
- [ ] Follow six-week milestone plan (bootstrap through polish) or equivalent schedule tracking.
- [ ] Confirm success criteria: articulated loop comprehension, emergent chain reactions, performance budgets, and system stability.
- [ ] Conduct final playtest ensuring new players finish tutorial and trigger at least one chain within 10 minutes.
- [ ] Sign off on Definition of Done: passing acceptance tests, soak stability, reproducible builds, and documentation completeness.
