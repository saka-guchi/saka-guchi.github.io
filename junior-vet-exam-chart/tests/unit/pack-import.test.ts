import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { db } from '../../src/db';

describe('Content Pack ZIP Import & Verification Test', () => {
  const packZipPath = path.resolve(
    __dirname,
    '../../content-private/dist-pack/master100-pack-yasuda-2024-1.0.0.zip'
  );
  const hasLocalPack = fs.existsSync(packZipPath);

  it('verifies generated pack zip exists and is readable (when private pack is present)', () => {
    if (!hasLocalPack) {
      expect(true).toBe(true);
      return;
    }
    const stat = fs.statSync(packZipPath);
    expect(stat.size).toBeGreaterThan(100 * 1024); // 100KB以上
  });

  it('validates zip integrity, manifest, and SHA-256 checksums', async () => {
    let zipBuffer: Buffer | Uint8Array;
    if (hasLocalPack) {
      zipBuffer = fs.readFileSync(packZipPath);
    } else {
      const zip = new JSZip();
      const sampleQuestion = [{ id: 'q1', type: 'single_choice' }];
      const qBuf = Buffer.from(JSON.stringify(sampleQuestion));
      const qHash = crypto.createHash('sha256').update(qBuf).digest('hex');
      const manifest = {
        packId: 'pack-test-1.0.0',
        examId: 'test-2024',
        subjects: [{ subject: 'rika', questionCount: 1 }],
        files: [{ path: 'data/questions.json', sha256: qHash }]
      };
      zip.file('manifest.json', JSON.stringify(manifest));
      zip.file('data/questions.json', qBuf);
      zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    }

    const zip = await JSZip.loadAsync(zipBuffer);

    // 1. manifest.json の検証
    const manifestFile = zip.file('manifest.json');
    expect(manifestFile).not.toBeNull();

    const manifestText = await manifestFile!.async('text');
    const manifest = JSON.parse(manifestText);

    expect(manifest.packId).toBeDefined();
    expect(manifest.examId).toBeDefined();

    // 2. マニフェストに記載された各ファイルの SHA-256 ハッシュ照合
    for (const f of manifest.files) {
      const fileInZip = zip.file(f.path);
      expect(fileInZip, `File in zip missing: ${f.path}`).not.toBeNull();

      const contentBuffer = await fileInZip!.async('nodebuffer');
      const actualHash = crypto.createHash('sha256').update(contentBuffer).digest('hex');
      expect(actualHash, `SHA-256 mismatch for ${f.path}`).toBe(f.sha256);
    }
  });

  it('imports data into Dexie (IndexedDB) and retrieves questions', async () => {
    let manifest: any;
    let questions: any[];

    if (hasLocalPack) {
      const zipBuffer = fs.readFileSync(packZipPath);
      const zip = await JSZip.loadAsync(zipBuffer);
      manifest = JSON.parse(await zip.file('manifest.json')!.async('text'));
      questions = JSON.parse(await zip.file('data/questions.json')!.async('text'));
    } else {
      manifest = { packId: 'pack-test-1.0.0', examId: 'test-2024' };
      questions = [{ id: 'test-q1', title: 'Test Q' }];
    }

    // IndexedDBへ格納
    await db.contentPacks.put({
      examId: manifest.examId,
      manifest,
      questions,
      answers: [],
      figures: [],
      skills: [],
      skillDependencies: [],
      practice: [],
      transfer: [],
      integrated: [],
      stage2: [],
      regions: [],
      images: {},
      importedAt: Date.now(),
    });

    // IndexedDBから取得確認
    const stored = await db.contentPacks.get(manifest.examId);
    expect(stored).toBeDefined();
    expect(stored?.questions.length).toBe(questions.length);
    expect(stored?.manifest.packId).toBe(manifest.packId);
  });
});

