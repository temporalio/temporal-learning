# Plan: redesign learn.temporal.io as a learning hub

A working plan for turning learn.temporal.io from a flat docs site into a structured learning hub with curated paths, browsable catalog, and per-course metadata. Branch: `redesign`.

References:

- Internal IA inspiration: `go.temporal.io/platform-hub/learning-path` (Foundation / Intermediate / Advanced w/ persona split).
- Visual inspiration: Pulsar Learning Templates (Figma, auth-gated — review directly before final visual specs are locked).
- **Pulsar Figma frames (canonical, reviewed)**: two definitive frames shown — "New to Temporal? Start here" (hub home) and "Course library" (catalog). Style highlights:
  - **Dark mode primary** (deep navy/space-black with subtle grid texture). Light mode supported at parity.
  - **Sharp corners everywhere** — confirms `border-radius: 0`.
  - **Hub home is text-forward**: hero with title + body + prominent search ("What do you want to learn today?") + brand illustration on the right; below: a 3-up grid of compact text-forward course cards (no thumbnail well — top-label, bold title, topic-tag row); bottom: a **magenta CTA bar** "EXPLORE THE WHOLE COURSE LIBRARY →".
  - **Catalog has a left sidebar of grouped multi-select filters** (Categories / SDK / Personas) and switches between grid and list views. List rows: tag pill + title + arrow.
  - **Magenta is the CTA accent color** — not in CLAUDE.md's listed palette but clearly part of the Pulsar system.
  - Decision: role/tier IA lives on `/paths` (Foundation / Intermediate / Advanced with persona split). The home (`/`) is intentionally flat — hero, curated grid, library CTA — and does not surface tiers explicitly.
- Brand rules: `CLAUDE.md` ([`border-radius: 0`, `--nd-*` tokens, UV `#444CE7`, Lilac `#7F86F1`, Space Black `#141414`, Off-White `#F8FAFC`]).

---

## 1. Goals and non-goals

**Goals**

- Surface clear, role-based learning paths instead of a flat course list.
- Add structured metadata (path, persona, topic, level, duration, SDK, prereqs) to every course and tutorial so the hub can drive cards, filters, and "what's next" rails from data, not hand-edited markdown.
- Introduce the Pulsar brand system (`--nd-*` tokens, sharp corners) without rewriting existing course content.
- Keep the existing markdown as the canonical source — no CMS migration.

**Non-goals (initial scope)**

- No auth / server-side user accounts. Progress tracking is `localStorage`-only.
- No content rewrites. We add frontmatter and surface what already exists.
- No certifications UI yet. Leave room for it.
- No replacement of Docusaurus. Stay on 2.4; upgrade only if blocked.

---

## 2. Audience & path model

Borrowing the internal hub's three-tier model, with Advanced fanning out by persona.

| Tier | Audience | Outcome |
|---|---|---|
| **Foundation** | Anyone new to Temporal | Understand durable execution, write a first Workflow + Activity, use the Web UI / CLI |
| **Intermediate** | Devs who can build a basic app | Handle errors, interact with running Workflows, secure payloads |
| **Advanced - Software Developer** | Production app authors | Versioning, worker rollouts, testing at scale |
| **Advanced - Platform Engineer** | Operators of Temporal infra | Temporal Cloud, namespaces, observability, multi-team rollout |
| **Advanced - AI Developer** | Builders of agentic / LLM systems | Durable agents, MCP tools, deep research patterns |

### Mapping existing content onto the model

| Existing course / tutorial dir | Tier | Persona |
|---|---|---|
| Temporal 101 | Foundation | - |
| Temporal 102 | Foundation | - |
| Crafting an Error Handling Strategy | Intermediate | - |
| Interacting with Workflows | Intermediate | - |
| Securing Application Data | Intermediate | - |
| Versioning Workflows | Advanced | Software Developer |
| Worker Versioning | Advanced | Software Developer |
| Introduction to Temporal Cloud | Advanced | Platform Engineer |
| `tutorials/nexus/*` | Intermediate | - |
| `tutorials/ai/*` | Advanced | AI Developer |
| `tutorials/infrastructure/*` | Advanced | Platform Engineer |
| `getting_started/*` | Pre-Foundation (entry ramp) | - |

---

## 3. Information architecture (URL map)

