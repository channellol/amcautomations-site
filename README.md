# amc.automations

A free template library: 60 practical automation guides across agent teams, tools & repos, Claude Code, prompting, and build & sell.

Every guide includes how it works, a copy-paste prompt or config, step-by-step build, runnable code, the repos it uses, and an honest note on where it breaks.

## Run locally

It's a single static file.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Works as-is on GitHub Pages, Netlify or Vercel — no build step.

## Status

- Email and waitlist forms are not connected to an endpoint yet.
- Guide code has not been run end to end; test each script with your own keys before relying on it.

## Email gate

Every guide shows a free preview: the intro, the flow diagram, "What this does" and "Why it works". The rest — the paste-ready prompt, the build steps, the code, the failure notes — is behind one email, and one email unlocks all guides.

The unlock is remembered per browser (`localStorage`, key `amc_email`) and the address is written to the existing Supabase `leads` table as `kind: "unlock"`. If that write fails, the reader is still let through.
