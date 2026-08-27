# Prism

AI image and video studio. Home is a Krea-style hub; Generate uses Higgsfield-like chrome with a lime dock. Jobs are persisted in **Postgres**, processed by a **pg-boss worker**, generated on **Fal.ai**, and stored in **Cloudflare R2** under `generations/` for 7 days.

## Local setup

### 1. Postgres

```bash
docker compose up -d
```

That starts Postgres 16 on `localhost:5432` (user/password/db: `prism`). Apply schema:

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
```

`npm run dev` starts the Next app **and** the worker. You can also run them separately:

```bash
npm run dev:web      # Next on http://127.0.0.1:43123
npm run dev:worker   # pg-boss worker (tsx watch)
```

Production-style:

```bash
npm run build
npm start            # web only — still run `npm run worker` in another process
```

### 2. Environment variables

Copy `.env.example` to `.env`. Never commit real secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Default matches docker-compose: `postgresql://prism:prism@localhost:5432/prism` |
| `FAL_KEY` | Fal.ai API key. If missing, jobs **fail** with a readable error — they do not fake-complete. |
| `R2_ACCOUNT_ID` | Cloudflare account id (informational; endpoint is what the SDK uses) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Bucket name, e.g. `prism-generations` |
| `R2_ENDPOINT` | S3 API endpoint, usually `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_BASE_URL` | Optional. If the bucket is public (or you use a custom domain / r2.dev), object URLs are `{base}/{key}` instead of signed GETs |

Create an R2 API token with Object Read & Write on that bucket.

### 3. Seven-day purge

Two layers, both required:

1. **Job row** — `expiresAt = createdAt + 7 days`. List/get APIs treat expired jobs as gone (404 / omitted from history).
2. **R2 object lifecycle** — expire prefix `generations/` after 7 days. Apply this on the bucket (Dashboard → R2 → bucket → Settings → Object lifecycle rules), or via the S3-compatible lifecycle API using [`docs/r2-lifecycle.json`](docs/r2-lifecycle.json):

```json
{
  "rules": [
    {
      "id": "expire-generations-7d",
      "enabled": true,
      "prefix": "generations/",
      "expiration": { "days": 7 }
    }
  ]
}
```

Uploads (first frames) also live under `generations/uploads/` so they expire with the same rule.

## How a run works

1. Generate dock `POST /api/jobs` with prompt, modality, model, aspect, resolution, duration, count, optional `firstFrameKey`.
2. API writes `Job` rows (status `queued`), debits the local wallet, and enqueues `prism-generate` on pg-boss (Postgres-backed, no Redis).
3. Worker picks the job, calls Fal, downloads bytes, `PUT`s to R2 at `generations/{jobId}.{ext}`, marks the job `done`.
4. The board polls `GET /api/jobs` until `done` or `error`. Lightbox uses a short-lived signed GET (1 hour) unless `R2_PUBLIC_BASE_URL` is set.
5. Image-to-video: attach a still (**Use as video input**) or `+` upload. The file is stored on R2 and passed to Fal as the first frame.

Credits are a local `Wallet` row (`id = local`, starting 1,240). No auth, no Stripe. **Reset demo** restores credits only.

## Fal model map

Catalog ids in `src/lib/models.ts` → endpoints in `src/lib/fal-map.ts`:

| Catalog | Fal endpoint |
| --- | --- |
| Flux 2 Schnell | `fal-ai/flux-2/turbo` (Flux 2 turbo; closest current Fal route) |
| Flux 2 Dev | `fal-ai/flux-2` |
| Seedream 5 | `bytedance/seedream/v5/pro/text-to-image` (edit route if a reference is attached) |
| SDXL | `fal-ai/fast-sdxl` |
| Wan 2.6 | `wan/v2.6/text-to-video` / `wan/v2.6/image-to-video` |
| Seedance Fast | `bytedance/seedance-2.0/fast/text-to-video` / `.../fast/image-to-video` |
| Kling 2.6 | `fal-ai/kling-video/v2.6/pro/text-to-video` / `.../image-to-video` |
| LTX 2 | `fal-ai/ltx-2.3/text-to-video/fast` / `.../image-to-video/fast` |

If Fal rejects an input (duration, aspect, etc.), the job lands in `error` with Fal's message. There is no silent mock.

## Screens

- **Home** (`/`) — left rail (Home, Image, Video, History), featured card, Explore-style model grid.
- **Generate** (`/generate`, `/image`, `/video`) — Image \| Video tabs, empty board until jobs exist, bottom dock.
- **History** (`/history`) — persisted jobs that have not expired.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 6, PostgreSQL, pg-boss, Fal.ai, Cloudflare R2 (`@aws-sdk/client-s3`).
