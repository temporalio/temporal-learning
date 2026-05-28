# Conversation history

A chronological summary of the redesign work on learn.temporal.io — from initial plan through the full hub-style implementation. (Supersedes the earlier `hostyr.md` checkpoint.)

---

## Phase 1: Plan + design system

### Plugin housekeeping
- User asked why Figma plugin wasn't showing in `/plugin`. Confirmed `~/.claude/plugins/config.json` had `"repositories": {}`. Pointed them at `/plugin install figma@claude-plugins-official` to install.

### Initial plan.md (ultrathink)
- User shared two inspiration sources: the Pulsar Learning Templates Figma file (auth-gated, 403 on direct fetch) and an internal `go.temporal.io/platform-hub/learning-path` page.
- Explored the codebase: Docusaurus 2.4, homepage = `docs/intro.md` → `Intro.js`, 8 existing courses (Temporal 101/102, Error Handling, Versioning, Worker Versioning, Securing Application Data, Interacting with Workflows, Intro to Temporal Cloud), tutorials in `docs/tutorials/*` grouped by SDK and topic.
- Wrote `plan.md` with: three-tier path model (Foundation → Intermediate → Advanced), persona split on Advanced (Developer / Platform / AI), URL map (`/paths`, `/catalog`, etc.), content model frontmatter (`hub:` block with tier, personas, topics, level, duration, SDKs, prereqs), build-time manifest plugin design, page templates, component plan, design tokens, 5-phase implementation roadmap, open questions, risks.

### Level vocabulary decision
- Plan had "intermediate" doing double duty — both a tier and a per-content level.
- Offered options: Beginner/Intermediate/Advanced, Foundation/Intermediate/Advanced, **Essential/Practical/Production**, Start/Build/Scale, 100/200/300-level, or drop level entirely.
- User picked **Essential / Practical / Production**. Updated `plan.md` accordingly.

