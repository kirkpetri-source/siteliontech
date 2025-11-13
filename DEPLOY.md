# Deploy Guide

This project is a SPA (React Router). To ensure deep links work in production, routing configs are included for common providers:

- Vercel: `vercel.json` with SPA rewrites
- Netlify: `public/_redirects` fallback to `index.html`

## Vercel (recommended)
- Import repo: `https://github.com/kirkpetri-source/siteliontech`
- Build command: `npm run build`
- Output directory: `dist`
- Environment Variables: add `VITE_*` (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Domains: add `www.liontechti.com.br` (and optionally `liontechti.com.br`)
- DNS options:
  - Keep DNS at registrar: set `CNAME www` → `cname.vercel-dns.com` and `A @` → `76.76.21.21`
  - Or use Vercel nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

## Netlify
- Build: `npm run build`
- Publish directory: `dist`
- Environment Variables: add `VITE_*`
- SPA: already configured via `public/_redirects`

## Cloudflare Pages
- Build: `npm run build`, Output: `dist`
- Enable "Serve Single-Page App" in project settings
- Add `VITE_*` Environment Variables

## Security
- `.env` is not versioned. Configure env vars in the host provider or in GitHub secrets.
- Review Supabase policies/keys before going to production.