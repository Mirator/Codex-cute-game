# Aurora Glade Adventure

Aurora Glade Adventure is a cozy third-person exploration prototype inspired by the design documents in this repository. Guide Mira and her luminous companion Lumi as they cleanse corrupted shrines, restore the Prism Tree, and soak in the aurora-soaked forest—right in the browser thanks to Three.js and Vite.

## Play It

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL in your browser and click the scene to capture the cursor.

### Controls
- **WASD** (or **ZQSD** on AZERTY keyboards) — Move Mira
- **Space** — Jump / Glide while airborne
- **Shift** — Dodge burst
- **E** — Harmonize corrupted shrines
- **Q** (or **A** on AZERTY keyboards) — Empathy pulse
- **R** — Cheer with Lumi
- **P** — Toggle photo mode
- **Mouse** — Look around (click the scene to lock the cursor)

## Deploying to GitHub Pages

This project ships with a GitHub Actions workflow that builds the game with Vite and publishes the contents of the `dist/` folder to the `gh-pages` branch using the official Pages deployment pipeline.

1. Ensure GitHub Pages is configured to use the **GitHub Actions** source.
2. Push changes to `main` (or trigger the workflow manually) and wait for the "Deploy Aurora Glade Adventure" workflow to complete.
3. The published site will be available at `https://<your-username>.github.io/Codex-cute-game/`.

You can also build the static site locally:

```bash
npm run build
```

The production-ready files will be written to `dist/`.

## Project Structure

- `index.html` – Root HTML shell containing HUD and instructions.
- `src/main.js` – Three.js gameplay scene, controllers, and UI bindings.
- `src/style.css` – UI styling for overlays and panels.
- `docs/` – Original planning documents (`development_checklist.md`, `game_design_document.md`).
- `.github/workflows/deploy.yml` – Continuous deployment to GitHub Pages.

## Credits & References

Gameplay tone, mechanics, and art direction are aligned with the accompanying design docs. Three.js powers rendering and animation, while Vite provides a modern development and build pipeline.