```
/                                Hub home (replaces docs/intro.md)
/paths                           All paths overview
/paths/foundation
/paths/intermediate
/paths/advanced-developer
/paths/advanced-platform
/paths/advanced-ai
/catalog                         All content with filters
/getting-started/*               Existing per-SDK setup pages (no change)
/courses/*                       Existing course content (frontmatter added)
/tutorials/*                     Existing tutorials (frontmatter added)
/examples/*                      Existing examples (frontmatter added)
```

The current root (`docs/intro.md` rendering `Intro.js`) becomes the new hub home. The existing course/tutorial URLs stay stable — this is a presentation change, not a content move.

---

## 4. Content model (frontmatter additions)

Add the following to each course `index.md` and each tutorial top page:

```yaml
---
# Existing fields (keep)
title: ...
description: ...

# New: hub metadata
hub:
  tier: foundation | intermediate | advanced
  personas: [developer, platform, ai]      # advanced only; omit for f/i
  topics: [workflows, activities, signals, queries, error-handling,
           versioning, security, testing, cloud, nexus, ai]
  level: essential | practical | production
  duration_minutes: 120
  sdk_languages: [go, java, dotnet, python, ruby, typescript]
  prerequisites: [temporal-101, temporal-102]   # slugs
  status: available | coming-soon
  featured: true | false

  # Card presentation
  thumbnail: /img/paths/foundation.png         # 16:9 illustration or screenshot
  lesson_count: 8                               # used in the "Essential · 8 lessons" pill
---
```

Naming notes:

- `tier` drives which `/paths/*` page the entry shows on.
- `topics` drives filters in `/catalog`.
- `prerequisites` powers the "what to take first" callout and the `paths/*` numbered ordering.
- `sdk_languages` drives the SDK chip row on the card; absence means the content is SDK-agnostic (e.g. Intro to Temporal Cloud).
- `level` is an outcome-based label (**Essential** = core concepts, **Practical** = build-it skills, **Production** = run-it-at-scale skills). It's deliberately distinct from `tier` so a Practical-level tutorial can sit in any tier. Avoids the "beginner / intermediate / advanced" collision with the tier vocabulary in §2.
- `thumbnail` is a 16:9 image rendered in the card's image well. Required for paths; optional for individual courses (falls back to a default illustration).
- `lesson_count` is the integer used in the badge pill (e.g. "Essential · 8 lessons"). For paths, this is the sum of underlying lessons; for a single course or tutorial, the number of distinct modules/units.

Existing entries that *don't* split by language (Worker Versioning, Intro to Temporal Cloud) simply omit `sdk_languages`.

---

## 5. Build-time manifest

Avoid reading markdown at render time. Add a tiny Docusaurus plugin:

- **Location:** `plugins/learning-manifest/index.js`
- **Behavior:** at build start, walk `docs/courses/**/index.md`, `docs/tutorials/**/index.md`, `docs/examples/**/index.md`. Parse frontmatter (gray-matter). Emit `static/learning-manifest.json`.
- **Shape:**

```json
{
  "items": [
    {
      "slug": "temporal-101",
      "title": "Temporal 101: Introducing the Temporal Platform",
      "url": "/courses/temporal_101",
      "kind": "course",
      "tier": "foundation",
      "personas": [],
      "topics": ["workflows", "activities"],
      "level": "essential",
      "duration_minutes": 120,
      "sdk_languages": ["go", "java", "dotnet", "python", "ruby", "typescript"],
      "prerequisites": [],
      "summary": "...first 200 chars of description...",
      "featured": true,
      "thumbnail": "/img/paths/foundation.png",
      "lesson_count": 8
    }
  ]
}
```

Hub, path, and catalog pages import this JSON at the top and render from it. No runtime markdown reads, no surprises in production.

---

## 6. Page templates

### 6.1 Hub home (`/`)

Replaces `docs/intro.md` + `Intro.js`. **Matches the Pulsar "New to Temporal? Start here" Figma frame exactly.**

Sections, top to bottom:

1. **Hero**
   - Left column: page title ("New to Temporal? Start here" or similar welcome line), short body paragraph (≈2 sentences positioning Temporal as a developer-first durable execution platform), full-width search input ("What do you want to learn today?").
   - Right column: brand illustration (screen mockup + topology lines + colored tag accents). This is a designed asset, not generic banner art — needs to be produced/exported from Pulsar.
