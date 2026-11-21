# Muhammad Hassaan — Portfolio

Live site: **https://hassaan-tau.vercel.app/**

A static, dependency-free portfolio built with plain HTML, CSS and JavaScript. No framework,
no build step required — open `index.html` and it runs. Vite is only there as a convenience
dev server / bundler for deployment.

## Structure

```
index.html                 markup, SEO meta, JSON-LD, all content
genai.html                 GenAI case study page — overview, features, tech, AI flow,
                           screenshot gallery and project links
style.css                  dark/light theme, layout, responsive + motion rules
script.js                  theme, navigation, typewriter, filters, lightbox, contact form
scripts/
  capture-projects.mjs     re-captures the live screenshots for every project card
  capture-genai-shots.mjs  re-captures the live screenshots for the GenAI app
assets/
  cv/                      Muhammad_Hassaan_CV.pdf (all CV buttons point here)
  img/                     favicon.svg, og-image.png, og-image.svg
  projects/                one WebP screenshot set per project (name-N.webp)
public/
  images/projects/genai/   genuine GenAI app screenshots: login, home, resume upload,
                           report, technical, behavioral and roadmap screens
```

## Project screenshots

Each project card shows a real screenshot of the deployed app inside a browser-chrome frame.
Cards with more than one image cross-fade through them on hover (a "live preview"), and
clicking a card opens a lightbox with all of its screens.

The images are generated, not hand-drawn:

```bash
npm install          # once
npm run shots        # capture every project
npm run shots -- hcm # capture a single project by slug
```

`scripts/capture-projects.mjs` drives the locally installed Chrome (via `puppeteer-core`, so
no browser download) at 1280×800 and writes `assets/projects/<slug>-N.webp`. Some projects are
behind a login, so the script signs in first:

- **HCM Lite** — real login with the demo admin account defined at the top of the script
- **MaintainIQ** — clicks the public demo account on the login screen

Add or reorder frames in the `SHOTS` array at the bottom of that file. After changing the
number of frames, update the matching `<img class="shot-frame">` tags in `index.html`.

## Before publishing

1. Keep **`assets/cv/Muhammad_Hassaan_CV.pdf`** in place — every CV button points at that path.
2. Re-run `npm run genai-shots` when the GenAI app changes — it recaptures 7 genuine
   screenshots of the deployed application into `public/images/projects/genai/`.
3. Re-run `npm run shots` whenever a project's live UI changes.
4. The contact form has no backend: it validates, then opens the visitor's own email app via
   `mailto:`. Nothing is sent to a server, and the page says so.

## Editing content

- Text, project cards, skills and links: `index.html`
- GenAI case study text, features, tech list and gallery: `genai.html`
- Colours, spacing, breakpoints: the `:root` custom properties at the top of `style.css`
- Reveal animations are opt-in per element via the `reveal` / `reveal-stagger` classes. They
  only hide content when JavaScript is available, so the page stays readable without it.
- Everything respects `prefers-reduced-motion` — the screenshot slideshow, marquee and
  typewriter all switch off.

## Deploying

```bash
npm run build     # → dist/
npm run preview   # sanity-check the build locally
```

Upload `dist/` to Vercel, Netlify, GitHub Pages or any static host. `base: './'` in
`vite.config.js` keeps the build portable to a sub-path.

> The site loads `script.js` as a classic script so `index.html` still works when opened from
> disk. Vite only bundles module scripts, so `vite.config.js` includes a tiny plugin that copies
> `script.js` into `dist/` — without it the build would ship a page with no JavaScript.

If you change the domain, update the `canonical` link, `og:url`, `sitemap.xml`, `robots.txt`
and the JSON-LD `url` in `index.html`.
