# ClearPage architecture

## Request path

```text
User photo
  └─ Browser file input → Cropper → Canvas crop/downscale (≤1280 px, JPEG 85%)
       └─ POST /api/transcribe (local Express)
            └─ FIFO queue (one model call at a time)
                 └─ Ollama /api/chat (MODEL, JSON schema, num_ctx=4096, temperature=0.2, keep_alive=30m)
                      └─ JSON transcription → editable browser transcript
                           ├─ Original reader (layout-only by default)
                           ├─ POST /api/easier (explicit user action; 1–3 blocks per model call)
                           ├─ POST /api/summary (on demand)
                           └─ POST /api/hard-words (on demand)
```

## Components
- `client/src/main.jsx`: workflow, image handling, reader settings, local storage, speech synthesis, compare view, fidelity heuristic.
- `client/src/styles.css`: responsive design, reader typography, themes, focus styles, reduced motion, print rules.
- `client/public/manifest.webmanifest` and `sw.js`: installable PWA shell caching. `/api` calls are intentionally not cached.
- `server/index.js`: status check, queue, structured prompts/schemas, Ollama requests, error handling.
- `tests/run-samples.mjs`: backend smoke test for sample images and CSV output.

## Local processing and privacy
Image cropping/downscaling occurs in the browser. The browser sends the cropped image to the local Express service, which sends it to the configured local Ollama service. No remote AI endpoints are configured. Settings are stored in localStorage. No analytics or cookies are included. The app should be accessed via localhost or a secure origin for PWA and browser capabilities.

## Reliability notes
- `/api/health` checks Ollama and compares the configured model against installed tags.
- Calls are serialized through a FIFO promise queue.
- The backend uses Ollama's structured `format` schema and retries once if response content is invalid JSON.
- Model/API errors are returned to the UI rather than silently fabricating content.
- The browser fidelity check looks for numeric tokens and capitalized names from original text. It is a warning heuristic, not a semantic guarantee.

## Security notes
- The development server allows only local Vite origins through CORS. Production use should remain local-only unless a deliberate authentication/network threat model is added.
- Request bodies are capped by Express JSON parser. Image input is additionally length-checked.
- Do not forward port 3001 or Ollama's 11434 port to the public internet.
