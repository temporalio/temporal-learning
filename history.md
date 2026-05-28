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

---

# Session 2 — 2026-05-27 (Hub style rollout: paths, /examples, /zines, dev_environment + first_program for all SDKs)

Continuing the brand redesign. Most of this session was about converting MDX content pages to React pages so they pick up the `nd-hub-page` styling (dark gradient + starfield + brand vars) that the homepage uses, plus building a few new shared components for tutorial layouts.

## TL;DR of what changed

1. **Tweaked path data + nav** in `src/data/hub.js` and the path detail pages.
2. **Renamed `/paths/advanced-ai/` → `/paths/ai/`.**
3. **Flattened `/paths/` index** into a single "All paths" grid (removed split + "Pick your role" section).
4. **Rewrote `/courses/`** to a flat grid with SDK chips + tier-colored top borders (was grouped by skill).
5. **Converted `/zines/` and `/examples/` to React pages** under `src/pages/`.
6. **Converted all 7 SDK `dev_environment` pages** to React with shared layout components + a "What's next?" card linking to each SDK's `first_program`.
7. **Converted 6 SDK `first_program_in_<sdk>` pages** to React, **split into 3 chapters each** connected by a `TutorialStepper` component.

## New shared components

All under `src/components/`:

- **`DevEnvironment/Toc.js`** — sticky left-rail TOC, takes `items=[{id,label}]` prop, uses `IntersectionObserver` to highlight active section, click scrolls with **88px offset** (clears the sticky navbar).
- **`DevEnvironment/MetaChips.js`** — pill row beneath the H1 (e.g. `~10 minutes · Hands-on tutorial · Beginner`). Takes `items` string array.
- **`DevEnvironment/VerifyCard.js`** — lilac-tinted "Verify your setup" card with 3 numbered steps. Used on every `dev_environment` page.
- **`DevEnvironment/TutorialStepper.js`** — horizontal numbered progress row used at the top of multi-chapter tutorials. Takes `steps=[{n,label,href}]` + `currentStep`. Past steps get a checkmark, current step is lilac-highlighted, future steps muted. All non-current items are `Link`s.
- **`DevEnvironment/styles.module.css`** — shared CSS for everything above plus `.pageLayout`, `.pageSidebar`, `.pageMain`, `.title`, `.intro`, `.section`, `.sectionTitle`, `.subsectionTitle`, `.diagramImage`, `.chapterNav*`, `.nextSection`/`.nextCard*` ("What's next?" 2-card grid), `.heroBanner`/`.heroBannerImg` (280px tall, object-fit cover).
- **`TemporalServiceSetup/TemporalServiceSetup.js`** — shared React component that replaces `docs/getting_started/_temporal_service.md` (which was imported into every SDK dev_environment MDX). Renders the macOS/Windows/Linux Tabs + `temporal server start-dev` content + `--ui-port` admonition + `--db-filename` note. Used by every SDK's dev_environment page.

## Pages converted from MDX → React in this session

Each follows the same skeleton: `<Layout>` → `<div className="nd-hub-page">` → full-width hero banner → `pageLayout` grid with `DevEnvironmentToc` on the left + `pageMain` on the right → breadcrumb → title → meta chips → (stepper if multi-chapter) → content sections → "What's next?" card / chapter nav → `NotifyBanner`.

