# ClearPage

**An offline-first, dyslexia-friendly reading assistant.**

ClearPage helps readers make printed text easier to read using image transcription, optional easier wording, summaries, hard-word explanations, and read-aloud.

## Features

- Upload or capture a page image.
- Convert image text into editable text using a local AI model.
- Compare original text with optional easier wording.
- Generate summaries and explain difficult words.
- Customize fonts, spacing, themes, and line focus.
- Read text aloud.
- Copy, download, and print text.
- Progressive Web App support.

## Requirements

- Node.js 20 or newer
- npm
- [Ollama](https://ollama.com/download)
- A compatible vision-capable local model

## Run locally

Copy `.env.example` to `.env`, then run these commands from the project root in separate terminal commands:

```bat
copy .env.example .env
npm install
npm --prefix server install
npm --prefix client install
ollama pull gemma4:e2b
npm run dev
```

Open `http://localhost:5173`.

Keep Ollama running so ClearPage can use the local AI model.

## Privacy

AI processing is designed to run locally through Ollama. The app is a reading aid, not a diagnosis or replacement for professional support.
