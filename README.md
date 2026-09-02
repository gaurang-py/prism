# Prism

AI image and video studio. Logged-out visitors see a cinematic marketing landing. Signed-in users land in a Krea-style Home hub. Generate uses Higgsfield-like chrome with a lime dock. Jobs are persisted in **Postgres**, belong to the signed-in **User**, processed by a **pg-boss worker**, generated on **Google (Gemini + Veo)** or **Fal.ai** depending on the model, and stored in **Cloudflare R2** under `generations/` for 7 days.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/` | Logged out | Marketing landing (lime / `#080908`): sticky promo bar + nav, hero with studio mock + generate dock, showcase carousel, image→video lab, pain points, model picker, three steps, use-cases, compare, 18+ NSFW, Built in India, Free ₹0 / Creator credits pricing, FAQ, final CTA. |
| `/` | Logged in | Redirects to `/home`. |
| `/home` | Signed in | In-app Home hub: looping cheapest-video hero (LTX 2), hover-to-play video cards, Image / Video / NSFW filters, NSFW opt-in toggle. |
| `/generate`, `/image`, `/video` | Signed in | Studio: Image \| Video tabs, empty board until jobs exist, bottom dock. No marketing hero. |
| `/history` | Signed in | That user's jobs that have not expired. |
| `/profile` | Signed in | Name, bio, avatar. |
| `/credits` | Signed in | Stripe Checkout packs. |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Anyone | Auth. Default return path is `/home`. Landing CTAs go to signup with **100 welcome image credits**. Using the landing dock while logged out goes through signup, then `/generate` with the prompt preserved. |

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
| `GOOGLE_API_KEY` | Gemini API key ([AI Studio](https://aistudio.google.com/apikey)); `GEMINI_API_KEY` is accepted as an alias. Serves the Nano Banana and Veo models. Image and video generation are **not on the Gemini free tier** — the project behind the key needs billing on, or every Google run fails with a quota error. |
| `FAL_KEY` | Fal.ai API key. Serves the Flux / Seedream / Wan / Kling / LTX / NSFW models. If missing, jobs **fail** with a readable error — they do not fake-complete. |
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

Signup creates a `User` (name from the form, **100 welcome image credits**). Session cookie `prism_session` is httpOnly. Generate and `POST /api/jobs` require a session.

Anonymous visitors on `/` can use the generate dock: Prism stores the prompt in `sessionStorage` and sends them to `/signup?next=/generate?…`. After signup they land in the studio with the prompt filled. Lime **Claim 100 Free Credits** / **Create My First Image** CTAs sign them up into `/home`.

Forgot password stores a hashed token + expiry on the user and shows `/reset-password?token=`. If `RESEND_API_KEY` and `SMTP_HOST` are both empty, the reset URL is **logged to the server console** so local dev still works. The token/DB/UI path is never skipped.

### 4. Stripe credits (test mode)

Packs are defined in `src/lib/credit-packs.ts` (Starter 200 / $9, Studio 1000 / $39, Pro 5000 / $149). The marketing landing prices Free ₹0 (100 welcome credits) and shows Creator credits as coming soon. Checkout for paid packs lives on `/credits` after login.

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

## Providers

Every catalog entry in `src/lib/models.ts` declares a `provider`. `src/lib/providers/index.ts`
routes a job to that provider and asserts only *its* key, so a missing `FAL_KEY` never blocks a
Google run and vice versa.

| provider | key | mapping | returns |
| --- | --- | --- | --- |
| `google` | `GOOGLE_API_KEY` | `src/lib/providers/google.ts` | bytes (Veo Files URIs need the key to read) |
| `fal` | `FAL_KEY` | `src/lib/fal-map.ts` | a public CDN URL |

## Google model map

Catalog ids → Gemini API model ids (`src/lib/providers/google.ts`). These are the
**defaults** for both modalities — they lead the catalog.

| Catalog | Credits | Gemini model | Method |
| --- | --- | --- | --- |
| Nano Banana 2 | 6 | `gemini-3.1-flash-image` | `generateContent` |
| Nano Banana Pro | 12 | `gemini-3-pro-image` | `generateContent` |
| Nano Banana | 4 | `gemini-2.5-flash-image` | `generateContent` |
| Veo 3.1 Fast | 28 | `veo-3.1-fast-generate-preview` | `predictLongRunning` |
| Veo 3.1 | 72 | `veo-3.1-generate-preview` | `predictLongRunning` |
| Veo 3.1 Lite | 18 | `veo-3.1-lite-generate-preview` | `predictLongRunning` |

Constraints the API enforces, verified against it and encoded in the mappers:

- **Images** take all five studio aspect ratios unchanged, and `1K` / `2K` via `imageConfig.imageSize`.
  `responseModalities` is `["TEXT","IMAGE"]` because Nano Banana Pro reasons before it draws.
- **Veo** only accepts `16:9` and `9:16`, so `4:3`/`1:1` fold to landscape and `3:4` to portrait.
- **Veo** only accepts `durationSeconds` of 4, 6 or 8, so the dock offers exactly those
  for Veo models (see *Clip lengths* below). `veoDuration` still snaps 5/10 onto the
  nearest legal value, but only for jobs queued before per-model durations existed.
- **Veo** requires `sampleCount` of exactly 1, rejects `generateAudio`, and rejects
  `personGeneration: "allow_adult"` on the Developer API. Batches of >1 are issued as separate jobs.
- Veo is long-running: the worker polls the operation every 10s and gives up after 10 minutes.

## Clip lengths

There is no single list of video durations. Each video model declares its own in
`src/lib/models.ts`, and the dock, `POST /api/jobs` and the provider mappers all read
that one list — so the studio never offers a length the provider will reject.

| Model | Seconds |
| --- | --- |
| Veo 3.1 / Fast / Lite | 4, 6, 8 |
| LTX 2 | 6, 10 |
| Wan 2.6 / Seedance Fast / Kling 2.6 / Hunyuan Video | 5, 10 |

Asking for anything else returns a readable `400` naming what the model does support.

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

## Tests

```bash
npm test        # catalog + request-mapping unit tests, no network
npm run test:live   # sends the real production payloads to the Gemini API
```

`test:live` needs `GOOGLE_API_KEY`, and skips itself without one. Google validates a
request body **before** it checks quota, so a malformed payload comes back `400
INVALID_ARGUMENT` and a well-formed one comes back `429` on a project without billing.
The suite asserts the 429 — which is how the mappers stay verified against the real API
even on a free-tier key. With billing on, the same calls generate for real.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 6, PostgreSQL, pg-boss, Google Gemini API (`@google/genai`), Fal.ai, Cloudflare R2, Stripe Checkout, httpOnly sessions.
