# Mischief Cat — Game Design Document

## Table of Contents
1. [Vision Statement](#vision-statement)
2. [Target Audience](#target-audience)
3. [Platform & Technology](#platform--technology)
4. [Core Pillars](#core-pillars)
5. [Narrative Overview](#narrative-overview)
6. [Characters](#characters)
7. [World & Biomes](#world--biomes)
8. [Gameplay Systems](#gameplay-systems)
   1. [Player Controls](#player-controls)
   2. [Exploration Loop](#exploration-loop)
   3. [Companion Mechanics](#companion-mechanics)
   4. [Combat System](#combat-system)
   5. [Puzzle Design](#puzzle-design)
   6. [Progression & Rewards](#progression--rewards)
   7. [Accessibility Options](#accessibility-options)
9. [User Interface & Experience](#user-interface--experience)
10. [Art Direction](#art-direction)
11. [Audio Direction](#audio-direction)
12. [Level Design Roadmap](#level-design-roadmap)
13. [Technical Architecture](#technical-architecture)
14. [Production Plan](#production-plan)
15. [Risks & Mitigations](#risks--mitigations)

---

## Vision Statement
*A cozy third-person exploration-action adventure set in a luminous forest where kindness is as powerful as combat.* Players guide Mira, a young glider, and Lumi, her bioluminescent companion, through the Aurora Glade to heal corrupted spirits, unravel ancient mysteries, and rediscover joy. The experience blends gentle exploration, expressive combat, and creature befriending in a stylized Three.js world playable directly in the browser.

## Target Audience
- Players aged 10+ seeking comforting yet engaging adventures.
- Fans of titles like *The Legend of Zelda: Skyward Sword*, *Journey*, *A Short Hike*, and *Slime Rancher*.
- Browser game enthusiasts looking for premium-quality visuals and controller support.
- Streamers and content creators interested in wholesome experiences with photo-worthy moments.

## Platform & Technology
- **Primary platform:** Desktop browsers supporting WebGL 2 / WebGPU fallback (Chrome, Edge, Firefox, Safari).
- **Secondary platform:** Mobile browsers/tablets with simplified controls and performance scaling.
- **Engine/Framework:** Three.js with TypeScript, leveraging Web Audio API, HTML overlay UI via React.
- **Tooling:** Vite build pipeline, GLSL shader modules, optional WASM helpers for pathfinding.
- **External services:** PlayFab or Firebase for cloud saves (TBD), localization management tool.

## Core Pillars
1. **Gentle Heroism:** Combat is graceful and non-lethal; success purifies corruption rather than destroying life.
2. **Companionship:** Lumi is ever-present, offering support, guidance, and puzzle-solving abilities.
3. **Wonder & Discovery:** Layered secrets, bioluminescent vistas, and interactive creatures reward curiosity.
4. **Expressive Play:** Emotes, photo mode, and collectibles encourage players to personalize and share experiences.

## Narrative Overview
The Aurora Glade once thrived under the harmony of the Prism Tree, a crystal giant radiating color and music. After a mysterious eclipse, chroma spirits fractured, leaving areas plunged into monochrome gloom. Mira, a glider-in-training, is chosen to restore the Prism Tree. Guided by Lumi and elder Sage Aster, she journeys through the Blooming Basin, Crystal Canopy, and Luminous Caverns, confronting corrupted guardians and mending the ancient song.

### Narrative Structure
- **Act I – Awakening:** Tutorial in Blooming Basin introduces movement, companion, and first corruption encounter.
- **Act II – Resonance:** Crystal Canopy expands traversal with vertical gliding challenges, introduces rune puzzles, and reveals the antagonist—Umbra, a spirit in grief.
- **Act III – Harmonics:** Descent into Luminous Caverns uncovers the Prism Tree roots and climaxes with a musical confrontation to heal Umbra.
- **Epilogue:** Restored glade celebrates with a festival where player choices determine festival events and collectible displays.

## Characters
### Mira (Protagonist)
- **Role:** Agile glider balancing bravery and compassion.
- **Abilities:** Glide cape, chroma staff with light/dodge attacks, empathy pulse for calming creatures.
- **Personality:** Curious, empathetic, witty.

### Lumi (Companion)
- **Role:** Floating bioluminescent creature acting as guide, light source, and puzzle tool.
- **Abilities:** Color resonance beams, mood aura affecting creatures, scout mode to highlight points of interest.
- **Personality:** Playful, supportive, expresses emotions through color shifts.

### Sage Aster
- **Role:** Mentor providing narrative exposition and upgrades via ability seeds.
- **Abilities:** Telepathic communication, lore keeper of the Prism Tree.

### Umbra
- **Role:** Antagonist-turned-ally, corrupted guardian mourning a lost sibling spirit.
- **Abilities:** Shadow tendrils, barriers, musical duels.
- **Arc:** Transforms from ominous threat to cooperative guardian when healed.

### Supporting Creatures
- **Glowpuffs:** Puffball critters that scatter light dust; can be lured to reveal hidden paths.
- **Chorus Fawns:** Deer-like beings whose songs unlock resonance doors.
- **Pebble Wakes:** Stone turtles providing moving platforms when calmed.

## World & Biomes
1. **Blooming Basin:** Lush entry area with flowering meadows, gentle rivers, tutorial shrines. Emphasizes horizontal exploration.
2. **Crystal Canopy:** Vertical forest with crystalline leaves, wind tunnels, and aerial puzzles. Introduces gliding mastery.
3. **Luminous Caverns:** Subterranean chamber with reflective lakes, bioluminescent fungi, echo-based puzzles.
4. **Prism Tree Heart (finale arena):** Radiant sanctuary where color returns; dynamic light/music choreography.

Each biome features:
- Landmark hubs (Village Grove, Harmonic Observatory, Echo Hollow) acting as rest zones.
- Collectible lore murals depicting Prism Tree history.
- Environmental storytelling via color shifts and creature behavior.

## Gameplay Systems

### Player Controls
- **Movement:** WASD/controller stick to move, space/A button to jump, hold to glide with stamina-based duration.
- **Camera:** Third-person orbit camera with auto-alignment option; mouse/right stick to adjust.
- **Interactions:** "E"/X button for context-sensitive actions (talk, collect, soothe).
- **Combat Inputs:** Light attack (left click/RB), heavy attack (hold/RT), dodge roll (Shift/B), empathy pulse (Q/LB).
- **Utility:** Photo mode (P/Select), emote wheel (R/Faces button).

### Exploration Loop
1. **Scout:** Use Lumi to ping points of interest and reveal hidden chroma flowers.
2. **Traverse:** Navigate platforms, wind gusts, and vine swings to reach objectives.
3. **Interact:** Calm creatures, gather resonance shards, decipher rune stones.
4. **Reward:** Unlock lore, cosmetic items, and ability seeds that expand traversal options.

### Companion Mechanics
- **Mood Meter:** Reflects Lumi's energy; high mood grants buffs, low mood triggers supportive side quests.
- **Commands:** "Illuminate" (brighten dark zones), "Fetch" (retrieve distant items), "Harmonize" (trigger multi-tone puzzles).
- **Bond Level:** Increases through shared emotes, optional tasks, and success in befriending mini-games. Unlocks new abilities (double glide boost, shield bubble).

### Combat System
- **Encounter Style:** Small groups of corrupted spirits; focus on positioning and timing rather than raw DPS.
- **Lock-On:** Optional target lock for accessibility; camera stays responsive.
- **Light vs Heavy Attacks:** Light is fast and restorative, heavy charges chroma energy for finishing moves.
- **Empathy Pulse:** Temporarily pacifies enemies, opening windows for cleansing combos.
- **Companion Assist:** Lumi can project prismatic shields or weaken enemy armor when mood meter is high.
- **Boss Encounters:** Multi-phase fights combining combat, traversal, and rhythm prompts to resonate with guardian themes.

### Puzzle Design
- **Color Resonance:** Align rotating crystals to match melodies triggered by Lumi.
- **Creature Collaboration:** Guide Glowpuffs to reflective petals to open pathways.
- **Environmental Transformation:** Use chroma staff to re-grow plants or redirect waterfalls.
- **Rhythm Glyphs:** Tap sequences in sync with soundtrack to unlock ancient doors.

### Progression & Rewards
- **Experience Sources:** Cleansing corruption nodes, discovering landmarks, completing companion requests.
- **Ability Seeds:** Upgrade tree with branches for movement (air dash), combat (chain finisher), and support (extended empathy pulse).
- **Collectibles:** Friendship tokens for cosmetics, lore shards for narrative insight, melodies for soundtrack jukebox.
- **Economy:** No hard currency; focus on unlocking customization and narrative payoffs.

### Accessibility Options
- Customizable control bindings and toggle/hold options.
- Colorblind filters with customizable palettes.
- Subtitle sizing, background opacity, and icon-based callouts.
- Combat assist modes (auto-target, reduced damage, skip QTEs).
- Motion comfort settings (reduced camera sway, optional vignette).

## User Interface & Experience
- **HUD:** Minimal, with curved health/stamina bars around reticle, companion mood icon, mini-compass showing cardinal direction and objectives.
- **Menus:** Diegetic journal shaped like a glowing leaf; categories for map, quests, collectibles, photo gallery.
- **Dialogue:** Speech bubbles with expressive iconography; emoji-like reactions from Lumi.
- **Photo Mode:** Depth of field, color grading filters, pose presets for Mira and Lumi.
- **Onboarding:** Contextual tutorials triggered by player behavior, with optional replay from journal.

## Art Direction
- **Style:** Soft, painterly textures with vibrant lighting and glow accents.
- **Color Palette:** Pastel base hues contrasted with neon chroma bursts during combat and puzzle solving.
- **Character Design:** Rounded silhouettes, expressive eyes, flowing fabrics.
- **Lighting:** Volumetric light shafts, bioluminescent particles, dynamic day-night cycle with aurora events.
- **Technical Approach:** Toon-shaded materials with rim lighting, screen-space outline shader, GPU particle systems.

## Audio Direction
- **Music:** Orchestral-electronic hybrid, adaptive layers responding to exploration vs combat vs puzzle states.
- **Motifs:** Each biome introduces a unique instrument (harp, glass harmonica, handpan) that blends into finale theme.
- **SFX:** Soft, chime-like feedback for actions; creature sounds recorded from wind chimes, whistles, gentle percussion.
- **Voice:** Non-verbal vocalizations; characters communicate through melodic syllables.
- **Implementation:** Web Audio nodes for spatialization, dynamic mixing, and convolution reverb for caves.

## Level Design Roadmap
1. **Vertical Slice (Blooming Basin Hub):** Tutorial glade, first combat encounter, companion bonding, mini-puzzle.
2. **Chapter Expansion:** Add secondary paths, hidden collectibles, and creature dens per biome.
3. **Dynamic Events:** Seasonal variants (Aurora Bloom, Rainy Mist) altering traversal and rewards.
4. **Endgame Area:** Prism Tree Heart with multi-phase final encounter and celebration plaza.

## Technical Architecture
- **Scene Structure:** Root scene with modular loaders for biomes; use `THREE.Group` per region, streamed via async GLTF loaders.
- **Entity Framework:** Lightweight ECS with systems for movement, AI, rendering, audio, and interaction cues.
- **AI:** Behavior trees for creatures, state machines for bosses, navmesh-based pathfinding (RecastJS or custom grid).
- **Physics:** Simple capsule collider for player using Cannon-es or Rapier WASM; custom triggers for interactions.
- **Rendering:** Deferred shading via Three.js effect composer, SSAO, bloom, color grading LUTs.
- **Save System:** JSON serialization, encrypted local storage, optional cloud sync via REST API.
- **Tooling:** In-editor inspector for placing interactive objects, debug overlay for performance metrics.

## Production Plan
- **Pre-Production (8 weeks):** Finalize GDD, prototypes for movement/combat, art bible, pipeline tests.
- **Vertical Slice (12 weeks):** Build Blooming Basin hub with polished assets, first boss, and UX flows.
- **Content Production (20 weeks):** Expand to remaining biomes, iterate on puzzles, add narrative beats.
- **Alpha (6 weeks):** Feature complete, performance optimization, full narrative content.
- **Beta (6 weeks):** Bug fixing, localization integration, accessibility review, marketing push.
- **Launch & Post (ongoing):** Live operations planning, seasonal content support.

## Risks & Mitigations
- **Performance on lower-end devices:** Implement scalable quality settings, aggressive asset streaming, and shader LODs.
- **Scope creep from companion systems:** Lock feature set post-vertical slice; use modular design for future extensions.
- **Online save reliability:** Provide offline fallback and robust error handling.
- **Team bandwidth for art assets:** Establish modular kits and outsource select props if needed.
- **Web API compatibility:** Regular cross-browser testing, maintain progressive enhancement approach.

