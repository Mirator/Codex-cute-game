# Mischief Cat MVP Overview

## Summary Description
Mischief Cat is a browser-based vertical slice that showcases a freeform mischief loop in a compact Old Town Alleyways district. Players control a nimble third-person cat who explores, interacts with props, and provokes chain reactions while managing a heat meter and combo-based scoring. The MVP targets reliable 60 FPS performance on mid-range hardware, emphasizing responsive movement, deterministic physics via Rapier, and a tightly scoped set of interactions, AI behaviors, and level content. Supporting systems include data-driven configuration, ECS-based architecture, and build/test automation through Vite and Vitest. The goal is to deliver a polished, replayable slice that communicates the core loop of explore → cause mischief → escape.

## Detailed Checklist

### Core Scope & Content
- [x] Build Old Town Alleyways district (~80×80 m) featuring three interactive hotspots and one scripted set-piece chain reaction.
  - **Audit:** The alleyway plane, prop placement, and chain progress events are live, but the cascade lacks visible animation or feedback beyond score pop-ups. Plan follow-up VFX/audio beats to sell the chain.
- [ ] Implement third-person cat controller with walk, run, sprint, jump (with coyote time and buffer), mantle, crouch, pounce, and camera follow with collision handling.
  - **Status:** Walk/run/sprint/jump with coyote and buffered inputs are implemented; mantle, crouch, pounce targeting, and camera collision sweeps remain outstanding.
- [ ] Integrate Rapier physics with rigidbodies, colliders, sleep/wake policy, and deterministic 60 Hz fixed steps.
  - **Status:** Currently using a lightweight custom integrator with simple ground sampling. Replace with Rapier rigidbodies/colliders and ensure deterministic stepping.
- [ ] Deliver ten interactive prop archetypes spanning small/medium, breakable, container, food, and mechanism categories.
  - **Status:** Three archetypes (crate stack, paint cans, snack cart) are live. Add seven more covering breakables, spillables, mechanisms, and vertical interactions.
- [ ] Support push/bump interactions, scratch action on tagged surfaces, and item pick-up/carry/drop/throw mechanics for lightweight props.
  - **Status:** Interactions currently trigger scripted break events only. Implement physics push volumes, scratch tagging, and a carry component with throw arcs.
- [ ] Create one human NPC (Investigate → Warn → Chase), one dog chaser, and a flock of pigeons with scatter/regroup behavior.
  - **Status:** NPC entities exist and respond to heat/noise timers, but lack navmesh locomotion, warn/chase animations, and pigeon scattering bursts. Flesh out behaviours and movement.
- [x] Author scoring system with combo window, chain bonuses, and data-driven configuration files.
  - **Audit:** Combo multipliers, timers, and chain hooks are functional; add floating score feedback and ensure balancing covers all forthcoming prop archetypes.
- [ ] Implement heat meter with thresholds, decay logic, line-of-sight modifiers, and hide spots.
  - **Status:** Heat thresholds, decay, and hide volumes function; pending features include LoS modifiers and NPC-specific heat contributions.
- [x] Provide HUD elements for score, combo, heat, prompts, and an end-of-run summary card.
  - **Audit:** HUD surfaces metrics and best score persistence. Improve readability on small screens and surface active objectives dynamically.
- [ ] Hook up audio and VFX for footsteps, meows, impacts, dust puffs, and interactable highlights.
  - **Status:** No audio/VFX hooks yet—add event-driven emitters tied to interaction and locomotion systems.
- [ ] Enable LocalStorage persistence for settings and best score.
  - **Status:** Best score persists; add settings (volume, sensitivity, layout) serialization.
- [ ] Configure Vite build with lazy-loaded assets, KTX2 textures, and Draco-compressed meshes.
  - **Status:** Baseline Vite build only. Integrate asset compression plugins and code-split heavy scene data.

### Architecture & Data
- [ ] Establish Vite + TypeScript project with Three.js and Rapier integrations and strict TS settings.
  - **Status:** Vite + TS + Three.js scaffolding is complete with strict config, but Rapier is not yet integrated. Plan physics module refactor once Rapier lands.
- [x] Organize source under prescribed directory structure (`core`, `ecs`, `systems`, `input`, `scene`, `ui`, `utils`).
  - **Audit:** Folder layout matches the plan; ensure future modules respect boundaries (e.g., keep rendering helpers inside `scene/`).
- [x] Implement ECS framework with typed components, system ticks, and event bus (`InteractionEvent`, `BreakEvent`, `SpillEvent`, `HeatChanged`, `ComboTick`, etc.).
  - **Audit:** ECS and event bus are in place; monitor component growth to avoid monolithic definitions.
- [x] Externalize gameplay constants to `/data/categories.json`, `/data/scoring.json`, and `/data/heat.json`; expand as needed without hardcoding magic numbers.
  - **Audit:** Data-driven configs are loaded centrally; add validation to guard against malformed JSON during loading.
- [ ] Maintain one-responsibility modules ≤200 LOC; ensure deterministic update order and render interpolation.
  - **Status:** Several files (e.g., `scene/actors.ts`) exceed 200 LOC. Break down meshes/rigging helpers and formalize update ordering docs.

### AI & Gameplay Systems
- [ ] Human NPC patrols/guards hotspots, escalates based on heat thresholds, and transitions between investigate, warn, and chase states with LoS checks.
  - **Status:** Heat thresholds toggle patrol/investigate/warn logic, but LoS sensing and chase pursuit forces are missing. Add navmesh steering and alert VO cues.
- [ ] Dog AI reacts to LoS, respects leash radius when applicable, and responds to loud break events with cooldown logic.
  - **Status:** Dog tracks leash radius and cooldown but lacks LoS gating and pursuit steering. Implement direct pursuit behaviour and cooldown UI feedback.
