# temporal-learning

The Temporal Learning site (https://learn.temporal.io). Docusaurus 2.4 static site for courses and tutorials.

## Repo layout

- `docs/courses/` - course content (MDX)
- `docs/tutorials/`, `docs/getting_started/`, `docs/examples/` - other learning content
- `static/courses/` - course assets (images, downloads)
- `src/components/`, `src/theme/`, `src/css/` - Docusaurus theme and React components
- `STYLE.md` - prose style guide (defer to this for anything not covered below)
- `CONTRIBUTING.md` - dev setup and PR flow

## Common commands

- `yarn start` - local dev server at localhost:3000
- `yarn build` - production build
- `yarn vale` - lint prose in `docs/`
- `yarn check_links` - validate links
- `yarn getsnips` / `yarn clearsnips` - insert/remove Snipsync code samples (run `clearsnips` before committing)

## Copy conventions

Defer to `STYLE.md` for general prose rules (capitalization of core terms, sentence-case headings, "you" over "we", etc.). The rules below are Temporal Learn additions and overrides.

**Capitalize (extends STYLE.md's list):** Nexus Endpoint, Nexus Service, Nexus Operation, Nexus Registry, Temporal Cloud, Temporal SDK.

**Punctuation:**

- No em dashes. Use ` - ` instead.
- No ellipsis in prose.
- Arrows (→) only in nav buttons and code/log strings.

**Accuracy:**

- Verify Temporal claims with the `mcp__temporal-docs__search_temporal_knowledge_sources` tool before committing.
- Cloud-only features must be qualified with "On Temporal Cloud, ..."
- Note self-hosted caveats where relevant.
- Caller Workflow is "blocked at the await point", not "suspended".

**Voice:** Direct and technical. No marketing qualifiers.

## Brand rules (applies to `src/`, theme components, and `*.css`)

**Corners:** `border-radius: 0` everywhere. Exceptions: animated dots and step number circles (`border-radius: 50%`), diagram nodes (exempt).

**Colors:** Always use `--nd-*` CSS variables. Never hardcode outside the CSS file.

Palette: UV `#444CE7`, Lilac `#7F86F1`, Space Black `#141414`, Off-White `#F8FAFC`.

**Buttons:** `background: var(--ifm-color-primary)` + `color: var(--ifm-background-color)`. Gives dark text in dark mode, light text in light mode.
