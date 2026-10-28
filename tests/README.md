# Backend image smoke test
Put sample page photos (`.jpg`, `.jpeg`, `.png`, `.webp`) in `tests/samples/`, start ClearPage, then run `npm run test:images` from the repository root. The script calls the local transcription endpoint and writes `tests/results.csv`. Sample images are intentionally not included; use images you have permission to test and avoid sensitive documents.