- [ ] Pigeon flock scatters on proximity or loud events and regroups at food spills with population cap ≤40.
  - **Status:** Regroup timing exists, yet scatter events are never triggered and there is no visual burst. Hook scatter to break proximity and spawn particle swarm.
- [x] Integrate event-driven interactions for breaking, spilling, flock scattering, and impacts, updating score and heat systems accordingly.
  - **Audit:** Break/spill events update scoring and heat; extend events to drive audio cues and NPC reactions once additional systems arrive.
- [x] Ensure hide volumes accelerate heat decay by 2× and that combo multipliers reset when timers expire.
  - **Audit:** Hide multiplier and combo timer reset behave correctly; cover edge cases where multiple hide volumes overlap.

### Level Design & Set-Piece
- [ ] Block out alleyway geometry, hide spots, and cat-only shortcuts within target footprint.
  - **Status:** Base plane, lighting, and a single hide spot exist. Expand verticality, shortcut ledges, and collision volumes to channel cat routes.
- [x] Place interactive props to encourage emergent chain reactions and align with the authored set-piece cascade.
  - **Audit:** Three hotspots steer players toward the cascade trigger; needs additional prop density and signage for readability.
- [ ] Script the marquee chain reaction (e.g., laundry line → pots → human tray → break cascade) with timed triggers and event emissions.
  - **Status:** Chain progression counters exist but lack animated reactions or sequential prop states. Implement staged animations and timed physics nudges.

### UI/UX & Onboarding
- [x] Implement HUD for core meters plus contextual prompts for interactions.
  - **Audit:** HUD and prompts are live; add accessibility options (colorblind-safe palette, font scaling) and responsive layout tweaks.
- [ ] Add tutorial prompts covering movement/jump, push/break, and hide/heat concepts.
  - **Status:** Static objective text exists, but no contextual tutorials. Design trigger volumes and pacing for onboarding beats.
- [x] Provide controls reference in-game and document in README.
  - **Audit:** Controls listed in HUD and README; revisit once controller support is added.

### Audio/VFX/Performance
- [ ] Author surface-based footstep audio, cat vocalizations, and prop impact sounds with debounced playback.
  - **Status:** Audio bus absent. Plan middleware hookup (e.g., Howler) and map interaction events to clips with cooldowns.
- [ ] Create dust, scratch decals, sparkles, and shard effects with pooling to avoid spikes.
  - **Status:** No VFX or pooling. Add particle system module with reusable emitters tied to events.
- [ ] Apply instancing, object pooling, and rigidbody limits (≤150 awake) to maintain ≤1,000 draw calls and stable 60 FPS.
  - **Status:** Scene currently low complexity but lacks instrumentation. Add performance telemetry and enforce awake body budget once Rapier integration lands.

### Tooling, Testing & Delivery
- [ ] Supply automated linting and build scripts; integrate Vitest for unit tests.
  - **Status:** Build/test scripts exist; add ESLint/Prettier workflows and CI hooks.
- [x] Write unit tests covering scoring combo math, heat thresholds, and break→spill→flock integration.
  - **Audit:** Vitest suites cover scoring, heat decay, and AI reactions. Expand to regression-test combo decay edge cases and chain progression.
- [x] Complete README with setup, build/run instructions, controls, and troubleshooting.
  - **Audit:** README outlines setup and controls; add troubleshooting for pointer lock and performance tuning.
- [ ] Produce distributable build in `/dist` alongside source repository.
  - **Status:** Build command available, but no committed artefacts. Generate and attach when shipping milestone build.
- [ ] Verify browser performance and stability via soak tests and telemetry checks.
  - **Status:** No telemetry or soak coverage. Define automated perf captures (RAIL metrics) across target hardware.
- [ ] Prepare short demo GIF for major features and document in release notes.
  - **Status:** Media capture pending; script highlight reel once chain reaction visuals exist.

### Milestones & Validation
- [ ] Follow six-week milestone plan (bootstrap through polish) or equivalent schedule tracking.
  - **Status:** No milestone tracker in repo. Establish project board with sprint goals and burndown snapshots.
- [ ] Confirm success criteria: articulated loop comprehension, emergent chain reactions, performance budgets, and system stability.
  - **Status:** Success criteria not yet evaluated. Schedule milestone review with telemetry/perf capture once remaining systems mature.
- [ ] Conduct final playtest ensuring new players finish tutorial and trigger at least one chain within 10 minutes.
  - **Status:** Tutorial incomplete; plan moderated playtest once onboarding is scripted.
- [ ] Sign off on Definition of Done: passing acceptance tests, soak stability, reproducible builds, and documentation completeness.
  - **Status:** Acceptance/soak passes pending; add release checklist covering builds, telemetry, and docs.

## Whole Project Audit

- **Systems Coverage:** Core loop (movement, interactions, scoring, heat) is functional, but absence of Rapier integration, advanced cat moves, and NPC locomotion limit replay depth. Prioritize physics and AI upgrades before adding new content.
- **Feedback & Polish:** Lack of audio/VFX and minimal chain reaction spectacle reduce player feedback. Introduce layered feedback (sound, particles, camera shakes) tied to existing event bus.
- **Content Depth:** Only three prop archetypes and sparse level geometry restrict combo variety. Expand prop catalog, vertical navigation, and hiding spots to sustain combos.
- **Performance & Tooling:** No linting, telemetry, or automated performance checks. Add ESLint/Prettier, CI pipelines, and runtime metrics to maintain quality as scope grows.
- **Onboarding & Validation:** Tutorial beats, milestone tracking, and playtest rituals are missing. Establish onboarding content and QA gates to validate MVP goals.
