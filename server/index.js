import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const app = express();
const PORT = Number(process.env.PORT || 3001);
const MODEL = process.env.MODEL || 'gemma4:e2b';
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '12mb' }));

// A deliberately small FIFO queue: only one model call runs at a time.
let queue = Promise.resolve();
function serialized(task) { const next = queue.then(task, task); queue = next.catch(() => {}); return next; }
const options = { num_ctx: 4096, temperature: 0.2 };
async function ollama(pathname, init = {}) {
  const response = await fetch(`${OLLAMA_URL}${pathname}`, { ...init, signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response;
}
async function getStatus() {
  try {
    const tags = await (await ollama('/api/tags')).json();
    const models = (tags.models || []).map(m => m.name);
    const pulled = models.some(name => name === MODEL || name.startsWith(`${MODEL}:`) || MODEL.startsWith(`${name}:`));
    return { ok: pulled, ollamaRunning: true, model: MODEL, modelPulled: pulled, models, setupCommands: [`ollama serve`, `ollama pull ${MODEL}`] };
  } catch (error) {
    return { ok: false, ollamaRunning: false, model: MODEL, modelPulled: false, error: error.message, setupCommands: [`ollama serve`, `ollama pull ${MODEL}`] };
  }
}
app.get('/api/health', async (_req, res) => res.json(await getStatus()));

const schemas = {
  transcribe: { type: 'object', properties: { legible: { type: 'boolean' }, language: { type: 'string' }, blocks: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['heading','paragraph','list_item'] }, text: { type: 'string' } }, required: ['type','text'], additionalProperties: false } }, unclear_parts: { type: 'array', items: { type: 'string' } } }, required: ['legible','language','blocks','unclear_parts'], additionalProperties: false },
  easier: { type: 'object', properties: { blocks: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, text: { type: 'string' } }, required: ['type','text'], additionalProperties: false } } }, required: ['blocks'], additionalProperties: false },
  summary: { type: 'object', properties: { summary: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 } }, required: ['summary'], additionalProperties: false },
  hardWords: { type: 'object', properties: { hard_words: { type: 'array', maxItems: 8, items: { type: 'object', properties: { word: { type: 'string' }, simple_meaning: { type: 'string' } }, required: ['word','simple_meaning'], additionalProperties: false } } }, required: ['hard_words'], additionalProperties: false }
};
const systems = {
  transcribe: 'You are a careful transcriber. Copy the text in the image exactly, word for word, keeping headings, paragraphs and list items separate. Do not summarize, correct, translate or add anything. If part of the text is unreadable, list it in unclear_parts instead of guessing. If the image is blurry or has no text, set legible to false. Reply only in the JSON schema.',
  easier: 'You rewrite text so it is easier to read for people with dyslexia. Keep the same meaning and every fact. Keep all numbers, dates, names, units and warnings exactly as written. Use short sentences, common words, active voice and one idea per sentence. Keep technical terms but do not remove them. Do not add new information. Do not talk down to the reader. Light: only shorten and clarify long sentences. Medium: also replace rare words. Easy: simple words and very short sentences. Reply only in the JSON schema.',
  summary: 'Summarize the text in exactly 3 short, plain bullet points. Use only information in the text.',
  hardWords: 'Find at most 8 difficult words that appear exactly in the supplied text. Give a short, plain meaning for each. Do not include words that do not appear in the text. Reply only in the JSON schema.'
};
async function modelCall(kind, userContent) {
  const body = { model: MODEL, stream: false, format: schemas[kind], keep_alive: '30m', options, messages: [{ role: 'system', content: systems[kind] }, { role: 'user', ...userContent }] };
  const response = await ollama('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!data.message?.content) throw new Error('Ollama returned an empty response.');
  let parsed;
  try { parsed = JSON.parse(data.message.content); } catch {
    // Retry invalid JSON once, requesting a clean schema-conforming response.
    const retry = { ...body, messages: [...body.messages, { role: 'assistant', content: data.message.content }, { role: 'user', content: 'Your last response was invalid JSON. Return valid JSON only, matching the required schema exactly.' }] };
    const again = await (await ollama('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(retry) })).json();
    try { parsed = JSON.parse(again.message.content); } catch { throw new Error('The model returned invalid JSON twice. Please retry.'); }
  }
  return parsed;
}
app.post('/api/transcribe', async (req, res) => {
  const { image } = req.body || {};
  if (typeof image !== 'string' || !image || image.length > 11_000_000) return res.status(400).json({ error: 'Provide a cropped image as a base64 data URL or base64 string (max 8 MB decoded).' });
  const base64 = image.replace(/^data:image\/[^;]+;base64,/, '');
  try { const result = await serialized(() => modelCall('transcribe', { content: 'Transcribe the text in this image exactly.', images: [base64] })); res.json(result); }
  catch (e) { res.status(502).json({ error: e.message }); }
});
app.post('/api/easier', async (req, res) => {
  const { blocks, level = 'light' } = req.body || {};
  if (!Array.isArray(blocks) || !['light','medium','easy'].includes(level)) return res.status(400).json({ error: 'Provide blocks and a level: light, medium, or easy.' });
  try {
    const results = [];
    for (let i = 0; i < blocks.length; i += 3) {
      const batch = blocks.slice(i, i + 3);
      const out = await serialized(() => modelCall('easier', { content: JSON.stringify({ blocks: batch, level }) }));
      results.push(...out.blocks);
    }
    res.json({ blocks: results });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.post('/api/summary', async (req, res) => {
  const { text } = req.body || {}; if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Text is required.' });
  try { res.json(await serialized(() => modelCall('summary', { content: text }))); } catch (e) { res.status(502).json({ error: e.message }); }
});
app.post('/api/hard-words', async (req, res) => {
  const { text } = req.body || {}; if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Text is required.' });
  try { res.json(await serialized(() => modelCall('hardWords', { content: text }))); } catch (e) { res.status(502).json({ error: e.message }); }
});
const dist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html'))); }
app.listen(PORT, () => console.log(`ClearPage server: http://localhost:${PORT} (model ${MODEL})`));
