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

  it('verifies generated pack zip exists and is readable', () => {
    expect(fs.existsSync(packZipPath)).toBe(true);
    const stat = fs.statSync(packZipPath);
    expect(stat.size).toBeGreaterThan(100 * 1024); // 100KB以上
  });

  it('validates zip integrity, manifest, and SHA-256 checksums', async () => {
    const zipBuffer = fs.readFileSync(packZipPath);
    const zip = await JSZip.loadAsync(zipBuffer);

    // 1. manifest.json の検証
    const manifestFile = zip.file('manifest.json');
    expect(manifestFile).not.toBeNull();

    const manifestText = await manifestFile!.async('text');
    const manifest = JSON.parse(manifestText);

    expect(manifest.packId).toBe('pack-yasuda-2024-1.0.0');
    expect(manifest.examId).toBe('yasuda-2024');
    expect(manifest.subjects[0].subject).toBe('rika');
    expect(manifest.subjects[0].questionCount).toBe(22);

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
    const zipBuffer = fs.readFileSync(packZipPath);
    const zip = await JSZip.loadAsync(zipBuffer);

    const manifestText = await zip.file('manifest.json')!.async('text');
    const manifest = JSON.parse(manifestText);

    const qText = await zip.file('data/questions.json')!.async('text');
    const questions = JSON.parse(qText);
    expect(questions.length).toBe(22);

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
    const stored = await db.contentPacks.get('yasuda-2024');
    expect(stored).toBeDefined();
    expect(stored?.questions.length).toBe(22);
    expect(stored?.manifest.packId).toBe('pack-yasuda-2024-1.0.0');
  });
});

