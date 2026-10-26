# Marmat.ai — Website

A responsive, white-and-blue landing page for **Marmat.ai**, a SaaS platform for construction companies and project teams.

## Files

| File          | Purpose                                   |
|---------------|-------------------------------------------|
| `index.html`  | Page structure and content                |
| `styles.css`  | White & blue theme, layout, responsiveness |
| `script.js`   | Mobile menu, scroll animations, contact form |
| `README.md`   | This file                                 |

## Run locally

Just open `index.html` in any modern browser. No build step or dependencies are needed (the Manrope font loads from Google Fonts).

## Customize

- **Colours:** edit the CSS variables at the top of `styles.css` (`--blue-*`, `--white`).
- **Text, plans and modules:** edit `index.html`.
- **Contact form:** `script.js` currently logs the submission to the console. Connect it to your backend, CRM or an email service (e.g. a `fetch()` call to your API endpoint).

## Deploy

Because it is plain static files, you can host it on any static host:

- AWS S3 + CloudFront (or EC2 with Nginx)
- Netlify, Vercel or GitHub Pages
- Any web server that serves the folder

Point the `marmat.ai` domain to your host and upload the four files.
