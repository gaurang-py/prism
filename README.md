# Prism

AI image and video studio. Logged-out visitors see a cinematic marketing landing. Signed-in users land in a Krea-style Home hub. Generate uses Higgsfield-like chrome with a lime dock. Jobs are persisted in **Postgres**, belong to the signed-in **User**, processed by a **pg-boss worker**, generated on **Fal.ai**, and stored in **Cloudflare R2** under `generations/` for 7 days.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/` | Logged out | Marketing landing: full-bleed hero, the same generate dock as the studio, Explore-style Image/Video model cards, Sign up, quiet credit-pack teaser. Marketing nav only (Product, Pricing, Login, Sign up). |
| `/` | Logged in | Redirects to `/home`. |
| `/home` | Signed in | In-app Home hub: looping cheapest-video hero (LTX 2), hover-to-play video cards, Image / Video / NSFW filters, NSFW opt-in toggle. |
| `/generate`, `/image`, `/video` | Signed in | Studio: Image \| Video tabs, empty board until jobs exist, bottom dock. No marketing hero. |
| `/history` | Signed in | That user's jobs that have not expired. |
| `/profile` | Signed in | Name, bio, avatar. |
| `/credits` | Signed in | Stripe Checkout packs. |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Anyone | Auth. Default return path is `/home`. Using the landing dock while logged out goes through signup, then `/generate` with the prompt preserved. |

The in-app Home / Image / Video / History rail is **not** shown on the marketing landing.

## Local setup

### 1. Postgres

```bash
docker compose up -d
```

That starts Postgres 16 on `localhost:5432` (user/password/db: `prism`). Apply schema:

```bash
cp .env.example .env
# set AUTH_SECRET to a long random string, plus Stripe/Fal/R2 as needed
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
| `AUTH_SECRET` | HMAC secret for session cookies and password-reset tokens |
| `APP_URL` | Public origin for Stripe return URLs and reset links. Default `http://127.0.0.1:43123` |
| `FAL_KEY` | Fal.ai API key. If missing, jobs **fail** with a readable error — they do not fake-complete. |
| `R2_ACCOUNT_ID` | Cloudflare account id (informational; endpoint is what the SDK uses) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Bucket name, e.g. `prism-generations` |
| `R2_ENDPOINT` | S3 API endpoint, usually `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_BASE_URL` | Optional. If the bucket is public, object URLs are `{base}/{key}` instead of signed GETs |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` locally). Checkout **fails clearly** if this is empty — payments are not mocked. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`). Required for `/api/stripe/webhook` |
| `STRIPE_PRICE_STARTER` / `STUDIO` / `PRO` | Optional Stripe Price ids. If unset, Checkout uses `price_data` from `src/lib/credit-packs.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional. Not used for server Checkout Sessions |
| `RESEND_API_KEY` | Optional. Sends password-reset email via Resend |
| `MAIL_FROM` / `RESEND_FROM` | From address for Resend |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP fallback when Resend is unset |

Create an R2 API token with Object Read & Write on that bucket.

### 3. Auth and password reset

Signup creates a `User` (name from the form, **0 credits**). Session cookie `prism_session` is httpOnly. Generate and `POST /api/jobs` require a session.

Anonymous visitors on `/` can use the generate dock: Prism stores the prompt in `sessionStorage` and sends them to `/signup?next=/generate?…`. After signup they land in the studio with the prompt filled. The white **Start generating** CTA signs them up into `/home`.

Forgot password stores a hashed token + expiry on the user and shows `/reset-password?token=`. If `RESEND_API_KEY` and `SMTP_HOST` are both empty, the reset URL is **logged to the server console** so local dev still works. The token/DB/UI path is never skipped.

### 4. Stripe credits (test mode)

Packs are defined in `src/lib/credit-packs.ts` (Starter 200 / $9, Studio 1000 / $39, Pro 5000 / $149). The landing page shows a quiet teaser of those three packs. Checkout lives on `/credits` after login.

```bash
# in a separate terminal, from a machine with the Stripe CLI
stripe listen --forward-to http://127.0.0.1:43123/api/stripe/webhook
# paste the whsec_… value into STRIPE_WEBHOOK_SECRET
```

Then `STRIPE_SECRET_KEY=sk_test_…` and buy a pack on `/credits`. The webhook (`checkout.session.completed`) credits the user and is **idempotent on Stripe event id**. Without the secret key, Checkout returns a readable error.

### 5. Seven-day purge

Two layers, both required for generated media:

1. **Job row** — `expiresAt = createdAt + 7 days`. List/get APIs treat expired jobs as gone (404 / omitted from history).
2. **R2 object lifecycle** — expire prefix `generations/` after 7 days. Apply this on the bucket (Dashboard → R2 → bucket → Settings → Object lifecycle rules), or via [`docs/r2-lifecycle.json`](docs/r2-lifecycle.json).

**Avatars** are stored at `avatars/{userId}.{ext}` so the `generations/` lifecycle rule does **not** delete them.

Uploads (first frames) live under `generations/uploads/` and expire with generations.

## How a run works

1. Sign in (or complete signup from the landing dock). Generate dock `POST /api/jobs` with prompt, modality, model, aspect, resolution, duration, count, optional `firstFrameKey`.
2. API writes `Job` rows owned by the user (status `queued`), **debits `User.credits`**, and enqueues `prism-generate` on pg-boss.
3. Worker picks the job, calls Fal, downloads bytes, `PUT`s to R2 at `generations/{jobId}.{ext}`, marks the job `done`.
4. The board polls `GET /api/jobs` (scoped to that user) until `done` or `error`.
5. Image-to-video: attach a still (**Use as video input**) or `+` upload.

Insufficient credits return a readable error and **do not** create a job.

## NSFW (opt-in, adult only)

The catalog is **SFW by default**. NSFW models stay hidden until the signed-in user turns **NSFW on** (Home hub and Generate header). The first time, they must check an 18+ confirm; that flag is stored on `User.nsfwAgeConfirmed`. `POST /api/jobs` rejects NSFW model ids unless `User.nsfwEnabled` is true. Adult NSFW is in-scope. Child sexual content, anyone 17 or under, and “jailbreak” tooling are not.

SFW endpoints are not used as an NSFW bypass. Fal safety rejections (`has_nsfw_concepts` on a checker-on run, or a content-policy error) mark the job **error** with a readable message.

NSFW catalog (real Fal routes only):

| Catalog | Credits | Fal endpoint |
| --- | --- | --- |
| Flux Uncensored | 8 | `fal-ai/flux/dev` with `enable_safety_checker: false` |
| Pony V7 | 6 | `fal-ai/pony-v7` with `enable_safety_checker: false` |
| SDXL Uncensored | 4 | `fal-ai/fast-sdxl` with `enable_safety_checker: false` |
| Hunyuan Video | 28 | `fal-ai/hunyuan-video` with `enable_safety_checker: false` |

Cheapest **SFW video** in the catalog is **LTX 2** (16 credits). That model is the logged-in Home featured CTA.

## Fal model map

Catalog ids in `src/lib/models.ts` → endpoints in `src/lib/fal-map.ts`:

| Catalog | Fal endpoint |
| --- | --- |
| Flux 2 Schnell | `fal-ai/flux-2/turbo` |
| Flux 2 Dev | `fal-ai/flux-2` |
| Seedream 5 | `bytedance/seedream/v5/pro/text-to-image` |
| SDXL | `fal-ai/fast-sdxl` |
| Wan 2.6 | `wan/v2.6/text-to-video` / `wan/v2.6/image-to-video` |
| Seedance Fast | `bytedance/seedance-2.0/fast/text-to-video` / `.../fast/image-to-video` |
| Kling 2.6 | `fal-ai/kling-video/v2.6/pro/text-to-video` / `.../image-to-video` |
| LTX 2 | `fal-ai/ltx-2.3/text-to-video/fast` / `.../image-to-video/fast` |
| Flux Uncensored (NSFW) | `fal-ai/flux/dev` (`enable_safety_checker: false`) |
| Pony V7 (NSFW) | `fal-ai/pony-v7` (`enable_safety_checker: false`) |
| SDXL Uncensored (NSFW) | `fal-ai/fast-sdxl` (`enable_safety_checker: false`) |
| Hunyuan Video (NSFW) | `fal-ai/hunyuan-video` (`enable_safety_checker: false`) |

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 6, PostgreSQL, pg-boss, Fal.ai, Cloudflare R2, Stripe Checkout, httpOnly sessions.
