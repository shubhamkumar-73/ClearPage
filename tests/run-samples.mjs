import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const samples = path.join(root, 'samples');
const output = path.join(root, 'results.csv');
const files = fs.readdirSync(samples).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
const escape = v => `"${String(v ?? '').replaceAll('"','""').replaceAll('\n',' ')}"`;
const rows = [['filename','success','legible','language','block_count','unclear_parts','error']];
if (!files.length) console.log('No sample images found in tests/samples. Add JPG, PNG, or WEBP images to run the smoke test.');
for (const file of files) {
  try {
    const b64 = fs.readFileSync(path.join(samples, file)).toString('base64');
    const res = await fetch('http://localhost:3001/api/transcribe', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({image:b64}) });
    const data = await res.json();
    rows.push([file, res.ok, data.legible, data.language, data.blocks?.length ?? 0, (data.unclear_parts || []).join('; '), data.error || '']);
    console.log(`${file}: ${res.ok ? 'OK' : 'FAILED'}`);
  } catch (e) { rows.push([file,false,'','','','',e.message]); console.error(`${file}: ${e.message}`); }
}
fs.writeFileSync(output, rows.map(row => row.map(escape).join(',')).join('\n') + '\n');
console.log(`Results written to ${output}`);