2. **Filter / sort row** - thin strip above the grid: result count on the left ("20 courses"), Filter ▾ / Sort ▾ menus on the right. Same controls as the catalog filter bar but trimmed.
3. **Curated card grid** - 3-up desktop, 2-up tablet, 1-up mobile. Renders the **Foundation tier as the default curated set** (Temporal 101, 102, plus a few high-signal Intermediate/AI starts to mirror the Figma density of ~6-9 cards). Each card uses the new compact `CourseCard` style: top-left small label (e.g. "TEMPORAL 101" or category), bold title, optional one-line description, row of colored topic tags at the bottom. **No big thumbnail well.** Hovering / focus surfaces the "Take the course →" affordance.
4. **Magenta CTA bar** - full-width strip: "EXPLORE THE WHOLE COURSE LIBRARY →" → `/catalog`.

What's *intentionally not* on this surface (lives on `/paths` instead — see §6.2): role selector, tier explainers, persona-specific journeys, `ContinueTile`. The home is content-first; structured learning paths are one click away via the nav and the catalog filters.

### 6.2 Paths landing (`/paths`) and path detail (`/paths/{slug}`)

The role/tier IA the home page intentionally hides. Two surfaces:

**`/paths` landing**

- Hero: "Find your path" or similar.
- `RoleSelector` block - three persona cards (Software Developer / Platform Engineer / AI Developer) with a short audience line each.
- Below: `PathCard` grid for the three tiers (Foundation / Intermediate / Advanced) with thumbnail + level+count pill + "Start path" CTA. This is where the earlier path-card pattern (and the on-disk `PathCard` draft) belongs.

**`/paths/{slug}` detail**

- Path hero: title, audience, total duration, "what you'll be able to do".
- Numbered list of course cards in `prerequisites`-derived order.
- Optional progress dots (driven by `localStorage`).
- "Next path" CTA at bottom pointing to the natural follow-on tier.

### 6.3 Catalog (`/catalog`)

**Matches the Pulsar "Course library" Figma frame.**

- Same hero treatment as the home (title + body + search + scaled-down illustration).
- **Left sidebar** with grouped, multi-select filters:
  - **Categories** (Get started, AI, Workflows, Versioning, Error handling, Cloud, Nexus, …) — driven by frontmatter `topics`.
  - **SDK** (Go, Java, .NET, Python, Ruby, TypeScript, PHP) — driven by `sdk_languages`.
  - **Personas** (Developer, Platform, AI) — driven by `personas`.
- Main column: result count + view toggle (grid / list) + Sort ▾.
  - **Grid view**: 3-up compact `CourseCard`s (same component as the hub home grid).
  - **List view**: stacked rows — leading category pill + bold title + right-aligned `→` arrow. Denser; better for skimming the whole library.
- **Magenta "LOAD MORE" button** at the bottom (or infinite-scroll; magenta CTA either way).
- Algolia search input wires the hero search to the existing index (already configured in `docusaurus.config.js`).

### 6.4 Course / tutorial pages (existing routes)

- Add a metadata strip at top: level badge, duration, SDK chips, prereq pills.
- Add a "Up next in this path" footer driven by the manifest.
- Leave the body of the course markdown untouched.

---

## 7. Component plan

New components under `src/components/hub/`:

| Component | Purpose |
|---|---|
| `HubHero` | Hero used on `/` and `/catalog`: title + body + search + brand illustration slot |
| `HeroSearch` | The "What do you want to learn today?" input. Wraps Algolia query |
| `MagentaCta` | Full-width magenta CTA bar / button used at the bottom of hub home + catalog ("EXPLORE THE WHOLE COURSE LIBRARY →", "LOAD MORE") |
| `CourseCard` | **Compact, text-forward** card used on `/` and `/catalog` grids: small top-label, bold title, optional one-line description, row of colored `TopicTag`s at the bottom. No thumbnail well |
| `CourseListRow` | List-view row used on `/catalog` list mode: leading category pill + title + trailing arrow |
| `TopicTag` | Small colored tag pill (sharp corners): "WORKFLOWS", "DURABILITY", etc. Colors keyed off topic slug |
| `CategorySidebar` | Grouped multi-select filter rail (Categories / SDK / Personas) |
| `FilterSortRow` | Slim "20 courses · Filter ▾ Sort ▾" row above the grid on the hub home |
| `PathHero` | Hero used on `/paths/{slug}` detail pages |
| `RoleSelector` | Three persona cards on `/paths` landing |
| `PathCard` | Path-overview card (used on `/paths` landing): top color accent, thumbnail, title, description, level+count pill, "Start path" CTA. Already drafted on disk |
| `LevelBadge` | Color-coded label combining level + count: "Essential · 8 lessons" / "Practical · 5 lessons" / "Production · 3 lessons". Already drafted on disk |
| `SdkChips` | Horizontal row of SDK pills |
| `DurationBadge` | "~2 hours" pill |
| `ProgressDots` | Path progress indicator (localStorage-backed) |
| `ContinueTile` | "Pick up where you left off" tile (lives on `/paths` landing, not `/`) |
| `UpNextFooter` | "Next in this path: ..." injected into course pages |
| `PathBreadcrumb` | Breadcrumb on path detail pages |

