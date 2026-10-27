import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import JSZip from 'jszip';
import { db } from '../db';
import { APP_VERSION, BUILD_TIMESTAMP, clearCacheAndReload } from '../version';
import styles from './SettingsPage.module.css';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppStore();
  const [packStatus, setPackStatus] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState(0);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // 教材パックZIPの読み込み
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      setPackStatus('エラー: ファイルサイズが200MBを超えています。');
      return;
    }

    try {
      setPackStatus('教材パックを解析中...');
      const zip = await JSZip.loadAsync(file);

      // manifest.json 検証
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        setPackStatus('エラー: manifest.json が見つかりません。');
        return;
      }

      const manifestText = await manifestFile.async('text');
      const manifest = JSON.parse(manifestText);

      // 各JSONファイルの読み込み
      const readJson = async (filename: string) => {
        const file = zip.file(`data/${filename}`);
        return file ? JSON.parse(await file.async('text')) : [];
      };

      const questions = await readJson('questions.json');
      const skills = await readJson('skills.json');
      const practice = await readJson('practice.json');
      const transfer = await readJson('transfer.json');
      const integrated = await readJson('integrated.json');
      const stage2 = await readJson('stage2.json');
      const figures = await readJson('figures.json');

      // 画像ファイルの読み込み (WebP/PNG -> base64 DataURL)
      const images: Record<string, string> = {};
      const imageFiles = Object.keys(zip.files).filter(
        p => p.startsWith('images/') && !zip.files[p].dir
      );
      for (const p of imageFiles) {
        const file = zip.file(p);
        if (file) {
          const base64 = await file.async('base64');
          const ext = p.endsWith('.png') ? 'png' : 'webp';
          images[p] = `data:image/${ext};base64,${base64}`;
        }
      }

      // IndexedDBに保存
      await db.contentPacks.put({
        examId: manifest.examId,
        manifest,
        questions,
        answers: [],
        figures,
        skills,
        skillDependencies: [],
        practice,
        transfer,
        integrated,
        stage2,
        regions: [],
        images,
        importedAt: Date.now(),
      });

      setPackStatus(
        `読み込み成功！ パック: ${manifest.packId} (設問: ${questions.length}問, Stage2: ${stage2.length}問, 画像: ${Object.keys(images).length}枚)`
      );
    } catch (err: any) {
      setPackStatus(`読み込み失敗: ${err.message || 'データ形式が不正です'}`);
    }
  };

  // 学習履歴の書き出し
  const handleExportHistory = async () => {
    const attempts = await db.attempts.toArray();
    const masteries = await db.masteries.toArray();
    const data = { attempts, masteries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `junior-vet-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 学習履歴の初期化
  const handleResetHistory = async () => {
    if (resetStep === 0) {
      setResetStep(1);
    } else if (resetStep === 1) {
      await db.attempts.clear();
      await db.masteries.clear();
      await db.reviewSchedules.clear();
      await db.dailySessions.clear();
      setResetStep(0);
      alert('学習履歴を初期化しました。');
    }
  };

  return (
    <div className={styles.container} data-testid="settings-page">
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate('/')} aria-label="戻る" data-testid="settings-back-btn">
          ←
        </button>
        <h1 className={styles.title}>設定</h1>
        <div style={{ width: '48px' }} />
      </header>

      <main className={styles.content}>
        {/* 学習設定 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>学習の調整</h2>

          <div className={styles.settingRow}>
            <div>
              <strong>思い出す待ち時間</strong>
              <div className={styles.subLabel}>選択肢を出すまでの考慮時間</div>
            </div>
            <select
              value={String(settings.recallDelaySeconds)}
              onChange={e => {
                const val = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
                updateSettings({ recallDelaySeconds: val as any });
              }}
              className={styles.selectInput}
              data-testid="recall-delay-select"
            >
              <option value="auto">自動（おすすめ）</option>
              <option value="3">3 秒</option>
              <option value="5">5 秒</option>
              <option value="8">8 秒</option>
              <option value="10">10 秒</option>
              <option value="0">0 秒（すぐに選択肢）</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div>
              <strong>1日の学習問題数</strong>
              <div className={styles.subLabel}>日々の自動選定される問題数</div>
            </div>
            <select
              value={settings.dailyQuestionCount}
              onChange={e => updateSettings({ dailyQuestionCount: Number(e.target.value) as any })}
              className={styles.selectInput}
              data-testid="daily-count-select"
            >
              <option value="5">5 問（軽め）</option>
              <option value="10">10 問（標準）</option>
              <option value="15">15 問（しっかり）</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div>
              <strong>文字の大きさ</strong>
            </div>
            <select
              value={settings.fontSize}
              onChange={e => updateSettings({ fontSize: e.target.value as any })}
              className={styles.selectInput}
            >
              <option value="standard">標準</option>
              <option value="large">やや大きめ</option>
              <option value="larger">大</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div>
              <strong>効果音</strong>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e => updateSettings({ soundEnabled: e.target.checked })}
              className={styles.toggleCheckbox}
            />
          </div>
        </section>

        {/* 教材パック情報 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📚 収録教材パック</h2>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <strong>2024年度 安田学園中学校 入試【理科・算数・社会】</strong>
              <span style={{ background: '#22C55E', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>3教科収録済み</span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4B5563', lineHeight: '1.5' }}>
              全問（理科22問・算数16問・社会25問 計63問、全37スキル、Stage2全63問、原本スキャン画像、図版・解説）がアプリ本体に内蔵されています。
            </p>
            <button
              className={styles.actionBtn}
              onClick={async () => {
                const { ensureBuiltinPackLoaded } = await import('../db');
                await ensureBuiltinPackLoaded(true);
                setPackStatus('教材データを最新の内容に再同期しました！');
              }}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              🔄 教材データを再同期
            </button>
          </div>

          {packStatus && (
            <div
              className={styles.statusBox}
              style={{
                color: 'var(--success)',
                marginTop: '10px',
              }}
              data-testid="pack-status-box"
            >
              {packStatus}
            </div>
          )}
        </section>

        {/* アプリ・バージョン情報 */}
        <section className={styles.section} data-testid="app-version-section">
          <h2 className={styles.sectionTitle}>ℹ️ アプリ・バージョン情報</h2>
          <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px', marginBottom: '14px' }}>
              <span style={{ color: 'var(--text-subtle)' }}>バージョン:</span>
              <strong data-testid="app-version-value">v{APP_VERSION}</strong>

              <span style={{ color: 'var(--text-subtle)' }}>ビルド日時:</span>
              <span data-testid="build-timestamp-value" style={{ fontFamily: 'monospace' }}>{BUILD_TIMESTAMP}</span>

              <span style={{ color: 'var(--text-subtle)' }}>状態:</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>● 稼働中（PWA対応）</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-subtle)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              💡 アップデートしたはずの画面が反映されない場合は、ブラウザのキャッシュまたはService Workerが古いデータを保持している可能性があります。下のボタンを押すとキャッシュを完全に削除して最新版を取得します。
            </p>

            <button
              className={styles.actionBtn}
              onClick={async () => {
                setIsClearingCache(true);
                await clearCacheAndReload();
              }}
              disabled={isClearingCache}
              data-testid="clear-cache-btn"
              style={{ background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px' }}
            >
              {isClearingCache ? '⏳ キャッシュ削除＆リロード中...' : '🧹 キャッシュを削除して最新版に更新'}
            </button>
          </div>
        </section>

        {/* 履歴の保存とバックアップ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>学習履歴のバックアップ</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button className={styles.actionBtn} onClick={handleExportHistory}>
              📥 履歴を書き出し（JSON）
            </button>
            <button
              className={`${styles.actionBtn} ${resetStep > 0 ? styles.dangerBtn : ''}`}
              onClick={handleResetHistory}
              data-testid="reset-history-btn"
            >
              {resetStep === 0 ? '⚠️ 学習履歴を初期化' : '本当に初期化しますか？（タップで確定）'}
            </button>
          </div>
        </section>

        {/* ページフッターのバージョン表記 */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '16px', fontSize: '12px', color: 'var(--text-subtle)' }}>
          みならい獣医さんの中学受験カルテ v{APP_VERSION} ({BUILD_TIMESTAMP})
        </div>
      </main>
    </div>
  );
};

