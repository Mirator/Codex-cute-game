# Mischief Cat

Mischief Cat is a browser-based vertical slice inspired by the design brief in `docs/mischief-cat-plan.md`. Guide a nimble alley
 cat through Old Town Alleyways, string together mischief combos, and manage the escalating heat meter while NPCs react to your
 antics. The prototype runs in the browser using Three.js, a lightweight ECS architecture, and data-driven configuration.

## Play It

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL in your browser. The HUD shows score, combo, and heat; contextual prompts appear when props can be 
interacted with.

### Controls
- **WASD** (or **ZQSD** on AZERTY keyboards) — Move the cat
- **Shift** — Sprint
- **Space** — Jump / Pounce (supports coyote time)
- **E** — Interact, scratch, or carry lightweight props

### Objectives
- Trigger the laundry line cascade by starting trouble at the paint cans.
- Chain prop interactions quickly to keep your combo multiplier alive.
- Watch the heat meter; hide behind crates to cool off before the human and dog escalate to a chase.

Best scores and combo tiers persist in LocalStorage so you can chase a perfect run.

## Tooling

- **Vite + TypeScript** for hot module reloading and production builds.
- **Vitest** powers automated tests for scoring math, heat decay, and AI reactions (`npm test`).
- **Three.js** renders the alleyway diorama, props, and characters.

Build a distributable version with:

```bash
npm run build
```

## Project Structure

- `data/` – Data-driven configuration for prop categories, scoring, and heat thresholds.
- `src/core/` – Application bootstrap, event bus, and configuration glue.
- `src/ecs/` – Lightweight ECS world and component definitions.
- `src/input/` – Keyboard input mapper with QWERTY/AZERTY detection.
- `src/scene/` – Environment and actor factories.
- `src/systems/` – Gameplay systems (player control, physics, interactions, scoring, heat, AI, chain reactions).
- `src/ui/` – HUD renderer with LocalStorage persistence.
- `tests/` – Vitest suites covering core gameplay systems.

## Credits

The tone, scope, and milestone goals follow the Mischief Cat plan authored for this repository. Audio and VFX hooks are scaffold
ed for future productionisation.