### Inspiration iterations
- User shared screen recording (`.mov` — couldn't read directly, no ffmpeg).
- User shared screenshots showing a 3-up Learning Paths card layout with colored top accents (Beginner/Intermediate/Advanced pills + lesson counts).
- Updated plan.md to include `thumbnail` and `lesson_count` frontmatter fields, `PathCard` and `TopicCarousel` components, and pattern-inspiration notes.
- User shared the canonical Pulsar Figma frames (Hub home + Course library). Key signals:
  - Dark mode primary (deep navy/space-black + grid texture)
  - Sharp corners everywhere
  - Compact text-forward cards (no thumbnail wells) for the home grid
  - Hero with brand illustration + prominent search
  - Magenta CTA color
  - Catalog page with grouped multi-select filter sidebar (Categories / SDK / Personas)
- AskUserQuestion: IA + color mode policy. User chose **"Keep tiers + personas, surface them on `/paths`"** + **"Dark-first, light supported at parity"**.
- Significant plan.md rewrite reflecting the canonical Figma direction.

### PathCard mockup
- Drafted `PathCard.js` + `LevelBadge.js` (with light/dark CSS) as standalone components matching the early-inspiration pattern. Plan.md updated to reflect on-disk drafts.

---

## Phase 2: Initial implementation (ultrathink)

Created 39 files implementing plan phases 0/1/2 with a hand-typed data module standing in for the manifest plugin.

**Foundation:**
- `src/css/custom.css` — full `--nd-*` token set, dark-default with `html[data-theme="light"]` overrides. Brand palette (UV / Lilac / Space Black / Off-White / Magenta), topic accent palette, semantic surface tokens, spacing scale, type stack.
- `src/data/hub.js` — hand-typed manifest mirror: `PATHS`, `COURSES`, `PERSONAS`, `TOPICS` + helpers (`getCourseBySlug`, `getPathBySlug`, `getCoursesForPath`, `getFeaturedCourses`).

**Components under `src/components/hub/`:**
- `TopicTag`, `SdkChips`, `DurationBadge`, `LevelBadge`, `CourseCard` (compact text-forward initially), `HeroSearch`, `HubHero` (with CSS-only placeholder illustration), `MagentaCta`, `FilterSortRow`, `RoleSelector`, `PathHero`, `PathBreadcrumb`, `PathCard`, `PathDetail`, `Home`.

**Pages:**
- `src/pages/paths/{index,foundation,intermediate,advanced-developer,advanced-platform,advanced-ai}.js`
- `src/pages/catalog.js` (stub showing all courses; sidebar filters deferred to Phase 3)

**Mount:**
- `docs/intro.md` initially mounted `<Home/>` inside the docs layout.

---

## Phase 3: Homepage iterations

### Multi-rail home (new screenshot)
- User shared a richer homepage screenshot: multiple horizontal rails ("New to Temporal? Start here", "Project-based tutorials", "Featured Courses", "Category name"), each with heading + "See all →" link.
- Rewrote `Home.js` as 4 rails with section variety. Built `SectionRail` (heading + see-all + card row) and reshaped `CourseCard` to have a thumbnail well with per-topic gradient fallback.
- Hero title changed from "New to Temporal? Start here." to **"Learn Temporal"** to match the screenshot.

### Hero illustration evolution
- Built CSS/SVG approximation: macOS window + Python-flavored code + 3D-isometric graduation cap + colored tag blocks.
- User confirmed the cap visual but said to just use their actual screenshot directly. Copied `/Users/azhou/Desktop/Screenshot 2026-05-26 at 7.56.42 PM.png` into `static/img/hero/learn-hero.png` (encountered a filename with a non-breaking space; resolved via shell glob).
- User flagged a thin purple border baked into the image. Cropped via `sips`: 416×268 → 400×252 (10px off left, 6px off top, 6px off right, 10px off bottom).

### Page chrome
- Replaced gradient direction (was light-top → dark-bottom; user wanted **near-black at top → navy blue at bottom**) and added a starfield (30 radial-gradient dots with a fade-to-transparent mask).
- Replaced the docs-layout mount with a clean `src/pages/index.js` wrapped in `@theme/Layout` to remove the left sidebar. Renamed `docs/intro.md` → `docs/_intro.md` to exclude.
- Removed the `border-bottom` divider between hero and first section.

### Token + class consolidation
- Pulled the dark gradient + starfield into a global `.nd-hub-page` utility class in `custom.css`. Theme-locked dark mode (overrides `--nd-fg`, `--nd-bg-elevated`, `--nd-border`, `--nd-bg-input` etc. within the class).
- Applied `.nd-hub-page` to Home, paths landing, path detail, and catalog pages. Each page's outer `<div>` swapped from `className={styles.page}` to `className="nd-hub-page"`.
- Removed grid pseudo-elements from `HubHero` and `PathHero`.

### Body link styling
- Made the word "Temporal" in the hero body a link to `https://temporal.io/`. Then fixed the link color: was near-white via `--ifm-link-color`, looked weird. Restyled to lilac with thin underline; magenta on hover.

### "Start here" card refactor
- User questioned whether the 3 course cards under "New to Temporal? Start here" were the best fit (mismatch: section title promised orientation but delivered 2-4 hour course commitments + Error Handling which is Practical-tier).
- Replaced with 3 step cards mirroring `/start`'s "Your first hour": Set up dev env (~5 min), Run a Temporal app (~20 min), Build from scratch (~20 min).
- Built `StepCard` component (compact, vertical, lilac top accent that shifts to magenta on hover). Updated `SectionRail` to accept `children` so the section header (clickable title + arrow) stays consistent with non-card content.

---

## Phase 4: New pages

### `/start` (beginner orientation)
- User questioned whether "New to Temporal? Start here" should be clickable to a dedicated page. Built `/start` with: Hero, 3-step "Your first hour", "Then go deeper" with Temporal 101 + 102 cards, "Concepts to know" (Workflow/Activity/Worker/Task Queue tiles), Common Questions accordion, Get Help cards, magenta CTA to `/paths/foundation`.

### `/tutorials` (project-based tutorials)
- User asked what should happen when clicking "Project-based tutorials." Built lean v1 then iterated through several structures:
  - **Lean v1:** Hero + Featured + AI rail + magenta CTA.
  - **Comprehensive v2:** Pulled full inventory from `docs.temporal.io/tutorials/` (22 tutorials across AI, Nexus, Go, Java, PHP, Python, TypeScript, Infrastructure). Built `ArchetypeCard` (project archetype with multi-SDK chips: Order processing, Subscription billing, Email drip, Trip booking, Data pipelines, Generative media, Cross-service Nexus).
  - **Topic + SDK split:** User wanted variety — split into topic-led sections (AI, Nexus, Infrastructure) followed by per-SDK sections (Go/Java/Python/TypeScript/PHP). Built `TutorialCard` with topic vs SDK variants.
  - **Final hybrid:** AI + Self-host Temporal as topic sections, "What do you want to build?" archetype grid (7 archetypes with SDK chips), compact "Or browse by language" SDK chip row at the bottom. Reduced to 4 content sections.
- Renamed `docs/tutorials/index.md` → `_index.md` to free up the route for `src/pages/tutorials.js`.

### `/courses` (course library)
- User wanted a creative version like `/start`. Built `SequenceCard` (vertical numbered chain showing course progressions): Just starting out / Production-ready developer / Platform engineer.
- Sections: Recommended sequences (3 sequence cards) → All courses by skill (4 themed groupings with side-accent copy blocks) → Common questions FAQ → magenta CTA → `/paths`.
- Renamed `docs/courses/index.md` → `_index.md`. Created `src/pages/courses/index.js`. Wired home "Featured Courses" rail (both title and "See all") to point at `/courses`. Later changed the "Explore the whole course library" magenta CTA on home to also point at `/courses` (was `/catalog`).

### Step pages (ultrathink)
- User asked to make the 3 anchor-link sections of `/getting_started/` into dedicated hub-styled pages.
- Created `src/pages/start/dev-environment.js`, `run-an-app.js`, `build-from-scratch.js`.
- Built shared scaffolding: `FIRST_STEPS` in `hub.js` (single source of truth), `StepProgress` (sticky horizontal pill nav showing 01 → 02 → 03 with the current step filled in lilac), `SdkPicker` (4-up grid of SDK link cards), `StepPage` (orchestrates hero + breadcrumb + progress + picker + outcomes + CTA).
- Each step page has Pick-your-SDK with the corresponding `/getting_started/{sdk}/{topic}/` link, "What you'll have when this is done" outcomes list, and a magenta CTA to the next step (step 3 → `/paths/foundation`).
- Updated `Home.js` `FIRST_STEPS` and `/start`'s `STEPS` to derive from the shared `hub.js` constant.

### `/ai` (current state)
- User asked for an `/ai/` page combining the AI tutorials and content from `https://docs.temporal.io/with-ai`.
- Identified two AI angles: build AI apps *on* Temporal (existing tutorials), and use AI tools *to write* Temporal code (docs/with-ai content — Temporal Developer Skill, Temporal Cloud Skill, Knowledge Base MCP server).
- Built `src/pages/ai/index.js` with: Hero ("Temporal + AI"), "Build AI agents on Temporal" tutorial grid pulled from hub.js, "Use AI to write Temporal code" 3-up `ToolCard` grid (each card has label chip, title, body, install command in monospace, GitHub/docs link), footer line to `docs.temporal.io/with-ai`, magenta CTA → `/paths/advanced-ai`.
- Updated home AI rail's `titleHref` and `seeAllHref` to `/ai`.

---

## Phase 5: SDK logos

User wanted real SDK logo tiles next to each SDK in the picker (matching their reference screenshot showing colored tiles with brand logos).

Iteration log:
1. **Text-tile approach** — colored backgrounds with bold language abbreviations. User: "no, use the exact icons."
2. **Devicon SVGs** — downloaded `go-original.svg`, `java-original.svg`, etc. from jsdelivr. User: "no, use the icons from the screenshot." Tried to extract from the PNG, couldn't.
3. **Asked where to put user-supplied files.** User said `static/img/sdk-logos/`.
4. **Temporal docs repo** — user pointed at `github.com/temporalio/documentation/static/img/sdks/svgs`. Downloaded those. User: "still wrong icons."
5. **User uploaded their own screenshots** as `go.jpg`, `java.png`, `php.jpg`, `python.jpg`, `ruby.jpg`, `typescript.jpg`, `dotnet.png`. Copied into `static/img/sdk-logos/`. Updated `SdkLogo` component to handle mixed extensions via a `LOGO_FILES` map. Removed colored tile backgrounds (the user's images already include them).

Final: `SdkLogo.js` renders `<span style="background-image: url('/img/sdk-logos/{file}')">` with `background-size: cover` filling the 40×40 tile.

---

## Phase 6: Site-wide additions

### Get-notified banner
- User asked for a "Get notified when we launch new educational content" CTA on the home, linking to `https://pages.temporal.io/get-updates-education` (tracking params stripped).
- Built `NotifyBanner` component (off-white tinted band, copy on the left, outline-lilac Subscribe button that fills magenta on hover, opens in a new tab with `rel="noopener noreferrer"`).
- User asked to put it on every page. Extracted into `src/components/hub/NotifyBanner/`. Added `<NotifyBanner />` near the bottom of: Home, `/start`, `StepPage` (covers 3 step pages), `/paths` landing, `PathDetail` (covers 5 path detail pages), `/courses`, `/tutorials`, `/catalog`. 12 hub pages covered through 9 file touches.

### Examples + Zines surfacing
- User asked where to surface `/examples/` and `/zines/`. Offered two approaches: group them as one "More to explore" section on the home, OR distribute contextually (zines on `/start`, examples on home or path footer).
- User picked grouped approach. Added a "More to explore" section to the home with 2-up left-accent cards (Examples + Zines) above the magenta CTA.

### Categories sidebar (`/courses`)
- User asked for a categories filter section on `/courses` and `/tutorials` matching a screenshot of a Course library catalog.
- Initial v1: built `CategoryFilter` component (sidebar + grid inline as a section). Added to both pages.
- User reverted `/tutorials`, asked to remove the section from `/courses` and put Categories as a sticky LEFT sidebar visible across the whole page.
- Built `CategorySidebar` component (pure filter UI, no grid, controlled via `filters` + `onChange` props with `topics` / `sdks` / `personas` Sets).
- Refactored `/courses/index.js` into a 2-column layout: hero full-width, then `.pageLayout` grid with sticky 220px sidebar + main content column. Filter state lifted to `CoursesPage`.
- When filters are active: the "All courses, by skill" section drops the skill-area grouping and renders a flat `.matchedGrid` of matched `CourseCard`s. Section title changes to "N matching course(s)". Section header changes back when filters are cleared.

### FAQ additions
- User asked to add a "Where can I ask questions about a course?" FAQ entry to `/courses` pointing at `https://community.temporal.io/`. FAQ answers now support JSX (the link is wrapped in a React fragment). Added `.faqA a` styling — lilac with thin underline, magenta on hover — so links read well on the dark gradient regardless of light/dark theme.

---

## Key artifacts on disk

**Pages (`src/pages/`):**
- `index.js` — `/` (home, Layout-wrapped Home component)
- `start.js` — `/start` (orientation)
- `start/{dev-environment,run-an-app,build-from-scratch}.js` — first-hour step pages
- `paths/{index,foundation,intermediate,advanced-developer,advanced-platform,advanced-ai}.js`
- `courses/index.js` — `/courses` with sticky CategorySidebar
- `tutorials.js` — `/tutorials` topic + archetype + SDK browse
- `ai/index.js` — `/ai` AI tutorials + AI tooling
- `catalog.js` — `/catalog` stub

**Hub components (`src/components/hub/`):**
- `Home/`, `HubHero/`, `HeroSearch/`, `SectionRail/`
- `CourseCard/`, `PathCard/`, `StepCard/`, `ArchetypeCard/`
- `MagentaCta/`, `NotifyBanner/`, `LevelBadge/`, `TopicTag/`, `SdkChips/`, `DurationBadge/`
- `RoleSelector/`, `PathHero/`, `PathBreadcrumb/`, `PathDetail/`
- `StepPage/`, `StepProgress/`, `SdkPicker/`, `SdkLogo/`
- `CategorySidebar/`, `CategoryFilter/` (older variant, currently unused)
- `FilterSortRow/` (older variant, currently unused)

**Data + tokens:**
- `src/data/hub.js` — `COURSES`, `PATHS`, `PERSONAS`, `TOPICS`, `FIRST_STEPS`, helpers
- `src/css/custom.css` — `--nd-*` token set + `.nd-hub-page` global utility

**Static assets:**
- `static/img/hero/learn-hero.png` — cropped hero illustration (user-supplied)
- `static/img/sdk-logos/{go.jpg, java.png, dotnet.png, php.jpg, python.jpg, ruby.jpg, typescript.jpg}` — user-supplied SDK tiles

**Mounts / wiring:**
- Old docs index pages excluded by underscore prefix: `docs/_intro.md`, `docs/courses/_index.md`, `docs/tutorials/_index.md`
- `docusaurus.config.js` navbar updated with Paths + Course library entries

---

## Open parking lot

These came up but weren't completed:

1. **Tutorial data in `hub.js`** — only the 4 AI tutorials live there. The other ~18 tutorials (audiobook, ecommerce, email drip, trip booking, recurring billing, data pipeline, geocoding, CYOA bot, one-click order, Nexus, 3 infra) are inline in `tutorials.js`. Promoting them to `hub.js` would let the CategorySidebar work on `/tutorials` too if you ever want it there.
2. **`/ai/` tutorial coverage** — TypeScript CYOA bot is referenced from `/tutorials` inline data but isn't in `hub.js`, so it doesn't appear on `/ai`.
3. **`SequenceCard` stray `IU`** — at one point a stray "IU" was introduced after a `</h3>` in the `SequenceCard` component in `courses/index.js`. Was flagged but not auto-removed.
4. **`/catalog` is a stub** — Phase 3 of plan.md (full catalog with grouped filters and grid/list view toggle) was deferred.
5. **Phase 4 of plan.md** — localStorage progress tracking, `ContinueTile`, `UpNextFooter` swizzle, course-page metadata strip — all deferred.
6. **Phase 5 of plan.md** — mobile + a11y audit — deferred.
7. **Manifest plugin** — `src/data/hub.js` is hand-typed standing in for what the Docusaurus learning-manifest plugin would emit. Plugin itself was never built.

---

## Plan.md decisions (still load-bearing)

Resolved through the conversation:
- **Hub IA:** flat home + tiers/personas on `/paths`.
- **Color mode:** dark-first, light supported at parity.
- **Level vocabulary:** Essential / Practical / Production.
- **Rounded corners:** `border-radius: 0` everywhere — honored.

Still open in `plan.md §10`:
- Persona set (3 vs adding a 4th — Architect/QA/Operator).
- Magenta hex (placeholder `#E0157A`).
- Hero illustration asset — closed by user supplying their own PNG.
- Topic tag color system.
- Curated set on hub home — currently 3 steps + featured courses + topical AI rail.
- Foundation vs `/getting-started/` — currently separate.
- Per-language card treatment.
- Progress storage (`localStorage`-only acceptable for v1).
- AI persona scope.
- Video as a first-class content type.
- Pulsar Figma view access for fine-grain typography/spacing specs.

---

## Phase 7: /ai/ polish + cookbook + videos

### Style fix on `/ai/`
- User flagged that the AI tutorials section looked weird. Root cause: `CourseCard` was being used with no thumbnail data, so each card rendered as an oversized gradient placeholder block. Replaced with an inline compact `TutorialCard` (3-col grid, magenta top accent, title + summary + "Read tutorial →") mirroring `/tutorials/`'s style.

### AI Cookbook section
- User asked "what about AI cookbook?" referring to `docs.temporal.io/ai-cookbook`. Fetched the cookbook via the temporal-docs MCP search and pulled 9 recipes (Hello World, Tool calling agent, Agentic loop OpenAI, Agentic loop Claude, OpenAI Agents SDK, Durable MCP server, Human-in-the-loop, Claim check pattern, Deep research). Added "Recipes from the AI Cookbook" section as a 3-col grid of `RecipeCard`s with lilac accent + RECIPE label. Each card links to the matching cookbook page; footer line points at the full library.

### Expert sessions
- User wanted a video section modeled on the "expert sessions" rail in `pages/durable-ai-agent-bundle-assets`. Three videos: "Learn to Build AI Agents with Temporal", "Deep Dive: AI Agent Code Walkthrough", "Build a Deep Research Agent" (title resolved via WebFetch). Built `VideoCard` with a `i.ytimg.com/vi/{id}/hqdefault.jpg` thumbnail + circular play overlay that fills magenta on hover. User asked for it last + locked to a single row → moved below "Use AI to write Temporal Code" and set `grid-template-columns: repeat(3, 1fr)` with no responsive collapse.

### Get help section spread
- User wanted the `/start/` "Get help" card row replicated on `/tutorials/` and `/courses/`. Added matching `<section>` blocks + the `.helpGrid` / `.helpCard` styles into each page's module CSS (3 cards: Community Slack, Forum, Documentation).

---

## Phase 8: /tutorials/ filter sidebar + archetype copy

### CategorySidebar on /tutorials/
- User asked for the same SDK filter sidebar from `/courses/` on `/tutorials/`. Built a flat `ALL_TUTORIALS` list (AI + INFRA + flattened archetype impls) with `topics` and `sdkLanguages` metadata, wrapped the page in the same `pageLayout` grid + `pageSidebar` pattern, lifted filter state to `TutorialsPage`. When filters active → flat `matchedGrid`; when unfiltered → existing sections.
- Added `infrastructure` to `TOPICS` in `hub.js` so the sidebar's Categories group surfaces it.
- Removed the "Or browse by language" sub-section that used to sit at the bottom of `/tutorials/`.

### Section reorder
- User wanted Infrastructure tutorials moved below "What do you want to build?" rather than above it. Just shuffled JSX order.

### "Build it in" labels for atypical archetypes
- User flagged that "Build it in: Data pipeline / Geocoding API" and "Build it in: Sync Nexus tutorial" didn't fit the multi-SDK label pattern. Added an `implsLabel` prop to `ArchetypeCard` so each archetype can override. Set Data pipelines & APIs to "Python tutorials" and Cross-service Nexus to "Tutorial".

---

## Phase 9: See Temporal in Action - the long carousel saga

### Initial section on /start/
- User asked for a "Why Temporal?" or "See Temporal in Action" section that captures the spirit of PR #407 (`temporalio/temporal-learning#407`, a multi-language tour) without merging it (user explicitly didn't want the PR merged). Started as a single `SdkPicker` grid of 6 language cards linking to `/see_temporal_in_action/{sdk}/` URLs.
- User said "I'm not seeing it" → realized the links 404 since they depend on the unmerged PR. Pivoted to inlining the content on `/start/`.

### Inline code tabs
- Built `<Tabs>` + `<CodeBlock>` widget showing the same `OrderWorkflow` (later `ReimbursementWorkflow`) in Python, Go, Java, .NET, Ruby, TypeScript. Used `<Tabs groupId="sdk">` so the language picker syncs across the page. Initial code samples were my approximations; user later said "use the code from this: edu-get-started-flow" and I ported the canonical Workflow files for all 6 SDKs.

### Source code GitHub icons
- Added a `SourceCodeBlock` wrapper that overlays a GitHub octocat link in the top-right of each CodeBlock (positioned just left of Docusaurus's built-in copy button). Each tab links to its matching folder in `github.com/temporalio/edu-get-started-flow`.

### Web UI screenshot
- Pulled `retries-gif.gif` (24MB - too heavy) and `workflow-execution-complete-ts.png` + `error-workflow-ts.png` from the PR. Saved the two PNGs as `static/img/see-temporal-in-action/{error-state,workflow-complete}.png`. Initially showed the error-state image vertically below the code.

### Layout iterations
- User asked for side-by-side (code | image), then same height with the image more visible, then "uncrop" the image since `object-fit: cover` was hiding parts. Tried multiple grid ratios, then user reversed: "let's revert and move the screenshot below the codeblock again."
- Settled on vertical: 6-tab code, callout, then full-width screenshot with centered caption.

### Adding richer content
- Pulled more verbiage from the PR's `why-temporal.md`, `the-challenge.md`, `adding-an-error.md`, `observing-retries.md`, `observing-workflow-completion.md`. Restructured the section into a narrative arc: pitch → challenge → code intro → code → breakage → retries image → completion image → closing callout.
- User: "there's too much going on with two screenshots and the code. Make this a carousel" - first iteration was a 2-slide image carousel (error-state + completion) with prev/next arrows + dots + slide-translate animation.

### Full code+image carousel
- User: "the code should also be a carousel. For example, adding an error, commenting it out. The entire thing should be a carousel." Built a 5-slide carousel:
  1. Meet the Workflow (workflow code)
  2. Inject a failure (activities with raise/throw exception)
  3. Observe the retries (error-state.png)
  4. Fix the exception (activities with line commented out)
  5. Workflow completes (workflow-complete.png)
- Added a `<LangPicker>` above the carousel - SDK selection persists across all code slides via shared state. Wrote per-SDK activities-bug and activities-fix code (12 variants total) by adapting the canonical files (which keep the raise line commented out by default).

### Carousel UX fixes
- Active SDK tab was invisible → root cause: `.nd-hub-page` overrides `--nd-bg: transparent`, and my `color: var(--nd-bg)` resolved to transparent text. Swapped to `var(--nd-color-space-black)`.
- Step 2 had blank space below short captions because flex layout stretched all slides to the tallest one's height. Switched to single-slide render with a key-triggered fade animation (`animation: slideFade 220ms ease`). Container now sizes to the active slide.
- Highlighted lines were barely visible against comment text. Overrode `--docusaurus-highlighted-code-line-bg` to `rgba(127, 134, 241, 0.22)` and added a 3px lilac left bar via `box-shadow: inset 3px 0 0`.

### Line highlighting per language
- User asked to highlight the `execute_activity` lines on Step 1, the raise/throw line on Step 2, the commented line on Step 4. Built per-SDK `WORKFLOW_HIGHLIGHTS` and `EXCEPTION_LINE_HIGHLIGHTS` maps with each language's actual line numbers, passed via `metastring={`{${highlight}}`}` to CodeBlock.

### Copy iterations
- Multiple "this is verbose" passes from the user. Compressed the intro from ~165 words to ~60 words (3 short paragraphs). Step 1 caption shrunk from 4 paragraphs + bullet list to 2 short paragraphs. Step 4 caption from 3 long paragraphs to 2 short ones. Step 1 heading changed from "Workflows orchestrate Activities" → "Meet the Workflow" (user: too intimidating).
- Added `<a>` links on "Activity" and "Workflow" first mentions pointing at `docs.temporal.io/activities` and `docs.temporal.io/workflows` (stripped GA tracking params).
- User: "the user doesn't need to know what a Worker is yet" → swapped Worker jargon in Step 4 caption for plain language.
- Closing callout moved from below the carousel into Step 5's body so it only shows on the final slide.

### `maximum_attempts` change
- User: "remove the maximum 5 attempts. Use the code from this repo." → switched to the canonical retry policy (`maximum_attempts=100` with explicit `initial_interval`, `backoff_coefficient`, `maximum_interval`), pulled verbatim from each SDK's workflow file in `edu-get-started-flow`.

---

## Phase 10: Page sidebars + dedicated /start/in-action page

### Homepage demo nudge
- User asked for a small "Want to see the power of Temporal in action?" text link near the "New to Temporal? Start here" rail on home. Added a one-line muted-text link below the rail title, above the step cards. Targets `/start/in-action` (initially `#see-temporal-in-action`).

### /start/ TOC sidebar
- User: page is long, a left TOC would help. Built `StartToc` component + `pageLayout` grid (220px sidebar + main, mirrors `/courses/`). Items: See Temporal in Action, Set up dev environment ↗, Run a Temporal app ↗, Build one from scratch ↗, Take a course, Concepts to know, Common questions. External-route items get `↗` glyph; in-page anchors smooth-scroll + update URL hash. IntersectionObserver scroll-spy with `rootMargin: "-30% 0px -55% 0px"` highlights active section with a lilac left bar.
- Removed "Your first hour" from the TOC since it's just a section header for the three step pages (user feedback).

### /start/in-action dedicated page
- User: the See Temporal in Action section "takes up a LOT of space" → wanted to extract into its own page with an attractive teaser on `/start/`. Created `src/pages/start/in-action.js` that imports the named-exported `ReimbursementCarousel` from `start.js` (avoids duplicating ~670 lines of code constants). Built a teaser card on `/start/` with 2-col layout: copy left ("5-STEP WALKTHROUGH" / "Watch Temporal recover from a failure" / body / lilac CTA) + Web UI thumbnail right, lilac top accent that hover-shifts to magenta. TOC item 01 now points to `/start/in-action` (external link with ↗).
- Homepage demo link updated: "Watch the demo" → "Try the walkthrough", target → `/start/in-action`.

### /ai/ TOC sidebar
- Mirrored the /start/ TOC pattern on /ai/. Items: Tutorials, AI Cookbook Recipes, Use AI to write Temporal code, Expert sessions (all in-page anchors). Added matching `pageLayout` + `pageSidebar` + scroll-spy CSS to `ai.module.css`.

### AI Cookbook recipe tags
- User asked to replace the single "RECIPE" label on each recipe card with tags (Foundations / OpenAI / Python style). Updated `COOKBOOK_RECIPES` data with `tags` arrays per recipe, replaced `<div className={styles.recipeLabel}>RECIPE</div>` with `<div className={styles.recipeTags}>` mapping over `tag` pills. Each pill has `data-tag={tag}` for per-tag color overrides: Foundations → bright lilac, Agents → magenta, Python/OpenAI/Anthropic → neutral white-tinted, others (Tool Calling, MCP, Signals, Patterns, Deep Research) → default lilac tint.

---

## Key artifacts added in Phases 7-10

**New pages:**
- `src/pages/start/in-action.js` — dedicated 5-slide carousel page (imports `ReimbursementCarousel` from `start.js`)

**New components / inline in pages:**
- `LangPicker`, `CodeSlide`, `ImageSlide`, `ReimbursementCarousel`, `SourceCodeBlock` (all in `src/pages/start.js`, `ReimbursementCarousel` named-exported for reuse)
- `StartToc` (in `src/pages/start.js`)
- `AiToc` (in `src/pages/ai/index.js`)
- `TutorialCard` (inline in `src/pages/ai/index.js`)
- `RecipeCard` with tag pills (inline in `src/pages/ai/index.js`)
- `VideoCard` (inline in `src/pages/ai/index.js`)

**New static assets:**
- `static/img/see-temporal-in-action/error-state.png` — Web UI mid-retry (Activity attempt 4/100)
- `static/img/see-temporal-in-action/workflow-complete.png` — completed Workflow timeline

**Data changes:**
- `hub.js` TOPICS: added `infrastructure`
- `hub.js` COURSES: AI tutorials with `topics: ["ai"]` so the /tutorials sidebar's Categories group includes them

**Cross-cutting style additions (start.module.css, ai.module.css, courses.module.css, tutorials.module.css):**
- `.pageLayout`, `.pageSidebar`, `.pageMain` (sticky 2-col layout)
- `.toc`, `.tocLink`, `.tocLinkActive`, `.tocNum`, `.tocText`, `.tocExternal` (TOC sidebar)
- `.helpGrid`, `.helpCard` (Get help section)
- `.demoTeaser*` (the /start/ teaser card)
- `.recipeTags`, `.recipeTag[data-tag="..."]` (per-tag colored pills)

---

## Resolved tensions worth remembering

- **"Same height" vs "uncropped image"** in the demo section: directly opposed. Side-by-side with `object-fit: cover` matched heights but cropped detail; natural aspect kept the image whole but mismatched code height. Resolved by going vertical (image below code at full width), then by going full-carousel (one slide visible at a time, no comparison concern).
- **Multi-SDK reach vs implementation cost** in the carousel: kept all 6 SDKs in the language picker by writing per-SDK code for each beat (workflow + activities-bug + activities-fix = 18 constants). The user repeatedly nudged toward "use real code" so the source matches `edu-get-started-flow` line-for-line.
- **Jargon-free teaching vs Temporal vocabulary**: defined Workflow / Activity inline in Step 1 (with docs links). Stripped Worker from Step 4 explicitly because users haven't met it yet at this point in the onboarding.
- **Carousel UX**: flex track + translateX gave a nice slide animation but stretched all slides to the tallest's height. Single-slide render + fade animation lost the horizontal slide motion but eliminated trailing blank space. Chose the latter on user feedback.
