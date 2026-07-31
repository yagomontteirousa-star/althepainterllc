# Al The Painter LLC

Static, mobile-first marketing site prepared for GitHub and Vercel preview.

## Project structure

- `index.html` — the complete five-block landing page
- `styles.css` — visual system and responsive layout
- `script.js` — menu, scroll reveals, active navigation, the estimate form, and the auto-scrolling testimonial marquee
- `assets/images` — optimized WebP photography and social preview image
- `assets/logo` — faithful transparent logo exports derived from the supplied artwork
- `assets/originals` — untouched supplied source assets
- `vercel.json` — preview headers and asset caching

## Local preview

No build step or package installation is required.

```powershell
python -m http.server 4173
```

Open `http://localhost:4173`.

## GitHub → Vercel preview

1. Push the project root to a GitHub repository.
2. Import that repository in Vercel.
3. Use **Other** as the framework preset.
4. Leave the build command empty.
5. Leave the output directory as the project root.

`vercel.json` sends an `X-Robots-Tag: noindex, nofollow` header so the temporary Vercel preview does not compete with the live domain in search.

## Before the real launch

1. Remove the preview-only `X-Robots-Tag` header from `vercel.json`, or omit that file on the final host.
2. Confirm the final production origin before launch.
3. Confirm the online quote URL.
4. Recheck the service area, phone, business hours, and all testimonial permissions.
5. Submit `sitemap.xml` after the production URL is live.
