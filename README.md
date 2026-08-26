# Prism

A Higgsfield-like **AI image and video generation studio** — UI prototype only. Every run is mocked: short delays, bundled cinematic stills and looping clips, and credits that live in `localStorage`. No provider APIs, no auth, no payments.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Production build:

```bash
npm run build
npm start
```

## What you can do

- Switch **Image / Video**, pick a model (Flux 2, Seedream, SDXL, Wan, Seedance, Kling, LTX), set aspect ratio, and generate.
- Watch jobs move **queued → generating → done** on the board.
- Open a result lightbox. On stills, **Use as video input** attaches the frame to the video composer.
- Image (`/image`) and Video (`/video`) deep-link into Generate with that mode selected. Library (`/library`) lists everything.

Jobs and remaining credits persist in the browser. The user menu **Reset demo** restores the seed gallery and 1,240 credits.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui. The model catalog lives in `src/lib/models.ts` so a real provider router can replace the mock loop later.
