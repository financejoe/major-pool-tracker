# Major Pool Tracker

A self-hosted golf pool tracker. Each visitor enters their own picks, picks save automatically to the cloud keyed to a URL they can bookmark and use across devices. No accounts, no email, no friction.

## Files

```
.
├── index.html                       Static frontend (the tracker UI)
├── functions/
│   └── api/
│       └── picks/
│           └── [id].js              Cloudflare Pages Function: GET/PUT /api/picks/:id
└── README.md
```

## Deployment

### 1. Create a Cloudflare account

Sign up at https://dash.cloudflare.com/sign-up. Free tier is sufficient.

### 2. Create a KV namespace

In the Cloudflare dashboard:

1. Go to **Storage & Databases** → **KV**.
2. Click **Create instance**.
3. Name it `PICKS`. Leave defaults. Create.

### 3. Push this folder to a GitHub repo

Create a new repo on GitHub, push these three files to it. The repo can be public or private.

### 4. Connect the repo to Cloudflare Pages

1. In the dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare to access your GitHub, pick the repo.
3. Build settings: leave everything blank (framework preset: None, build command: empty, output directory: `/`). This is a static site.
4. Click **Save and Deploy**. First deploy takes about a minute.
5. Note your URL, something like `major-pool-tracker.pages.dev`.

### 5. Bind the KV namespace to the Pages project

1. Open the Pages project you just created.
2. Go to **Settings** → **Bindings** (or **Functions** → **KV namespace bindings** on older dashboards).
3. Add a binding:
   - Variable name: `PICKS`
   - KV namespace: select the `PICKS` namespace you created in step 2.
4. Save.
5. Redeploy: go to **Deployments**, click the three dots on the latest deployment, choose **Retry deployment**. The binding only takes effect on a fresh deploy.

That's it. Visit your URL. The app should load with an empty roster, pick something, refresh the page, and your picks should still be there.

### 6. (Optional) Custom domain

In the Pages project, **Custom domains** → **Set up a custom domain**. Point a CNAME from your domain to the `*.pages.dev` URL. Cloudflare handles SSL automatically.

## How identity works

When someone visits the bare URL, the app generates a 16-character random ID, puts it in the URL hash (`#t=abc123...`), and saves their picks under that ID. They can bookmark the URL or share it across devices. The hash never reaches the server, so the ID functions like a Google Docs share link: anyone with the link can see and edit that record, nobody else can guess it (16 hex chars = 64 bits of entropy).

If they visit the bare URL again on the same browser, the app reuses the last ID from localStorage. To start fresh, clear site data or open in incognito.

## Sharing with others

Just send people your site's URL (without the hash). Each visitor gets their own tracker. They bookmark their own URL to return.

## Local testing without deployment

You can open `index.html` directly in a browser to verify the picker UI works. The app detects `file://` and falls back to localStorage-only mode (no cloud sync). The sync status indicator will show "Local only" so you know.

For a more faithful local test with the Pages Function, install Wrangler (`npm install -g wrangler`) and run:

```
wrangler pages dev .
```

This serves the site at http://localhost:8788 with the Function active. KV in local dev uses a local SQLite simulation by default.

## Limits worth knowing

- Cloudflare Pages free tier: 500 builds per month, unlimited requests, unlimited bandwidth.
- Workers KV free tier: 100k reads per day, 1k writes per day, 1 GB storage. A single user's picks JSON is well under 5 KB, so storage is effectively unlimited for any reasonable number of users.
- Payload cap in the Function: 50 KB per write. Hardcoded in `[id].js`. Bump if you ever need more.

## Data model

A single record per user ID, stored under KV key `user:<id>`:

```json
{
  "pools": [
    { "id": "p1", "name": "Pool A", "size": 4 },
    { "id": "p2", "name": "Pool B", "size": 6 }
  ],
  "mcPenalty": 10,
  "refreshSeconds": 180,
  "selectionsByEvent": {
    "401811947": { "p1": ["10140", "6937"], "p2": [...] }
  },
  "lastFetch": 1747234567890
}
```

Event IDs come from ESPN. The `selectionsByEvent` map preserves picks across tournaments, so revisiting an old event shows what you had selected at the time.

## When something breaks

If the ESPN feed format changes, normalization lives in `processData()` in `index.html`. That's the function to update.

If you want to swap data providers (DataGolf, SportsDataIO) later, replace the `fetchScoreboard()` call and adapt `processData()` to the new shape. The rest of the app is provider-agnostic.
