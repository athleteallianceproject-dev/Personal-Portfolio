# Arjun Bhardwaj Portfolio

A static site: no build step and no dependencies to install.

## Files
- `index.html`: the page (all copy lives here)
- `assets/js/site.js`: particles, DNA transitions, scroll timing, menu and app viewer
- `assets/js/`: Three.js, GSAP, ScrollTrigger and Lenis (bundled locally)
- `assets/img/`: logos, headshot, app screenshots, favicon and social image
- `assets/data/`: brain particle data (from the MNI ICBM152 template)

## Run locally
Open a terminal in this folder and run `python3 -m http.server 8000`, then visit http://localhost:8000.
(Opening index.html directly works for the layout, but the brain data needs a local server.)

## Deploy on Vercel
1. Go to vercel.com, sign in, click Add New, then Project.
2. Drag this whole folder in (or push it to a GitHub repo and import it).
3. Framework preset: Other. No build command. Output directory: the root.
4. Deploy. Add your custom domain under Settings, Domains.

## Before launch
- Social preview: once you have a domain, change the `og:image` and `twitter:image` values in `index.html` to the full URL, for example `https://yourdomain.com/assets/img/og-image.jpg`.
- Resume: to update it, replace `assets/Arjun-Bhardwaj-Resume.pdf` with a new file of the same name.
