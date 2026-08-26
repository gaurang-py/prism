# Prism

A two-screen **AI image and video studio** — UI prototype only. Home is a Krea-style hub; Generate uses Higgsfield-like chrome with a bottom dock. Every run is mocked (short delays, bundled stills/clips, credits in `localStorage`). No provider APIs, no auth, no payments.

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

## Screens

- **Home** (`/`) — left rail (Home, Image, Video, History), featured card, and an Explore-style model grid (Flux 2, Seedream, SDXL, Wan, Seedance, Kling, LTX). Cards and rail items open Generate in the right mode.
- **Generate** (`/generate`, `/image`, `/video`) — Image | Video tabs, empty board until you run, bottom dock with prompt, attach, model, aspect, resolution, variation count, and a lime **Generate** button that shows credit cost.
- **History** (`/history`) — every mocked job.

Open a finished still and **Use as video input** to attach it as a first frame on the video dock.

Jobs and credits persist in the browser. The user menu **Reset demo** restores 1,240 credits and clears the board.

## Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui. Model catalog: `src/lib/models.ts`.
