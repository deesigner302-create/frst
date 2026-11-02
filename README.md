# frst

A polished, dependency-free landing site for **frst** — a concept product that protects the first hour of your day by turning a brain dump into one calm, time-blocked morning plan.

## Run it

```bash
npm start          # http://localhost:3000
# or
PORT=8080 node server.mjs
```

No install step, no build step, no external network requests. `server.mjs` is a small Node static server that binds to `0.0.0.0` so it works in hosted preview environments. You can also open `index.html` directly or serve the folder with `python3 -m http.server`.

```bash
npm run check      # verifies links, assets, JS syntax and deploy output freshness
```

## Deploying

Static hosts need a publish directory. `netlify.toml` configures this repo to run `npm run build` and publish `build/`:

```toml
[build]
  command = "npm run build"
  publish = "build"
```

`npm run build` copies the browser-ready sources into `build/` (plus `_headers` and a small manifest). A fresh `build/` is **also committed to the repo**, so deploys succeed on hosts that skip the build command — the exact failure behind "Publish directory build does not exist".

```bash
npm run build                        # regenerate build/ after editing sources
PORT=3001 npm run preview            # serve exactly what gets published
```

`npm run check` compares `build/` against the sources and fails if it's stale, so a forgotten rebuild won't ship old files. No dependencies are installed during a build.

## What's in it

- **Responsive single page** — hero, social proof, problem, 3-step explainer, live demo, feature grid, testimonials, pricing, FAQ, final CTA and footer.
- **A working planner** — type tasks (or pick a preset) and it builds a real time-blocked schedule with estimated durations, a priority, and breathing-room buffers. Runs entirely client-side.
- **Pricing toggle** — monthly / yearly prices update in place.
- **Theme switcher** — dark and light palettes, persisted in `localStorage`.
- **Small interactions** — mobile menu, scroll-reveal animations, active nav highlighting, single-open FAQ accordion, newsletter validation, live date, scroll-aware header.
- **Accessibility** — semantic landmarks, skip link, keyboard-operable controls, visible focus states, `aria-live` results, reduced-motion support, and labelled icons.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and inline SVG icon sprite |
| `styles.css` | Design system, layout, themes, responsive rules |
| `app.js` | All interactivity (vanilla JS, no dependencies) |
| `server.mjs` | Zero-dependency static file server (`--dir=build` serves the output) |
| `scripts/build.mjs` | Copies sources into `build/` for publishing |
| `scripts/check.mjs` | Link/asset/syntax/build-freshness smoke test |
| `netlify.toml` | Deploy command and publish directory |
| `build/` | Committed deployable output (generated, don't edit by hand) |
| `assets/favicon.svg` | Favicon |

> This is a concept site. The product, companies, quotes and pricing are fictional, and forms don't send data anywhere.
