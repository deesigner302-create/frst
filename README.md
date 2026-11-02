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
npm run check      # verifies internal anchors, icon refs, assets and JS syntax
```

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
| `server.mjs` | Zero-dependency static file server |
| `scripts/check.mjs` | Lightweight link/asset/syntax smoke test |
| `assets/favicon.svg` | Favicon |

> This is a concept site. The product, companies, quotes and pricing are fictional, and forms don't send data anywhere.
