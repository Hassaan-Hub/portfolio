# Muhammad Hassaan — Portfolio

Live site: **https://hassaan-tau.vercel.app/**

A static, dependency-free portfolio built with plain HTML, CSS and JavaScript. No build
step, no framework, no bundler — open `index.html` and it runs.

## Structure

```
index.html                     markup, SEO meta, JSON-LD, all content
style.css                      dark/light theme, layout, responsive + motion rules
script.js                      theme, navigation, typewriter, filters, contact form
robots.txt                     crawler rules
sitemap.xml                    single-page sitemap
assets/
  cv/                          put the CV PDF here (see below)
  img/                         favicon.svg, og-image.png, og-image.svg
  projects/                    one cover image per project
```

## Before publishing

1. Add your CV as **`assets/cv/Muhammad_Hassaan_CV.pdf`**. Every CV button in the navbar,
   hero and footer points at that exact path, so the filenames must match.
2. The project cover images in `assets/projects/` are illustrated placeholders. Replace
   them with real screenshots when you have them (keep the same filenames, or update the
   `src` and `alt` text in `index.html`).
3. Update the contact form if you ever add a real backend. It currently opens the
   visitor's own email app via `mailto:` — nothing is sent to a server, and the page
   says so.

## Contact form

The form has no backend. On submit it validates the fields, then builds a `mailto:` link
to `hassaanali994@gmail.com` with the name, email and message pre-filled. The success
message tells the visitor their email app should be opening, and offers a direct mailto
link as a fallback.

## Editing content

- Text, project cards, skills and links: `index.html`
- Colours, spacing, breakpoints: the `:root` custom properties at the top of `style.css`
- Reveal animations are opt-in per element via the `reveal` / `reveal-stagger` classes.
  They only hide content when JavaScript is available, so the page stays fully readable
  without it.
- Everything respects `prefers-reduced-motion`.

## Deploying

Any static host works (Vercel, Netlify, GitHub Pages, Cloudflare Pages) — upload the
folder as-is. If you change the domain, update the `canonical` link, `og:url`, the
`sitemap.xml` and `robots.txt` entries, and the JSON-LD `url` in `index.html`.
