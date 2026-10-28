# ClearPage

A calm, responsive, offline-first Progressive Web App that turns page photos into editable text and offers optional easier wording, summaries, hard-word explanations, and read-aloud. AI calls run against Ollama on the same computer. There are no cloud AI services, API keys, analytics, cookies, or telemetry in this project.

## Problem
Dense printed text can be hard to navigate when type is small, line spacing is tight, paragraphs are long, or sentences are complex. ClearPage lets readers control typography, listen to text, edit OCR-style transcription, and compare the author's words with optional rewritten wording.

## Solution
The default reading mode preserves the transcribed author's words and changes only presentation and audio. Rewriting is a separate, opt-in action, clearly labeled “Easier”. The original remains available and is shown beside the easier version for comparison. The app is a reading aid, not a diagnosis, treatment, or replacement for professional support.

## Features
- Mobile-first layout, image upload/camera input, crop/zoom, downscaling to a maximum 1280 px long edge, JPEG quality 85%.
- Local Gemma model through Ollama `/api/chat`; structured JSON schema per task; one queued model request at a time; one automatic retry for invalid JSON.
- Editable transcript before any optional rewrite.
- Light, medium, and easy rewrite modes, processed in batches of up to three blocks.
- Client-side fidelity check for potentially missing numbers, dates, and capitalized names, with the warning “Some details may have changed. Check the original.” This heuristic is intentionally conservative and is not a proof of fidelity.
- Original/easier side-by-side comparison, on-demand three-point summary and hard-word meanings.
- Reader controls: font family, size, letter and word spacing, line height, text width, cream/blue/dark themes, and a line-focus option.
- Browser-native speech synthesis with voice selection, speed, sentence highlighting, pause/resume, and stop. Text/audio are not sent to a server for speech.
- Local settings in `localStorage`; PWA shell caching; copy, `.txt` download, and print.
- Accessible labels, keyboard-focus styles, touch-size controls, reduced-motion support, left-aligned text, and no flashing.

## Setup

### Requirements
- Node.js 20 or newer and npm.
- [Ollama](https://ollama.com/download) installed locally.
- A local vision-capable Gemma model compatible with Ollama's image input. This project defaults to `gemma4:e2b` as requested; availability and tag spelling depend on your Ollama/model registry version. If the exact tag is not available, choose an installed, vision-capable Gemma model and set `MODEL` to its exact Ollama tag.

### Install and run
1. Install Ollama and open a terminal.
2. Start the Ollama service if it is not already running:
   ```sh
   ollama serve
   ```
   On systems where Ollama runs as a desktop/service app, simply open it instead.
3. Pull the configured model:
   ```sh
   ollama pull gemma4:e2b
   ```
4. In a second terminal, from this repository root:
   ```sh
   cp .env.example .env
   npm install
   npm --prefix server install
   npm --prefix client install
   npm run dev
   ```
5. Open `http://localhost:5173`. The setup panel checks Ollama and whether the configured model is present. Vite proxies `/api` requests to the backend in development.

For production build and local serving:
```sh
npm run build
npm start
```
Then open `http://localhost:3001`. Copy `.env.example` to `.env` and set `MODEL`, `OLLAMA_URL`, or `PORT` if needed. Do not expose the local backend to an untrusted network; CORS is restricted to the local Vite origins for development.

### 8 GB VRAM tips
- Start with a small Gemma model and close GPU-heavy apps before running ClearPage.
- Keep `num_ctx` at 4096 initially; long contexts and large images use more memory.
- ClearPage downsizes crops to 1280 px and sends one image per transcription call.
- Keep only one active Ollama request; ClearPage queues calls serially. If Ollama reports out-of-memory, use a smaller compatible model or reduce image size further.
- Model tags, VRAM usage, quantization, and vision support vary by Ollama release and GPU. Verify the exact model is compatible with your machine before relying on it.
- First inference may take time while the model loads. Ollama is configured to keep the model alive for 30 minutes.

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md). In brief: React/Vite PWA frontend → local Express API → Ollama `/api/chat`. Image cropping and downscaling run in the browser. Reading preferences are saved locally. AI endpoints are only called on explicit user actions.

## Responsible AI & limits
- Transcription can miss, alter, or misread printed text. The user can edit the transcript before continuing; unclear parts are surfaced rather than guessed where the model identifies them.
- Rewriting can alter meaning despite instructions. The fidelity check only flags a subset of potentially missing numbers, dates, and capitalized names; it can miss errors and can also flag harmless differences. Always compare against the original, especially for medical, legal, financial, safety, or educational material.
- Summaries and word meanings can be wrong or incomplete. They are generated only when requested.
- Browser speech synthesis depends on the device's locally available voices and browser. Voice availability varies. ClearPage sends no audio or speech text to a speech provider.
- PWA shell/offline reading works after the app has been loaded and cached. Local AI actions require the backend and Ollama to be running; a browser cannot run the Ollama model by itself.
- ClearPage does not diagnose dyslexia, treat any condition, or replace teachers, clinicians, accessibility specialists, or other professional support.
- Do not upload confidential documents to a computer you do not control. In this design, image bytes go only to the local backend on the same device.

## Attribution & licenses
- ClearPage application code: MIT License (see [LICENSE](LICENSE)).
- React, Vite, Express, `react-easy-crop`, and other dependencies retain their respective upstream licenses; see each package's metadata.
- Font family choices are exposed in the UI. The repository uses local font-face hooks in `client/src/styles.css`, but font binaries are not included in this source distribution. To bundle them, place licensed WOFF2 files in `client/public/fonts/` and add matching `@font-face` declarations. Recommended sources: OpenDyslexic (SIL Open Font License; verify the specific distribution), Lexend (SIL Open Font License), Atkinson Hyperlegible (SIL Open Font License). Keep the upstream license and attribution files beside each font. System sans-serif works without added files.
- Gemma is a Google model; follow the model-specific license/terms distributed with the model and Ollama. ClearPage does not bundle model weights.

## AI-assisted development disclosure
This project was drafted with AI assistance. Review, test, and adapt it before deployment; generated code and model outputs may contain mistakes.

## Team
Project: ClearPage. Team/author: add your team members and roles here before submitting or publishing.

## Tests
Add permitted sample page images to `tests/samples/`, start the app, then run:
```sh
npm run test:images
```
The script writes `tests/results.csv`. No sample images are included so you can use images you have permission to test.