All components use `--nd-*` tokens only. No hardcoded colors. `border-radius: 0` everywhere (animated dots and step circles excepted per CLAUDE.md). **Design and decide in dark mode first; verify light at parity** before each component ships.

---

## 8. Design tokens (introducing `--nd-*`)

CLAUDE.md mandates `--nd-*` variables but `src/css/custom.css` doesn't define them yet. Introduce them at the top of `:root` and wire Infima's `--ifm-color-primary` to them, so existing components inherit the brand without a sweep.

**Dark mode is the canonical design.** Tokens default to dark values; light mode overrides for parity. This inverts the usual Docusaurus pattern but matches how the Pulsar Figma was authored.

```css
:root {
  /* Brand palette */
  --nd-color-uv: #444CE7;
  --nd-color-lilac: #7F86F1;
  --nd-color-space-black: #141414;
  --nd-color-off-white: #F8FAFC;
  --nd-color-magenta: #E0157A;   /* CTA accent — exact hex TBD from Pulsar spec */

  /* Semantic - DARK (default / canonical) */
  --nd-bg: var(--nd-color-space-black);
  --nd-bg-elevated: #1A1A1F;     /* card surfaces */
  --nd-fg: var(--nd-color-off-white);
  --nd-fg-muted: #9CA3AF;
  --nd-accent: var(--nd-color-uv);
  --nd-accent-hover: var(--nd-color-lilac);
  --nd-cta: var(--nd-color-magenta);
  --nd-border: rgba(248, 250, 252, 0.08);
  --nd-grid: rgba(248, 250, 252, 0.04); /* subtle background grid texture */

  /* Shape */
  --nd-radius: 0;
  --nd-radius-circle: 50%; /* exceptions only */

  /* Spacing */
  --nd-space-1: 4px;
  --nd-space-2: 8px;
  --nd-space-3: 16px;
  --nd-space-4: 24px;
  --nd-space-5: 32px;
  --nd-space-6: 48px;

  /* Type */
  --nd-font-display: "Aeonik-Bold", system-ui, sans-serif;
  --nd-font-body: "Aeonik", system-ui, sans-serif;
}

/* Light mode parity */
html[data-theme="light"] {
  --nd-bg: var(--nd-color-off-white);
  --nd-bg-elevated: #FFFFFF;
  --nd-fg: var(--nd-color-space-black);
  --nd-fg-muted: #4B5563;
  --nd-border: rgba(20, 20, 20, 0.08);
  --nd-grid: rgba(20, 20, 20, 0.04);
}

/* Bridge to Infima */
:root { --ifm-color-primary: var(--nd-accent); }
```

Topic-tag colors and level-badge colors are *not* in the brand palette — they're a semantic sub-system. Define them inside the components that use them via `[data-topic]` / `[data-level]` attributes (see the existing `LevelBadge` draft) and treat them as theming knobs the Pulsar spec can override later.

This is the only CSS-level change that affects existing pages. Component-level styles for new hub components live alongside the components (CSS modules).

---

## 9. Implementation phases

Each phase is sized for a focused PR. The redesign branch is currently clean.

### Phase 0 - foundations (≈1-2 days)