| Old MDX (deleted) | New React (created) |
| --- | --- |
| `docs/zines/index.md` | `src/pages/zines/index.js` + `zines.module.css` |
| `docs/examples/index.md` | `src/pages/examples/index.js` + `examples.module.css` |
| `docs/getting_started/go/dev_environment/index.md` | `src/pages/getting_started/go/dev_environment/index.js` |
| `docs/getting_started/java/dev_environment/index.md` | `src/pages/getting_started/java/dev_environment/index.js` |
| `docs/getting_started/python/dev_environment/index.md` | `src/pages/getting_started/python/dev_environment/index.js` |
| `docs/getting_started/ruby/dev_environment/index.md` | `src/pages/getting_started/ruby/dev_environment/index.js` |
| `docs/getting_started/typescript/dev_environment/index.md` | `src/pages/getting_started/typescript/dev_environment/index.js` |
| `docs/getting_started/dotnet/dev_environment/index.md` | `src/pages/getting_started/dotnet/dev_environment/index.js` |
| `docs/getting_started/php/dev_environment/index.md` | `src/pages/getting_started/php/dev_environment/index.js` |
| `docs/getting_started/_temporal_service.md` | replaced by `src/components/TemporalServiceSetup/` |
| `docs/getting_started/go/first_program_in_go/` | `src/pages/getting_started/go/first_program_in_go/{index,run,simulate-failures}.js` |
| `docs/getting_started/java/first_program_in_java/` | `src/pages/getting_started/java/first_program_in_java/{index,run,simulate-failures}.js` |
| `docs/getting_started/python/first_program_in_python/` | `src/pages/getting_started/python/first_program_in_python/{index,run,simulate-failures}.js` |
| `docs/getting_started/ruby/first_program_in_ruby/` | `src/pages/getting_started/ruby/first_program_in_ruby/{index,run,simulate-failures}.js` |
| `docs/getting_started/typescript/first_program_in_typescript/` | `src/pages/getting_started/typescript/first_program_in_typescript/{index,run,simulate-failures}.js` |
| `docs/getting_started/dotnet/first_program_in_dotnet/` | `src/pages/getting_started/dotnet/first_program_in_dotnet/{index,run,simulate-failures}.js` |

For each first_program SDK, images moved from `docs/getting_started/<sdk>/first_program_in_<sdk>/images/` → `static/img/getting_started/<sdk>/first_program_in_<sdk>/`. Referenced via absolute URL in JSX.

**PHP exception:** PHP only has `hello_world_in_php` (no `first_program_in_php`), so first_program conversion skipped it. PHP's dev_environment's "What's next?" points to `hello_world_in_php` instead of a first_program.

## Three-chapter split structure (TutorialStepper)

Used for every `first_program_in_<sdk>`. URL pattern:

- Chapter 1: `/getting_started/<sdk>/first_program_in_<sdk>/` (`index.js`) — Understand the application
- Chapter 2: `/getting_started/<sdk>/first_program_in_<sdk>/run/` (`run.js`) — Run the application
- Chapter 3: `/getting_started/<sdk>/first_program_in_<sdk>/simulate-failures/` (`simulate-failures.js`) — Simulate failures

Each file: own `TOC_ITEMS`, own `TUTORIAL_STEPS` (identical except `currentStep`), per-chapter time on `MetaChips` (`~15 minutes total` on ch1, `~5 minutes` on ch2/ch3). Bottom of each chapter has a `chapterNav` 2-card prev/next grid. Chapter 3 also has the "What's next?" 2-card grid (build-from-scratch + Temporal 101).

**Ruby is structured differently from the others:** its tutorial doesn't use uncomment-to-fail, so chapter 3 covers three distinct failure modes (insufficient funds non-retryable, invalid account saga refund, manually-injected bug) instead of the generic 2-section split. Same chapter URLs, same TutorialStepper.

## Snipsync tradeoff

The MDX files used `<!--SNIPSTART ... -->` markers that pull current code from upstream `temporalio/money-transfer-project-template-<sdk>` repos at build time via `yarn getsnips`. **The React conversions inline the snapshots as JavaScript string constants** (named `WORKFLOW_GO`, `ACTIVITY_DEPOSIT`, etc., declared at the top of each chapter file). They no longer auto-refresh — each file has a header comment pointing to the canonical GitHub repo so maintainers know to refresh manually if upstream changes.

## Other tweaks in this session

