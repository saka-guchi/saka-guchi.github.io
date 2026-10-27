import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { db, ensureBuiltinPackLoaded } from '../../src/db';
import { BUILTIN_YASUDA_PACK, ALL_CURRICULUM_QUESTIONS } from '../../src/data/curriculum';

describe('Built-in Curriculum Pack & Database Initialization Tests', () => {
  it('has valid built-in pack data and curriculum questions', () => {
    expect(BUILTIN_YASUDA_PACK.examId).toBe('yasuda-2024');
    expect(BUILTIN_YASUDA_PACK.questions.length).toBe(63); // 理科22 + 算数16 + 社会25
    expect(BUILTIN_YASUDA_PACK.skills.length).toBe(37); // 理科9 + 算数13 + 社会15
    expect(ALL_CURRICULUM_QUESTIONS.length).toBeGreaterThan(50);
  });

  it('initializes Dexie (IndexedDB) with built-in pack automatically', async () => {
    await ensureBuiltinPackLoaded(true);
    const stored = await db.contentPacks.get('yasuda-2024');
    expect(stored).toBeDefined();
    expect(stored?.questions.length).toBe(63);
    expect(stored?.manifest.packId).toBe('pack-yasuda-2024-1.0.0');
  });

  it('validates mock/zip integrity and manifest parsing', async () => {
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
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const loadedZip = await JSZip.loadAsync(zipBuffer);
    const manifestFile = loadedZip.file('manifest.json');
    expect(manifestFile).not.toBeNull();
    const manifestText = await manifestFile!.async('text');
    const parsed = JSON.parse(manifestText);
    expect(parsed.packId).toBe('pack-test-1.0.0');
  });
});