- Add `--nd-*` tokens to `src/css/custom.css`.
- Write the `plugins/learning-manifest` Docusaurus plugin and wire it into `docusaurus.config.js`.
- Add `hub:` frontmatter to all 8 course index pages and the top-level tutorial index pages.
- Verify the manifest builds cleanly (a missing/typo'd field should error loudly).
- **Ship:** PR 1 - tokens + manifest plugin + frontmatter. No visible UI change.

### Phase 1 - path pages (≈3-4 days)

- Build the foundational components: compact `CourseCard`, `TopicTag`, `LevelBadge`, `SdkChips`, `DurationBadge`, `PathCard`, `PathHero`, `RoleSelector`, `PathBreadcrumb`. Draft versions of `PathCard` and `LevelBadge` already live at `src/components/hub/` — they fall back to Infima vars where `--nd-*` aren't defined, so they work standalone. The current `PathCard` draft has a thumbnail well; that stays for `/paths` surfaces. The hub/catalog grids use the new compact `CourseCard` instead (no thumbnail well).
- Build `/paths` landing + the five `/paths/{tier|persona}` detail pages from manifest data.
- Source / commission path thumbnails (one per tier + persona). Cheapest starting point: reuse the existing `static/img/banners/` art and iterate.
- Rewrite `docs/courses/index.md` to use compact `CourseCard` grouped by tier (cheapest catalog win pre-`/catalog`).
- **Ship:** PR 2 - paths live. The flat `/courses` page becomes a real catalog.

### Phase 2 - new hub home (≈2-3 days)

- Build `HubHero`, `HeroSearch`, `MagentaCta`, `FilterSortRow`.
- Source / commission the hero brand illustration (see §10 open question 3).
- Replace `Intro.js` with a hub home composed of: `HubHero` (title + body + `HeroSearch` + illustration), `FilterSortRow`, curated 3-up grid of compact `CourseCard`s, `MagentaCta` "EXPLORE THE WHOLE COURSE LIBRARY →". Matches §6.1 and the Pulsar Figma.
- Keep `docs/intro.md` as the route mount; the JSX moves into `src/components/hub/Home.js`.
- **Ship:** PR 3 - new homepage.

### Phase 3 - catalog + filters (≈2-3 days)

- Build `/catalog` page matching the Pulsar "Course library" frame: `HubHero` (scaled), `CategorySidebar` (Categories / SDK / Personas), grid+list view toggle, `CourseListRow` for list mode, `MagentaCta` "LOAD MORE" footer.
- Wire Algolia search input (in `HeroSearch`) to filter the grid/list in place — same component used on `/`.
- **Ship:** PR 4 - catalog with filters.

### Phase 4 - progress + course-page polish (≈2-3 days)

- `localStorage` progress: write last-viewed slug on every course/tutorial page mount.
- `ContinueTile` on hub home.
- `ProgressDots` on path pages.
- Inject metadata strip + `UpNextFooter` into the course doc layout (theme swizzle of `DocItem`).
- **Ship:** PR 5 - progress + course-page metadata.

### Phase 5 - polish, mobile, a11y (≈1-2 days)

- Mobile pass on hub home, path pages, catalog.
- Keyboard navigation for `FilterBar`, `RoleSelector`.
- Color-contrast audit against `--nd-*` tokens in both themes.
- Sitemap + Algolia config check (new routes get indexed).
- **Ship:** PR 6 - polish.

Total: roughly 2 weeks of focused work, shippable in 5-6 PRs that each leave the site in a working state.

---

## 10. Open questions

Resolved earlier in this thread:

- **Hub IA.** Home (`/`) stays flat (hero + curated grid + library CTA). Tiers + personas live on `/paths`.
- **Color mode.** Dark-first, light supported at parity.
- **Level vocabulary.** Essential / Practical / Production.
- **Rounded corners.** Honor brand `border-radius: 0` everywhere. The earlier rounded-pill inspiration is overridden by the Pulsar Figma.

Still open:

1. **Persona set.** Do we ship with three (Developer / Platform / AI), or add a fourth (Architect, QA, Operator)? Affects `/paths` URL structure and `RoleSelector` card count. No.
2. **Magenta hex.** What's the exact magenta from the Pulsar palette? The `--nd-color-magenta` token in §8 is a placeholder (`#E0157A`).
3. **Hero illustration asset.** The brand illustration in the Figma frames (screen mockup + topology + colored tag blocks) is a designed element, not stock art. Who produces / exports it? Two sizes are needed: a hero-scale version (≈600px wide on home) and a compact catalog-scale version.
4. **Topic tag color system.** The home-grid cards show colored topic tags ("WORKFLOWS", etc.). What's the topic → color mapping? Defined in Pulsar somewhere, or do we propose one?
5. **Curated set on hub home.** The Figma home grid shows ~6-9 cards spanning Foundation + AI. Should this be Foundation tier verbatim, or a curated "best starting points" set hand-picked across tiers? Recommend curated, since the Figma already mixes AI cards in.
6. **Foundation vs. Getting Started.** Today they're separate IA. Fold `/getting-started/*` into the Foundation path as "Step 0", or keep it separate? Recommend separate (5-minute setup ≠ 2-hour course) but link from the Foundation path hero.
7. **Per-language path entries.** Treat "Temporal 101 + Go" as a single card with an SDK chip selector, or as 6 cards? Recommend single card with chip selector — matches the existing `index.md` UX and keeps the catalog uncluttered.
8. **Progress storage.** `localStorage`-only for v1 is cheap, but users won't sync across devices. Acceptable for launch, or scope SSO-based progress now? Recommend `localStorage` first; revisit after launch metrics.
9. **AI persona scope.** Today `docs/tutorials/ai/` has 4 entries but no full course. Is the Advanced - AI path acceptable as "curated tutorials" at launch, or do we need at least one branded course first? Don't have an Advanced-AI path.
10. **Video as a first-class content type.** Existing courses are markdown + code; some future content may be video. Add a `kind: video` content type with thumbnail + duration + embed URL, or stay text-first with `lesson_count`? Recommend text-first; treat video as a future kind.
11. **Pulsar Figma access.** Direct view access for `angela.zhou@temporal.io` would close the loop on typography ramp, exact card paddings, hero scale, and animation. The two frames shared cover the broad strokes but not the fine-grain spec.

---

## 11. Risks

- **Docusaurus 2.4 age.** Some theme APIs differ from v3. Swizzling `DocItem` (Phase 4) is the most likely friction point. Confirm before Phase 4 starts.
- **Frontmatter sprawl.** ~30+ pages need new frontmatter. Mechanical but tedious - consider a one-off node script that backfills defaults so reviewers focus on overrides.
- **Algolia indexing.** New routes (`/paths/*`, `/catalog`) need to land in the Algolia config. Currently `algolia.indexName: "temporal"` is shared; coordinate with whoever owns the crawler config to add the new routes.
- **Brand consistency drift.** Without `--nd-*` enforcement (linter?), new components can sneak hardcoded colors. Consider a stylelint rule that bans hex literals outside `custom.css`.
- **Border-radius rule friction.** Sharp corners on cards can feel cold. Lean on shadow, color, and spacing for visual softness instead of radius. Validate the feel on Phase 1 before scaling the pattern.
- **Content prerequisite graph.** If `prerequisites` is wrong, "Up next" sends users to the wrong place. Build a manifest validator (Phase 0) that fails the build if a prereq slug doesn't exist.

---

## 12. Out of scope (parking lot)

- User accounts, cross-device progress, certifications, gamification.
- Per-user content recommendations beyond a hand-coded "next in path" rule.
- Comments / discussions on course pages (Slack/Forum already exist).
- Video-first courses (today everything is markdown-driven; revisit when we have video content to host).
- Internationalization beyond English (Docusaurus i18n is wired but no translations exist).

---

## Appendix A: file-level changes summary

| Path | Change |
|---|---|
| `src/css/custom.css` | Add `--nd-*` tokens; wire to Infima primary |
| `src/components/Intro.js` | Replaced by `src/components/hub/Home.js` in Phase 2 |
| `src/components/hub/*` | New: HubHero, HeroSearch, MagentaCta, CourseCard (compact, text-forward), CourseListRow, TopicTag, CategorySidebar, FilterSortRow, PathHero, RoleSelector, PathCard, LevelBadge, SdkChips, DurationBadge, ProgressDots, ContinueTile, UpNextFooter, PathBreadcrumb. (PathCard + LevelBadge already drafted on disk.) |
| `src/pages/paths/*.tsx` | New: index + 5 path pages |
| `src/pages/catalog.tsx` | New |
| `src/theme/DocItem/*` | Swizzled in Phase 4 for metadata strip + UpNextFooter |
| `plugins/learning-manifest/` | New Docusaurus plugin |
| `docusaurus.config.js` | Register new plugin; add new routes to sitemap; update navbar |
| `docs/intro.md` | Mounts new hub home component |
| `docs/courses/*/index.md` | Add `hub:` frontmatter |
| `docs/tutorials/**/index.md` | Add `hub:` frontmatter to category indexes + tutorials |
| `docs/courses/index.md` | Replace flat list with `CourseCard` grouped by tier |
| `static/learning-manifest.json` | Generated artifact (gitignored) |

---