- **`src/data/hub.js`:** `lessonCount` for production-grade-developer fixed (9 → 8); `slug` for that path was edited by user/linter from `production-grade-developer` → `Production-Grade-developer` (case-sensitive; the file route `production-grade-developer.js` is lowercase, so the URL may not resolve cleanly — flagged but not fixed); `slug: "advanced-ai"` renamed to `slug: "ai"`; `PERSONAS.ai.pathSlug` updated to match; `intermediate` path title also changed to `"Building Resilient Applications"` by linter; non-Foundation paths had `thumbnail` removed (Foundation kept `getstarted.png` — user said other banners didn't match).
- **`/paths/` index** (`src/pages/paths/index.js`): collapsed two grids into one "All paths" grid, removed `RoleSelector`/"Pick your role" section.
- **`/paths/foundation/` and `/paths/intermediate/`** (`src/pages/paths/{foundation,intermediate}.js`): added `nextActions` props pointing to the next path. (Originally had both Intermediate path + Pick-a-tutorial cards; user trimmed to just the path card.)
- **`/paths/production-grade-developer.js`**: removed Pick-a-tutorial card; kept only the Temporal Cloud card.
- **Renamed** `src/pages/paths/advanced-ai.js` → `src/pages/paths/ai.js`, updated slug references in `hub.js` and one ref in `src/pages/ai/index.js:399` (MagentaCta href).
- **`/paths/ai/`** has a 2-card "What's next?": `/ai` (Explore more AI on Temporal) + external `https://temporal.io/solutions/ai`.
- **`/paths/foundation/` + `/paths/intermediate/` styling**: switched `PathDetail` wrapper to `nd-hub-page` so they pick up the gradient.
- **`CourseCard`** (`src/components/hub/CourseCard/CourseCard.js`): CTA reads "Try the tutorial" when `course.kind === "tutorial"`, "Take the course" otherwise. Used on `/paths/ai/` card list to match the page being tutorials, not courses.
- **`/start/` FAQ** (`src/pages/start.js`): removed "How is Temporal different from a job queue or cron?" + "Will my Workflows be slow?" + the "the SDK code stays identical" trailing clause; added a "What is durable execution?" Q/A using copy the user provided (the Temporal-product description, not the technical definition).
- **`/courses/` index** (`src/pages/courses/index.js`): removed `BY_SKILL` grouping → flat 3-col grid. Each card now shows title + summary + `SdkChips` + CTA. Cards have a tier-colored top border (`foundation`=green, `intermediate`=orange, `advanced`=magenta). Removed "Do I get a certificate?" FAQ; made "learning paths" linkable to `/paths/` in the remaining "in order?" FAQ.
- **`/examples/` SDK samples row**: each chip uses `SdkLogo` to show the per-SDK branded tile + label + external-link arrow, matching the `/start/dev-environment/` pattern.

## Things I tried that didn't work (worth not repeating)

- **HubPageStyle client module to apply `nd-hub-page` to MDX doc pages.** Lived in `src/components/HubPageStyle/HubPageStyle.js` + `src/clientModules/hubStylePages.js` (registered in `docusaurus.config.js`). It does add the body class, but doc primitives (sidebar, TOC, breadcrumb, pagination, code-block surfaces) need substantial per-element CSS work to look right on the gradient. User got frustrated with the incremental fixing; we switched to React-page conversion instead. **Files are still in place** in case someone wants to revisit the body-class approach for long MDX content (like `/tutorials/<sdk>/<archetype>/`). `HUB_PREFIXES` in the client module is currently empty.
- **CSS already in `custom.css` for `body.nd-hub-page`** that supports doc pages: hides sidebar/TOC/breadcrumb/pagination, makes wrappers transparent, full-width `.banner`, lilac pagination cards. Around line 160 in `src/css/custom.css`. Still live for any future MDX page that opts in via the client module.

## Known TODOs / things flagged but not resolved

- **The `Production-Grade-developer` slug case-sensitivity.** The file is `src/pages/paths/production-grade-developer.js` but the slug in `hub.js` is now mixed-case (`Production-Grade-developer`). Internal links go to `/paths/Production-Grade-developer` which **may or may not** resolve in production depending on host case-sensitivity. Currently 200 locally but worth resolving.
- **Snipsync drift:** the inlined code constants in every chapter 1 + chapter 2 of `first_program_in_<sdk>` will go stale if upstream repos change. Worth a periodic re-sync pass or a build script that pulls from the repos.
- **`/tutorials/<sdk>/<archetype>/` pages** are still MDX docs with the default theme — same treatment could be applied, but volume is much higher (~25 tutorials).
- **AI tutor / quiz / replay debugger** were discussed in an ultrathink turn as next-step ideas but **none were built**. The user liked the AI tutor (`mcp__temporal-docs__search_temporal_knowledge_sources` powered) + replay debugger + lightweight inline quizzes as ideas worth pursuing.
- **Verify Card content** is the same on every dev_environment page. Could be SDK-customized later (e.g., "your SDK is in your `package.json` / `Gemfile` / `pom.xml`").
- **Path slug normalization in `hub.js`** — `Production-Grade-developer` is mixed case, all others are lowercase. The component reads `path.slug` directly and constructs URLs from it, so this leaks into hrefs everywhere the path appears on `/paths/`, in the homepage, etc.

## Server state when handing off

- Dev server running on port 3000 (background tasks I started earlier). Port 3001 may have a separate user-owned instance running.
- All 7 dev_environment routes serve 200.
- All 18 first_program routes (6 SDKs × 3 chapters) serve 200.
- `yarn build` not run in this session — only dev-mode compile verified.

## Files modified or referenced for context (not exhaustive)

- `src/data/hub.js` — paths data, course data, personas, topics
- `src/components/hub/PathDetail/PathDetail.js` — uses `nd-hub-page` wrapper
- `src/components/hub/CourseCard/CourseCard.js` — CTA varies by `kind`
- `src/components/hub/RoleSelector/RoleSelector.js` — no longer used on `/paths/` but still exists
- `src/css/custom.css` — extensive `body.nd-hub-page` overrides (lines 160+)
- `docusaurus.config.js` — `clientModules: [require.resolve("./src/clientModules/hubStylePages.js")]` registered

---

# Session 3 — 2026-05-27/28 (hello_world conversions, full tutorial rollout, course conversions, Temporal 101 free preview)

This session was the long tail of the MDX-to-React conversion: hello_world for every SDK, every project tutorial, every course landing + per-SDK course page, the Nexus tutorial that got missed on the first pass, and shipping a free in-browser preview of Temporal 101's "Understanding Workflow Execution" module.

## hello_world conversions (6 SDKs, 3 chapters each except PHP)

Same pattern as first_program. For each SDK, dispatched a subagent to port the MDX into 3 React chapter pages with `TutorialStepper`, sticky TOC sidebar, breadcrumb, MetaChips, chapterNav cards, and NotifyBanner. Source MDX deleted, images moved to `static/img/getting_started/<sdk>/hello_world_in_<sdk>/`.

- **Go, TypeScript, Ruby**: 3 chapters each (Build the app / Test and run a Worker / Run and observe retries). All three are the IP-geolocation pattern with Web UI screenshots in chapter 3.
- **Python, Java**: 3 chapters each (Build / Test+Worker / Run). Hello-world style content, shorter chapter 3 (no Web UI / Observe Retries).
- **PHP**: single page — it's the "downloaded sample" walkthrough rather than from-scratch, doesn't fit the 3-chapter arc.

URL pattern: `/getting_started/<sdk>/hello_world_in_<sdk>/{,worker-and-test,run}/`.

Wave-of-subagent dispatch worked well — one subagent per SDK, ran 3-4 min each in parallel. Go was done myself first as the template.

### Broken link cleanup after hello_world

Build surfaced markdown links pointing at the now-deleted MDX paths (`(hello_world_in_X/index.md)` and `(/getting_started/X/hello_world_in_X/index.md)`). Bulk-rewrote them to `pathname:///getting_started/<sdk>/hello_world_in_<sdk>/` via sed in `docs/getting_started/*/index.md` and `docs/tutorials/<sdk>/*/index.md`.

## Infrastructure tutorials

3 tutorials sharing ~70% identical content (Introduction, Prerequisites, Obtain binaries, Configure binaries, Register systemd). Built the baseline (`configuring-sqlite-binary`) myself as the template, then dispatched 2 subagents in parallel for `nginx-sqlite-binary` and `envoy-sqlite-binary` (the Envoy YAML is ~130 lines, escaped into a JS template-literal constant).

- `/tutorials/infrastructure/` — landing with 3-card grid + infra banner
- `/tutorials/infrastructure/configuring-sqlite-binary/` — baseline (no proxy)
- `/tutorials/infrastructure/nginx-sqlite-binary/` — Nginx reverse proxy
- `/tutorials/infrastructure/envoy-sqlite-binary/` — Envoy edge proxy

Decision: did NOT deduplicate the shared sections across the three pages, even though the user asked about it. Sectional TOC already serves the linear reading, and these are reference-style docs (people jump to YAML blocks) rather than read-it-once tutorials.

## AI tutorials (4 series, ~12,000 lines of MDX → 15 React pages)

Survey first: 3 of 4 AI tutorials were already physically multi-chapter (`01-`, `02-`, `03-` subdirs); `durable-ai-agent` was a single 6132-line MDX that needed splitting.

Dispatched 4 parallel subagents (one per series). The `durable-ai-agent` subagent got a 4-chapter split spec with exact line ranges:
- Ch1: Setup + toolkit (lines 15-1124)
- Ch2: Define agent behavior (lines 1125-2954)
- Ch3: Workflow & Worker (lines 2955-5089)
- Ch4: Run and observe (lines 5090-6132)

Output:
- `/tutorials/ai/` — landing with 4-card grid for the series
- `/tutorials/ai/building-durable-ai-applications/` — series landing + 2 chapter pages
- `/tutorials/ai/building-mcp-tools-with-temporal/` — series landing + 2 chapter pages
- `/tutorials/ai/deep-research/` — series landing + 3 chapter pages
- `/tutorials/ai/durable-ai-agent/{,agent-behavior,workflow,run}/` — 4 chapter pages from the original monolith

Images moved to `static/img/tutorials/ai/durable-ai-agent/`. AI banner reused across all chapters: `/img/banners/ai-tutorials-banner.png`.

## All other SDK + Nexus tutorials (~20 tutorials)

Survey:
- 5 SDKs (Go/Java/Python/TypeScript/PHP) with project tutorials + Nexus
- 5 multi-chapter tutorials (background-check in 4 SDKs + typescript/work-queue-slack-app)
- 14 single-page tutorials
- 1 missed Nexus tutorial (caught after the first sweep)

Approach: I converted all 6 SDK landing pages myself (small ~80-line React pages each with card grids), then dispatched 5 parallel subagents (one per SDK) for the tutorials. Each subagent handled all its SDK's tutorials including multi-chapter splits.

Per-SDK output:
- Go: landing + 3 single-pages (audiobook, build-an-ecommerce-app, build-an-email-drip-campaign) + multi-chapter background-check (landing + introduction/project-setup/durable-execution)
- Java: landing + 2 single (audiobook, build-an-email-drip-campaign) + multi-chapter background-check
- Python: landing + 4 single (geocoding-app, build-a-data-pipeline, build-an-email-drip-campaign, trip-booking-app) + multi-chapter background-check
- TypeScript: landing + 3 single (build-choose-your-own-adventure-bot, build-one-click-order-app-nextjs, recurring-billing-system) + 2 multi-chapter (background-check, work-queue-slack-app)
- PHP: landing + 2 single (build_a_trip_booking_app, build-a-recurring-billing-app)
- Nexus: landing + the missed sync-nexus-tutorial (1014 lines)

Total: ~58 tutorial React pages across all SDKs.

### Nexus tutorial gotcha

First sweep missed `docs/tutorials/nexus/sync-nexus-tutorial.md` because the initial survey only listed directories — the file was a flat MDX at the same level as `nexus/ui/`. URL slug is `nexus-sync-tutorial-java` (from frontmatter `id`), not `sync-nexus-tutorial`. Special considerations on the port:
- `IframeAutoResize` MDX export → ported as an in-file React component using `useEffect`
- Author / editor byline `<p>` preserved
- Interactive iframes at `static/html/nexus-decouple.html` etc.
- 11 SVG/PNG diagrams from `docs/tutorials/nexus/ui/` moved to `static/img/tutorials/nexus/`
- `tutorials.js` archetype link updated from the placeholder `/tutorials/nexus/` to `/tutorials/nexus/nexus-sync-tutorial-java/`

## Course conversions

Inventory: 8 courses total — 6 multi-SDK + 2 single-page.

Built `src/components/hub/CourseLandingPage/CourseLandingPage.js` as the reusable component (variant of `StepPage`: HubHero + duration line + SdkPicker + outcomes + audience + NotifyBanner). One subagent then converted all 38 course pages:

- 6 multi-SDK course landings (using `CourseLandingPage` with `sdkTargets`)
- 2 single-page courses (worker_versioning, intro_to_temporal_cloud — standalone pages mimicking CourseLandingPage but with a centered `MagentaCta` to TalentLMS instead of a SdkPicker)
- 29 per-SDK course detail pages (`/courses/<course>/<sdk>.js`) — each is a hub-styled enrollment page with SDK banner, MetaChips (duration · Free · SDK), Description, Outcomes, Prerequisites, and a magenta "Go to course" CTA to the per-SDK TalentLMS course ID

All TalentLMS enrollment URLs preserved. Source `docs/courses/` deleted. The existing `/src/pages/courses/index.js` was left untouched.

### Course `topics` updates

User asked to expand category coverage on `/courses/` sidebar. Updated `COURSES` entries in `src/data/hub.js`:
- `temporal-102` topics: added `"resetting-workflow"` + `"testing"`
- `versioning` topics: added `"deployment"` + `"determinism"`
- `worker-versioning` topics: added `"determinism"`

## Misc UI fixes

- **Category sidebar count alignment** — `.optionLabel { flex: 1 }` was pushing counts to the far right; changed to `flex: 0 1 auto; min-width: 0` so the count sits next to the label with the existing 10px gap. Fixes the visual gap on long labels like "Workflow Cancellations".
- **Removed Code Exchange link** from the navbar in `docusaurus.config.js` per user request.
- **Renamed `Foundation / Intermediate / Advanced` → `Foundation / Building / Production`** in the "Find your learning path" teaser on `/courses/`. Also reworded `/paths/` hero body + section subtitle to use the new vocab.
- **Removed Build Durable AI Agents path** from `/paths/`:
  - Deleted `src/pages/paths/ai.js`
  - Removed the AI path entry from `PATHS` in `src/data/hub.js`
  - Repointed stale `/paths/ai` references in `src/pages/ai/index.js` and `src/pages/tutorials/ai/durable-ai-agent/run/index.js` to `/tutorials/ai`
- **`/ai/` magenta CTA**: changed from "Take the AI Developer path" → "Explore Temporal for AI", URL flipped from `/tutorials/ai` to `https://temporal.io/solutions/ai`.
- **Coming soon button** on `/paths/foundation-complete/` "Claim a Temporal shirt" — converted the `<a>` to a `<span>` with `aria-disabled="true"` and a `[aria-disabled]` CSS rule (uppercase letter-spacing, no hover state). Same pink box, just non-clickable.
- **Federated search idea** — user wanted to make the hero search meaningful by searching across learn.temporal.io + YouTube (Temporalio) + temporal.io/blog + docs (via Algolia). I drafted an architecture (build-time JSON index + client-side Fuse.js fuzzy search, with each source pulled at build time). User shared a **Gemini API key in chat** — I flagged it as compromised and recommended rotation. User then said "just scrap it, remove the search bar entirely." Final fix: pass `showSearch={false}` to `HubHero` in `src/components/hub/Home/Home.js`. No federation built.

## Temporal 101 free preview (the big new feature)

Goal: ungate the "Understanding Workflow Execution" module from Temporal 101 — first dose on learn.temporal.io with no signup, rest stays on TalentLMS. Source content lives in `temporalio/edu-101-<sdk>-content` repos (public). User scoped to 2 lessons: `about-this-example` + `code-walkthrough`.

### Implementation

**6 parallel subagents**, one per SDK. Each:
1. Used `gh api` to fetch `understanding-workflow-execution/about-this-example.md` + `code-walkthrough.md` from `edu-101-<sdk>-content`
2. Moved `src/pages/courses/temporal_101/<sdk>.js` → `src/pages/courses/temporal_101/<sdk>/index.js` (must restructure because we're nesting lesson routes underneath)
3. Updated the moved file: added a lilac "Free preview available" pill above the `<h1>`, swapped the primary CTA to `<MagentaCta to=".../about-this-example/">Start the free preview</MagentaCta>`, demoted the TalentLMS link to a small text link below
4. Created 2 lesson pages at `understanding-workflow-execution/about-this-example/index.js` and `understanding-workflow-execution/code-walkthrough/index.js`

Lesson page structure: `nd-hub-page` wrapper, SDK banner, sticky TOC sidebar, breadcrumb, h1, MetaChips (`["Free preview", "Temporal 101", <SDK>]`), `TutorialStepper` showing the 2 lessons, content sections, chapterNav at bottom. The last free lesson (code-walkthrough) ends with a full-width "You've finished the free preview" magenta CTA card linking out to the per-SDK TalentLMS course.

**Code-walkthrough lesson**: the source MDX has a YouTube `<iframe>` + a `<details><summary>` transcript block. Both ported into JSX (camelCase attrs, `wmode=transparent` stripped, wrapped in `<div style={{ maxWidth: "1040px", aspectRatio: "1040/585", margin: "24px auto" }}>` for responsive sizing).

### Free Preview discovery surfaces

- **`/courses/`** — `CourseCard` for Temporal 101 gets a lilac "Free preview" badge in the top-left of the thumbnail; CTA reads "Start the free premium or free course" (user's literal phrasing — flagged as possibly meaning "preview" but they confirmed the wording). Badge styles added to `src/pages/courses/courses.module.css`.
- **`/paths/foundation/`** — same badge via the shared `src/components/hub/CourseCard/CourseCard.js` (extended with `hasFreePreview` logic based on `slug === "temporal-101"`).
- **`/courses/temporal_101/`** — added `badge` prop to `CourseLandingPage` (forwarded to `HubHero`'s existing `eyebrow` prop) so the hero shows "FREE PREVIEW AVAILABLE". Picker subtitle updated to "The first module - Understanding Workflow Execution - is free in your browser. The rest of the course runs on TalentLMS. Pick your SDK to start the free preview."

### Per-SDK CTA layout

After ship, user asked to convert the secondary "Or go directly to the full course on TalentLMS →" text link into a second magenta button reading "Start Free Course". Both buttons now sit side-by-side in a flex container (`gap: 12px`, `flexWrap: "wrap"`) on all 6 per-SDK course detail pages. Python's layout was slightly different (the link `<p>` lived outside the `<div>` wrapper instead of inside) and needed a separate edit.

### Image path fix

The lesson pages initially referenced images via absolute URLs like `https://learn.temporal.io/courses/temporal-101/go/chapter_09/...`. In local dev this hits prod CDN. Plus Go's images actually live at `understanding-workflow-execution/` locally (newer naming convention), not `chapter_09/`. Fixed all 6:
- Go: `IMG_BASE = "/courses/temporal-101/go/understanding-workflow-execution"` (the actual local path)
- Java/Python/TypeScript/.NET: `IMG_BASE = "/courses/temporal-101/<sdk>/chapter_09"` (where their images already live)
- Ruby: `IMG_BASE = "/courses/temporal-101"` with the references nested into `common/chapter_09/` and `ruby/chapter_09/`

All images verified to exist locally. Build passes.

### Known bug in Ruby source

`edu-101-ruby-content/understanding-workflow-execution/about-this-example.md` references `ruby/chapter_09/workers-and-tasks.png` for the third image (where it should be a Ruby-specific Commands diagram). The source markdown is wrong — flagged but not fixed (would need a fix in the upstream content repo).

## Files added in this session

**Reusable components:**
- `src/components/hub/CourseLandingPage/CourseLandingPage.js` — SDK-picker landing for courses with optional `badge` prop forwarded to HubHero `eyebrow`

**Routes added:**
- All `/getting_started/<sdk>/hello_world_in_<sdk>/{,worker-and-test,run}/` (5 SDKs × 3 chapters + PHP single page = 16)
- `/tutorials/infrastructure/{,configuring-sqlite-binary,nginx-sqlite-binary,envoy-sqlite-binary}/` (4)
- `/tutorials/ai/` + all 4 series with their chapter pages (15)
- `/tutorials/{go,java,python,typescript,php,nexus}/` landings + all SDK-tutorial chapter pages (~58)
- `/tutorials/nexus/nexus-sync-tutorial-java/` (1)
- `/courses/<course>/` landings (8) + per-SDK detail pages (29)
- `/courses/temporal_101/<sdk>/understanding-workflow-execution/{about-this-example,code-walkthrough}/` (12)

Total: ~145 new React routes.

## Key strategic decisions

- **Multi-chapter splits**: only when the underlying content has a natural arc (hello_world IP-geo, AI series), or the page is genuinely too long (durable-ai-agent at 6132 lines). Infra tutorials stayed single-page because they're reference-oriented.
- **Federated hero search**: scrapped after the user pointed out that the existing top-right search + bottom-right Ask AI chat icon already covered keyword search and conversational search. Removing the hero input entirely was the cleanest move.
- **Free preview scope**: 2 lessons × 6 SDKs = 12 pages. Keeps TalentLMS for the deeper material + certificate, but eliminates the signup wall on the first dose.
- **No quizzes/analytics in free preview**: per user instruction; they said TalentLMS account creation is the only conversion step they care about.
- **Source content sync**: free preview lesson pages are frozen snapshots of `edu-101-<sdk>-content` markdown. No live include. If upstream content changes, need to re-port. Noted as a TODO.

## Known TODOs from this session

- **Ruby source bug**: third image in Ruby's `about-this-example` is wrong (duplicates the second). Needs upstream fix in `edu-101-ruby-content`.
- **Free preview content sync**: 12 lesson pages are frozen at the moment of porting. Periodic re-sync needed.
- **CTA wording**: `/courses/` Temporal 101 card says "Start the free premium or free course" — flagged that "premium" probably should be "preview" but the user confirmed the wording.
- **`/tutorials/nexus/`** has the placeholder nexus.ui/ asset folder that may be re-added in `docs/` if a future Nexus tutorial gets imported. Currently `docs/tutorials/` is empty except for `_index.md`.
- **Source MDX entirely deleted** from `docs/tutorials/`, `docs/courses/`, `docs/getting_started/<sdk>/{first_program,dev_environment,hello_world}/`. Anyone editing content needs to know it lives in `src/pages/` now.
- **Several pre-existing slug case-sensitivity issue** with `Production-Grade-developer` from the earlier session still unresolved.
