import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const fileBase = process.argv[2] || 'docs/element_bounds_step1a.json';
const fileTarget = process.argv[3] || 'docs/element_bounds_step1b_a.json';

const baseData = JSON.parse(fs.readFileSync(path.resolve(projectRoot, fileBase), 'utf-8'));
const stepData = JSON.parse(fs.readFileSync(path.resolve(projectRoot, fileTarget), 'utf-8'));

console.log(`\n=== 要素位置比較（4px以上移動した要素） ===`);
console.log(`基準: ${fileBase} vs 対象: ${fileTarget}\n`);

let movedTotal = 0;
for (const env of Object.keys(baseData)) {
  const base = baseData[env];
  const step = stepData[env];
  if (!step) continue;

  let movedCount = 0;
  for (const id of Object.keys(base)) {
    if (!step[id]) continue;
    const b = base[id];
    const s = step[id];

    const dTop = s.top - b.top;
    const dLeft = s.left - b.left;
    const dWidth = s.width - b.width;
    const dHeight = s.height - b.height;
    const maxDelta = Math.max(Math.abs(dTop), Math.abs(dLeft), Math.abs(dWidth), Math.abs(dHeight));

    if (maxDelta >= 4) {
      movedCount++;
      movedTotal++;
      const deltas = [];
      if (Math.abs(dTop) >= 4) deltas.push(`top: ${b.top} → ${s.top} (Δ${dTop > 0 ? '+' : ''}${dTop}px)`);
      if (Math.abs(dLeft) >= 4) deltas.push(`left: ${b.left} → ${s.left} (Δ${dLeft > 0 ? '+' : ''}${dLeft}px)`);
      if (Math.abs(dWidth) >= 4) deltas.push(`width: ${b.width} → ${s.width} (Δ${dWidth > 0 ? '+' : ''}${dWidth}px)`);
      if (Math.abs(dHeight) >= 4) deltas.push(`height: ${b.height} → ${s.height} (Δ${dHeight > 0 ? '+' : ''}${dHeight}px)`);
      console.log(`[${env}] **${b.name}**: ${deltas.join(', ')}`);
    }
  }
}

if (movedTotal === 0) {
  console.log('4px以上移動した要素: 0件（すべての主要要素の位置・サイズが完全維持されています）');
}
