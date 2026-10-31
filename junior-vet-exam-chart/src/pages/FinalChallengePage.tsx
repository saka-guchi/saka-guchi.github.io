import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type StoredPack } from '../db';
import type { Subject } from '../types';
import {
  FINAL_CHALLENGE_DATA_BY_SUBJECT,
  FINAL_CHALLENGE_2022_DATA_BY_SUBJECT,
  FINAL_CHALLENGE_SECTIONS,
  TOTAL_PAGES,
  SUPPORTED_EXAM_YEARS,
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT,
  type ExamYear,
} from '../data/final-challenge-data';
import {
  STAGE1_PAGE_CONTENTS,
  STAGE1_PAGE_CONTENTS_BY_SUBJECT,
  STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT,
} from '../data/final-challenge-pages';
import { BUILTIN_YASUDA_PACK } from '../data/curriculum';
import { DoctorCertificateModal } from '../components/DoctorCertificateModal';
import { FinalExamHistoryModal } from '../components/FinalExamHistoryModal';
import { sound } from '../utils/sound-effects';
import styles from './FinalChallengePage.module.css';

export const FinalChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState<ExamYear>(2024);
  const [currentSubject, setCurrentSubject] = useState<Subject>('rika');
  const [stage, setStage] = useState<1 | 2>(1);

  // 教科ごとの残り時間（秒）: 理科30分、算数50分、社会30分、国語50分（各教科独立して保持し、切り替え時も経過時間を維持）
  const getInitialTimes = (yr: ExamYear): Record<Subject, number> => {
    const data = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[yr];
    return {
      rika: data.rika.timeLimitMinutes * 60,
      sansu: data.sansu.timeLimitMinutes * 60,
      shakai: data.shakai.timeLimitMinutes * 60,
      kokugo: (data.kokugo?.timeLimitMinutes || 50) * 60,
    };
  };

  const [subjectTimes, setSubjectTimes] = useState<Record<Subject, number>>(getInitialTimes(2024));
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // p.1 (表紙) から開始
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'text' | 'image'>('text');
  const [storedPack, setStoredPack] = useState<StoredPack | null>(BUILTIN_YASUDA_PACK);

  // 回答状態: slotId -> 入力値
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // 記述問題の自己採点用状態: slotId -> [要素インデックスの正誤]
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [rubricChecks, setRubricChecks] = useState<Record<string, Record<number, boolean>>>({});
  const [showCertModal, setShowCertModal] = useState(false);
  const [hasMasterBadge, setHasMasterBadge] = useState(false);
  const [showExamResultModal, setShowExamResultModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [kokugoFont, setKokugoFont] = useState<'mincho' | 'gothic'>('mincho');
  const [kokugoFontSize, setKokugoFontSize] = useState<'normal' | 'large'>('normal');
  const [kokugoLineHeight, setKokugoLineHeight] = useState<'normal' | 'loose'>('loose');
  const [lastExamResult, setLastExamResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  const currentYearData = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[currentYear] || FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2024];
  const currentSubjectData = currentYearData[currentSubject] || currentYearData.rika;
  const currentSections = currentSubjectData.sections;
  const currentTotalPages = currentSubjectData.totalPages;

  // パック読み込み
  useEffect(() => {
    db.contentPacks.toArray().then(packs => {
      if (packs.length > 0) {
        setStoredPack(packs[0]);
      }
    });
  }, []);

  // 年度切り替え
  const handleYearChange = (newYear: ExamYear) => {
    if (newYear === currentYear) return;
    sound.playPop();
    setCurrentYear(newYear);
    setCurrentPage(1);
    setAnswers({});
    setRubricChecks({});
    setSubjectTimes(getInitialTimes(newYear));
  };

  // 科目切り替え（各教科の残り時間は保持されるためリセットされません）
  const handleSubjectChange = (newSubject: Subject) => {
    if (newSubject === currentSubject) return;
    sound.playPop();
    setCurrentSubject(newSubject);
    setCurrentPage(1);
  };

  // タイマー: 現在選択中の教科の残り時間を毎秒カウントダウン
  useEffect(() => {
    // 採点モーダル・認定証・タイムアップモーダル表示中はタイマーを一時停止
    if (showScoringModal || showCertModal || showTimeUpModal) return;

    const timer = setInterval(() => {
      setSubjectTimes(prev => {
        const current = prev[currentSubject] ?? 0;
        if (current <= 1) {
          clearInterval(timer);
          sound.playPop();
          setShowTimeUpModal(true);
          return { ...prev, [currentSubject]: 0 };
        }
        return { ...prev, [currentSubject]: current - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSubject, showScoringModal, showCertModal, showTimeUpModal]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleInputChange = (slotId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [slotId]: val }));
  };

  // 提出・採点
  const handleSubmitExam = () => {
    const openSlots = currentSections.flatMap(s => s.slots).filter(s => s.answerType === 'open');
    if (openSlots.length > 0) {
      setShowScoringModal(true);
    } else {
      // 記述問題がない場合は直接採点
      handleFinalizeScore();
    }
  };

  const handleFinalizeScore = async () => {
    // 採点計算
    let correctCount = 0;
    const allSlots = currentSections.flatMap(s => s.slots);
    const questionScores: Record<string, { isCorrect: boolean; userSelfScored?: boolean }> = {};

    for (const slot of allSlots) {
      if (slot.answerType === 'open') {
        // 記述: すべての自己採点要素が「書けた」なら正解
        const checks = rubricChecks[slot.id] || {};
        const totalRubrics = slot.rubricItems?.length || 1;
        const passedRubrics = Object.values(checks).filter(Boolean).length;
        const isOk = passedRubrics === totalRubrics;
        if (isOk) correctCount++;
        questionScores[slot.id] = { isCorrect: isOk, userSelfScored: true };
      } else {
        // 語句・選択・数値: 一致判定
        const userAns = (answers[slot.id] || '').trim();
        const expected = (stage === 1 ? slot.correctAnswer : slot.stage2CorrectAnswer || slot.correctAnswer).trim();
        const isOk = userAns.toLowerCase() === expected.toLowerCase();
        if (isOk) correctCount++;
        questionScores[slot.id] = { isCorrect: isOk, userSelfScored: false };
      }
    }

    const totalQuestions = allSlots.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;

    const examPrefix = storedPack?.examId ? `${storedPack.examId}-${currentSubject}` : `yasuda-${currentYear}-${currentSubject}`;
    await db.finalChallengeResults.add({
      examId: examPrefix,
      stage,
      timestamp: Date.now(),
      score,
      totalScore: 100,
      passed,
      questionScores,
    });

    // Stage 1 & Stage 2 の両方合格しているかチェック（金のマスター獣医師バッジ授与判定）
    try {
      const history = await db.finalChallengeResults.where('examId').equals(examPrefix).toArray();
      const otherStage = stage === 1 ? 2 : 1;
      const otherPassed = history.some(h => h.stage === otherStage && h.passed);
      setHasMasterBadge(Boolean(passed && otherPassed));
    } catch {
      setHasMasterBadge(false);
    }

    setShowScoringModal(false);
    setLastExamResult({ score, passed, correctCount, totalQuestions });
    setShowExamResultModal(true);

    if (passed) {
      sound.playAnimalHappy();
    } else {
      sound.playPop();
    }
  };

  // 現在ページの画像（インポート済みの場合またはpublicフォールバック）
  const padPage = String(currentPage).padStart(3, '0');
  const pageImageKey = `images/pages/${currentYear}/${currentSubject}/mondai_p${padPage}.webp`;
  const pageImageAltKey = `images/pages/${currentYear}/${currentSubject}/mondai_p${padPage}.png`;
  const publicFallback =
    currentYear === 2024
      ? `${import.meta.env.BASE_URL}pages/${currentSubject}/mondai_p${padPage}.webp`
      : currentYear === 2023
      ? `${import.meta.env.BASE_URL}pages/2023/${currentSubject}/mondai_p${padPage}.webp`
      : `${import.meta.env.BASE_URL}pages/2022/${currentSubject}/mondai_p${padPage}.webp`;
  const pageImageData =
    storedPack?.images?.[pageImageKey] ||
    storedPack?.images?.[pageImageAltKey] ||
    publicFallback;

  // 傍線部ジャンプ用マップ（スロット番号・傍線部番号とページ番号の対応）
  const kokugoUnderlinePages: Record<string, { page: number; elementId: string }> = {
    'kokugo-2022-02-02-1': { page: 2, elementId: 'kokugo-underline-1' },
    'kokugo-2022-02-02-2': { page: 6, elementId: 'kokugo-underline-5' },
    'kokugo-2022-02-03': { page: 3, elementId: 'kokugo-underline-2' },
    'kokugo-2022-02-04': { page: 4, elementId: 'kokugo-underline-3' },
    'kokugo-2022-02-05': { page: 5, elementId: 'kokugo-underline-4' },
    'kokugo-2022-02-06': { page: 6, elementId: 'kokugo-underline-5' },
    'kokugo-2022-02-07': { page: 6, elementId: 'kokugo-underline-6' },
    'kokugo-2022-03-01': { page: 9, elementId: 'kokugo-underline-7' },
    'kokugo-2022-03-02': { page: 10, elementId: 'kokugo-underline-8' },
    'kokugo-2022-03-03': { page: 11, elementId: 'kokugo-underline-9' },
    'kokugo-2022-03-04-a': { page: 11, elementId: 'kokugo-underline-10' },
    'kokugo-2022-03-04-b': { page: 11, elementId: 'kokugo-underline-10' },
    'kokugo-2022-03-05': { page: 12, elementId: 'kokugo-underline-11' },
    'kokugo-2022-03-06': { page: 12, elementId: 'kokugo-underline-12' },
  };

  const handleJumpToUnderline = (slotId: string) => {
    sound.playPop();
    const target = kokugoUnderlinePages[slotId];
    if (!target) return;

    if (viewMode !== 'text') {
      setViewMode('text');
    }

    if (currentPage !== target.page) {
      setCurrentPage(target.page);
    }

    setTimeout(() => {
      const el = document.getElementById(target.elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('kokugo-underline-pulse');
        setTimeout(() => {
          el.classList.remove('kokugo-underline-pulse');
        }, 2500);
      }
    }, 120);
  };

  const subjectContents =
    STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[currentYear]?.[currentSubject] ||
    STAGE1_PAGE_CONTENTS_BY_SUBJECT[currentSubject] ||
    STAGE1_PAGE_CONTENTS;
  const currentPageContent = subjectContents[currentPage];

  const currentTimeLeft = subjectTimes[currentSubject] ?? 0;
  const isTimeCritical = currentTimeLeft <= 60;
  const isTimeWarning = currentTimeLeft <= 300 && !isTimeCritical;

  return (
    <div className={styles.container} data-testid="final-challenge-page">
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/')}
            aria-label="戻る"
            data-testid="challenge-back-btn"
          >
            ←
          </button>

          {/* 年度切り替えセグメントコントロール */}
          <div className={styles.subjectTabs} data-testid="challenge-year-tabs" style={{ background: '#f1f5f9' }}>
            {SUPPORTED_EXAM_YEARS.map(yr => (
              <button
                key={yr}
                className={`${styles.subjectTab} ${currentYear === yr ? styles.activeSubjectTab : ''}`}
                onClick={() => handleYearChange(yr)}
                data-testid={`year-tab-${yr}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                📅 {yr}年度
              </button>
            ))}
          </div>

          {/* 教科切り替えタブ */}
          <div className={styles.subjectTabs} data-testid="challenge-subject-tabs">
            {(['rika', 'sansu', 'shakai', 'kokugo'] as Subject[]).map(sub => {
              const info = currentYearData[sub] || FINAL_CHALLENGE_2022_DATA_BY_SUBJECT[sub];
              return (
                <button
                  key={sub}
                  className={`${styles.subjectTab} ${currentSubject === sub ? styles.activeSubjectTab : ''}`}
                  onClick={() => handleSubjectChange(sub)}
                  data-testid={`subject-tab-${sub}`}
                >
                  {info.icon} {info.subjectLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 制限時間タイマー（各教科独立・残り時間により警告色） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className={`${styles.timerBadge} ${
              isTimeCritical ? styles.timerCritical : isTimeWarning ? styles.timerWarning : ''
            }`}
            data-testid="challenge-timer"
            title="本番入試の制限時間: 0:00になると自動で試験終了・採点へ進みます"
          >
            ⏱ 残り時間: {formatTime(currentTimeLeft)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
            （0:00で自動採点）
          </span>
        </div>

        <div className={styles.stageTabs}>
          <button
            className={`${styles.stageTab} ${stage === 1 ? styles.activeTab : ''}`}
            onClick={() => setStage(1)}
            data-testid="stage-1-tab"
          >
            Stage 1（過去問本番）
          </button>
          <button
            className={`${styles.stageTab} ${stage === 2 ? styles.activeTab : ''}`}
            onClick={() => setStage(2)}
            data-testid="stage-2-tab"
          >
            Stage 2（同等未見問題）
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* 左: 問題ページビューア */}
        <section className={styles.pdfArea} data-testid="challenge-pdf-area">
          <div className={styles.pdfControls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span data-testid="page-indicator">
                ページ: {currentPage} / {currentTotalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                data-testid="prev-page-btn"
              >
                ◀ 前のページ
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(currentTotalPages, p + 1))}
                disabled={currentPage >= currentTotalPages}
                data-testid="next-page-btn"
              >
                次のページ ▶
              </button>
            </div>

            {/* ズーム操作 */}
            <div className={styles.zoomControls}>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(z => Math.max(70, z - 15))}
                title="縮小"
              >
                🔍 -
              </button>
              <span style={{ fontSize: '13px', minWidth: '42px', textAlign: 'center' }}>
                {zoom}%
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(z => Math.min(180, z + 15))}
                title="拡大"
              >
                🔍 +
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(100)}
                style={{ fontSize: '12px' }}
              >
                100%
              </button>
            </div>

            {stage === 1 && pageImageData && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                <button
                  className={`${styles.pageBtn} ${viewMode === 'text' ? styles.activeTab : ''}`}
                  onClick={() => setViewMode('text')}
                  style={{ fontSize: '12px', background: viewMode === 'text' ? '#DBEAFE' : undefined }}
                >
                  📐 テキスト・図表
                </button>
                <button
                  className={`${styles.pageBtn} ${viewMode === 'image' ? styles.activeTab : ''}`}
                  onClick={() => setViewMode('image')}
                  style={{ fontSize: '12px', background: viewMode === 'image' ? '#DBEAFE' : undefined }}
                >
                  📸 原本スキャン
                </button>
              </div>
            )}

            {stage === 2 && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    background: 'var(--primary-weak)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                  }}
                >
                  ✨ 同等未見問題モード（オリジナル出題）
                </span>
              </div>
            )}
          </div>

          <div className={styles.pageWrapper}>
            {stage === 1 ? (
              viewMode === 'image' && pageImageData ? (
                /* 画像がある場合は実ページ画像を表示（第13章仕様: 元のページ画像をそのまま表示し、拡大できる） */
                <img
                  src={pageImageData}
                  alt={`問題用紙 p.${currentPage}`}
                  className={styles.pageImage}
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                  data-testid="exam-page-image"
                />
              ) : (
                /* テキスト・図表・設問表示 */
                <div
                  className={styles.samplePdfMock}
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      marginBottom: '12px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid var(--primary-weak)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--primary)',
                    }}
                  >
                    <span>
                      📐 <strong>図表付き問題用紙モード</strong>（原本スキャンの代わりに鮮明な図表を表示しています）
                    </span>
                    <button
                      onClick={() => navigate('/settings')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                      }}
                    >
                      教材パックインポート
                    </button>
                  </div>
                  {/* 国語読解アシストバー */}
                  {currentSubject === 'kokugo' && (
                    <div className={styles.readerToolbar}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#be123c', marginRight: '4px' }}>
                        📖 読解アシスト:
                      </span>
                      <button
                        type="button"
                        className={`${styles.readerToolBtn} ${kokugoFont === 'mincho' ? styles.readerToolBtnActive : ''}`}
                        onClick={() => { sound.playPop(); setKokugoFont('mincho'); }}
                      >
                        明朝体（入試風）
                      </button>
                      <button
                        type="button"
                        className={`${styles.readerToolBtn} ${kokugoFont === 'gothic' ? styles.readerToolBtnActive : ''}`}
                        onClick={() => { sound.playPop(); setKokugoFont('gothic'); }}
                      >
                        ゴシック体
                      </button>
                      <button
                        type="button"
                        className={`${styles.readerToolBtn} ${kokugoFontSize === 'large' ? styles.readerToolBtnActive : ''}`}
                        onClick={() => { sound.playPop(); setKokugoFontSize(f => f === 'large' ? 'normal' : 'large'); }}
                      >
                        {kokugoFontSize === 'large' ? '文字: 標準' : '文字: やや大'}
                      </button>
                      <button
                        type="button"
                        className={`${styles.readerToolBtn} ${kokugoLineHeight === 'loose' ? styles.readerToolBtnActive : ''}`}
                        onClick={() => { sound.playPop(); setKokugoLineHeight(l => l === 'loose' ? 'normal' : 'loose'); }}
                      >
                        {kokugoLineHeight === 'loose' ? '行間: 標準' : '行間: ゆったり'}
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '24px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      minHeight: '520px',
                      fontFamily: currentSubject === 'kokugo' && kokugoFont === 'mincho'
                        ? '"Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif'
                        : 'inherit',
                      fontSize: currentSubject === 'kokugo' && kokugoFontSize === 'large' ? '17px' : '15px',
                    }}
                  >
                    <h3
                      style={{
                        borderBottom: `2px solid ${currentSubject === 'kokugo' ? '#e11d48' : 'var(--primary)'}`,
                        paddingBottom: '8px',
                        color: 'var(--text)',
                      }}
                    >
                      {currentPageContent?.title || `問題用紙 (p.${currentPage})`}
                    </h3>
                    {currentPageContent?.subTitle && (
                      <p style={{ color: 'var(--text-subtle)', marginTop: '4px' }}>
                        {currentPageContent.subTitle}
                      </p>
                    )}

                    {currentPageContent?.sections.map((sec, sIdx) => (
                      <div key={sIdx} style={{ marginTop: '18px' }}>
                        {sec.sectionTitle && (
                          <h4 style={{ color: currentSubject === 'kokugo' ? '#be123c' : 'var(--primary)', marginBottom: '6px' }}>
                            {sec.sectionTitle}
                          </h4>
                        )}
                        {currentSubject === 'kokugo' && sec.bodyText.includes('<mark') ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: sec.bodyText }}
                            style={{
                              whiteSpace: 'pre-wrap',
                              lineHeight: kokugoLineHeight === 'loose' ? '2.1' : '1.8',
                              color: 'var(--text)',
                              letterSpacing: '0.04em',
                            }}
                          />
                        ) : (
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text)' }}>
                            {sec.bodyText}
                          </p>
                        )}

                        {sec.figures && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '16px',
                              flexWrap: 'wrap',
                              margin: '16px 0',
                              justifyContent: 'center',
                            }}
                            data-testid="page-figures-container"
                          >
                            {sec.figures.map(fig => (
                              <div
                                key={fig.id}
                                style={{
                                  border: '1.5px solid var(--border)',
                                  borderRadius: '12px',
                                  padding: '14px',
                                  background: 'var(--surface-subtle)',
                                  maxWidth: '340px',
                                  width: '100%',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                }}
                                data-testid={`exam-figure-${fig.id}`}
                              >
                                <div
                                  dangerouslySetInnerHTML={{ __html: fig.svg }}
                                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                                />
                                <div
                                  style={{
                                    marginTop: '8px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: 'var(--text)',
                                  }}
                                >
                                  {fig.caption}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {sec.questions && (
                          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {sec.questions.map(q => {
                              const choicesToDisplay = (q.choices && q.choices.length > 0)
                                ? q.choices
                                : currentSections
                                    .flatMap(s => s.slots)
                                    .find(slot => slot.pageNumber === currentPage && (slot.label.includes(q.qNum) || slot.questionNumber === q.qNum.replace(/[^0-9]/g, '')))?.options;

                              return (
                                <div
                                  key={q.qNum}
                                  style={{
                                    padding: '14px 16px',
                                    background: 'var(--surface-subtle)',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid var(--primary)',
                                  }}
                                  data-testid={`question-card-${q.qNum}`}
                                >
                                  <strong style={{ fontSize: '15px', color: 'var(--text)' }}>【{q.qNum}】</strong>
                                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '6px', lineHeight: '1.7', fontSize: '15px' }}>{q.prompt}</p>

                                  {choicesToDisplay && choicesToDisplay.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                      }}
                                      data-testid={`question-choices-${q.qNum}`}
                                    >
                                      {choicesToDisplay.map((choiceText, cIdx) => (
                                        <div
                                          key={cIdx}
                                          style={{
                                            padding: '10px 14px',
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            color: 'var(--text)',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                          }}
                                        >
                                          {choiceText}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* Stage 2 (同等未見問題) の表示 */
              <div
                className={styles.samplePdfMock}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <div
                  style={{
                    padding: '24px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minHeight: '520px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'var(--primary-weak)',
                      color: 'var(--primary)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                    }}
                  >
                    Stage 2：同等未見問題（人による確認済み）
                  </div>
                  <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
                    {currentPage === 1 && `Stage 2 ${currentSubjectData.subjectLabel} 試験表紙`}
                    {currentPage > 1 && (currentPageContent?.title || `問題用紙 (p.${currentPage})`)}
                  </h3>

                  {currentPage === 1 && (
                    <div style={{ marginTop: '20px', lineHeight: '2' }}>
                      <p>
                        本テストは、{currentYear}年度過去問（{currentSubjectData.subjectLabel}）と<strong>Skill構成・難易度・問われ方が同等</strong>で、題材や数値を変更した<strong>同等未見問題</strong>です。
                      </p>
                      <p>
                        右側の解答用紙にすべての答えを記入してください。80点以上で合格、満点を達成すると「Master (M6)」に認定されます。
                      </p>
                    </div>
                  )}

                  {currentPage > 1 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentSections.flatMap(s => s.slots)
                        .filter(slot => slot.pageNumber === currentPage)
                        .map(slot => {
                          const activeOptions = slot.stage2Options || slot.options;
                          return (
                            <div
                              key={slot.id}
                              style={{
                                padding: '14px',
                                background: 'var(--surface-subtle)',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--primary)',
                              }}
                              data-testid={`stage2-card-${slot.id}`}
                            >
                              <strong style={{ color: 'var(--primary)' }}>【大問{slot.section} {slot.label}】</strong>
                              <p style={{ marginTop: '6px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                {slot.stage2Prompt || '同等難易度で更新した未見問題です。'}
                              </p>
                              {activeOptions && activeOptions.length > 0 && (
                                <div
                                  style={{
                                    marginTop: '10px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '8px',
                                  }}
                                  data-testid={`stage2-options-${slot.id}`}
                                >
                                  {activeOptions.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      style={{
                                        padding: '8px 12px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        lineHeight: '1.4',
                                        color: 'var(--text)',
                                      }}
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 右: 解答用紙（設問番号順・大問ごとの構造化） */}
        <section className={styles.sheetArea} data-testid="challenge-answer-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ font: 'var(--font-heading)', margin: 0 }}>解答用紙</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>
              全 {currentSections.flatMap(s => s.slots).length} 欄
            </span>
          </div>

          <div className={styles.slotList}>
            {currentSections.map(sec => (
              <div key={sec.sectionNumber} className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>{sec.title} ({sec.pageRange})</div>

                {/* 理科問1のような小問集合はスッキリ並べる */}
                {currentSubject === 'rika' && sec.sectionNumber === 1 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>大問{sec.sectionNumber} 問1</div>
                    <div className={styles.subSlotGrid}>
                      {sec.slots.filter(s => s.questionNumber === '1').map(slot => (
                        <div key={slot.id} className={styles.slotItem}>
                          <label style={{ fontWeight: 'bold' }}>[{slot.partNumber}]</label>
                          <input
                            type="text"
                            placeholder="語句を入力"
                            className={styles.textInput}
                            value={answers[slot.id] || ''}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 国語大問1の漢字10問（書き取り・読み）は専用グリッドでスッキリ配置 */}
                {currentSubject === 'kokugo' && sec.sectionNumber === 1 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', marginBottom: '6px' }}>
                      ✏️ 漢字の書き取り（①〜⑤）と読み（⑥〜⑩）
                    </div>
                    <div className={styles.kanjiGrid}>
                      {sec.slots.map(slot => (
                        <div key={slot.id} className={styles.kanjiItem}>
                          <label style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text)' }}>
                            {slot.label}
                          </label>
                          <input
                            type="text"
                            placeholder={slot.id.endsWith('01') || slot.id.endsWith('02') || slot.id.endsWith('03') || slot.id.endsWith('04') || slot.id.endsWith('05') ? '漢字を入力' : 'ひらがなで入力'}
                            className={styles.textInput}
                            style={{ height: '38px', fontSize: '14px' }}
                            value={answers[slot.id] || ''}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* その他の設問 */}
                {sec.slots
                  .filter(s => !(currentSubject === 'rika' && sec.sectionNumber === 1 && s.questionNumber === '1'))
                  .filter(s => !(currentSubject === 'kokugo' && sec.sectionNumber === 1))
                  .map(slot => {
                    const currentAns = answers[slot.id] || '';
                    const ansLen = currentAns.length;
                    // 文字数制限の検出（例: "50字以内" -> 50, "80字以内" -> 80, "30字以内" -> 30, "18字" -> 18, "66字" -> 66, "33字" -> 33）
                    const limitMatch = slot.label.match(/(\d+)字/) || (slot.stage2Prompt && slot.stage2Prompt.match(/(\d+)字/));
                    const charLimit = limitMatch ? parseInt(limitMatch[1], 10) : null;
                    const isOverLimit = charLimit ? ansLen > charLimit : false;
                    const isFit = charLimit ? (ansLen > 0 && ansLen <= charLimit) : false;
                    const hasJump = Boolean(kokugoUnderlinePages[slot.id]);

                    return (
                      <div key={slot.id} className={styles.slotItem} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <label style={{ fontWeight: 'bold' }}>
                            大問{sec.sectionNumber} {slot.label}:
                          </label>
                          {hasJump && (
                            <button
                              type="button"
                              className={styles.jumpUnderlineBtn}
                              onClick={() => handleJumpToUnderline(slot.id)}
                              title="問題用紙の該当する傍線部へジャンプします"
                              data-testid={`jump-btn-${slot.id}`}
                            >
                              📍 傍線部を見る
                            </button>
                          )}
                        </div>

                        {slot.answerType === 'open' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <textarea
                              placeholder={
                                currentSubject === 'kokugo'
                                  ? '記述の答えを入力（提出時に採点要素・キーワード判定が確認できます）'
                                  : 'ノートや紙に記述後、提出時に自己採点要素を確認します'
                              }
                              className={styles.textArea}
                              style={{ height: currentSubject === 'kokugo' ? '90px' : '70px' }}
                              value={currentAns}
                              onChange={e => handleInputChange(slot.id, e.target.value)}
                              data-testid={`slot-${slot.id}`}
                            />
                            {charLimit && (
                              <div
                                className={`${styles.charCounter} ${
                                  isOverLimit
                                    ? styles.charCounterOver
                                    : isFit
                                    ? styles.charCounterFit
                                    : styles.charCounterNormal
                                }`}
                              >
                                <span>✏️ 文字数: {ansLen} / {charLimit} 字</span>
                                {isOverLimit && <span>⚠️ 字数超過！</span>}
                              </div>
                            )}
                          </div>
                        ) : slot.answerType === 'numeric' ? (
                          <input
                            type="number"
                            placeholder="数値を入力"
                            className={styles.textInput}
                            value={currentAns}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                          />
                        ) : (slot.stage2Options || slot.options) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(() => {
                              const opts = (stage === 2 && slot.stage2Options) ? slot.stage2Options : (slot.options || []);
                              const symbolList = opts.map(o => o.trim().slice(0, 1)).filter(s => s.length > 0);
                              return (
                                <>
                                  {symbolList.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      {symbolList.map(sym => (
                                        <button
                                          key={sym}
                                          type="button"
                                          onClick={() => handleInputChange(slot.id, sym)}
                                          style={{
                                            padding: '6px 14px',
                                            borderRadius: '6px',
                                            border: currentAns === sym ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: currentAns === sym ? 'var(--primary-weak)' : 'var(--surface)',
                                            color: currentAns === sym ? 'var(--primary)' : 'var(--text)',
                                            fontWeight: currentAns === sym ? 700 : 500,
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 120ms ease',
                                          }}
                                          data-testid={`quick-btn-${slot.id}-${sym}`}
                                        >
                                          {sym}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    placeholder="記号（例: ア、または ①、③）"
                                    className={styles.textInput}
                                    value={currentAns}
                                    onChange={e => handleInputChange(slot.id, e.target.value)}
                                    data-testid={`slot-${slot.id}`}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input
                              type="text"
                              placeholder={
                                slot.label.includes('最初と最後')
                                  ? '最初5字〜最後5字（例: 最初の五字〜最後の五字）'
                                  : '語句を入力'
                              }
                              className={styles.textInput}
                              value={currentAns}
                              onChange={e => handleInputChange(slot.id, e.target.value)}
                              data-testid={`slot-${slot.id}`}
                            />
                            {charLimit && (
                              <div
                                className={`${styles.charCounter} ${
                                  isOverLimit
                                    ? styles.charCounterOver
                                    : isFit
                                    ? styles.charCounterFit
                                    : styles.charCounterNormal
                                }`}
                              >
                                <span>✏️ 文字数: {ansLen} / {charLimit} 字</span>
                                {isOverLimit && <span>⚠️ 字数超過！</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              className={styles.submitExamBtn}
              onClick={handleSubmitExam}
              data-testid="submit-exam-btn"
            >
              📝 解答を提出して採点する
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '6px' }}>
              ※ 制限時間（{currentSubjectData.timeLimitMinutes}分）がゼロになると自動で提出・採点に進みます。
            </div>
          </div>
        </section>
      </main>

      {/* 提出後の記述問題自己採点モーダル */}
      {showScoringModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          data-testid="scoring-modal"
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
              <h2 style={{ font: 'var(--font-heading)', margin: 0 }}>
                記述問題の自己判定（第13章仕様）
              </h2>
              <button
                onClick={() => setShowScoringModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-subtle)',
                  padding: '4px 8px',
                }}
                aria-label="閉じる"
                data-testid="scoring-modal-close-btn"
              >
                ✕
              </button>
            </div>
            <p style={{ color: 'var(--text-subtle)', marginTop: '8px', fontSize: '14px' }}>
              紙やノートに書いた解答と模範解答を見比べ、要素ごとに「書けた／書けなかった」を選択してください。すべての要素を満たしている場合に正解となります。
            </p>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentSections.flatMap(s => s.slots)
                .filter(s => s.answerType === 'open')
                .map(slot => (
                  <div
                    key={slot.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px',
                      background: 'var(--surface-subtle)',
                    }}
                  >
                    <strong>【大問{slot.section} {slot.label}】</strong>
                    <div style={{ marginTop: '6px', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>模範解答：</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        {slot.correctAnswer}
                      </span>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>採点基準（要素）：</div>
                      {slot.rubricItems?.map((rubric, rIdx) => (
                        <label
                          key={rIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!rubricChecks[slot.id]?.[rIdx]}
                            onChange={e => {
                              const checked = e.target.checked;
                              setRubricChecks(prev => ({
                                ...prev,
                                [slot.id]: {
                                  ...(prev[slot.id] || {}),
                                  [rIdx]: checked,
                                },
                              }));
                            }}
                          />
                          <span>{rubric}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className={styles.pageBtn}
                onClick={() => setShowScoringModal(false)}
              >
                解答に戻る
              </button>
              <button
                className={styles.submitExamBtn}
                style={{ marginTop: 0, padding: '0 32px' }}
                onClick={handleFinalizeScore}
                data-testid="finalize-score-btn"
              >
                ✅ 採点を確定して結果を見る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 合格ドクター認定証授与モーダル */}
      {showCertModal && (
        <DoctorCertificateModal
          onClose={() => {
            setShowCertModal(false);
            navigate('/');
          }}
          examTitle={
            stage === 1
              ? `${currentYear}年度 ${currentSubjectData.subjectLabel} 過去問`
              : `Stage 2 ${currentSubjectData.subjectLabel} (${currentYear}年度同等) 未見問題`
          }
          isPerfectScore={lastExamResult?.score === 100}
          hasMasterBadge={hasMasterBadge}
        />
      )}

      {/* 制限時間終了（タイムアップ）モーダル */}
      {showTimeUpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          data-testid="timeup-modal"
        >
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '2px solid var(--primary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏰</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--text)', fontWeight: 'bold' }}>
              試験時間が終了しました！
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-subtle)', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              【{currentSubjectData.subjectLabel}】の制限時間（{currentSubjectData.timeLimitMinutes}分）となりました。<br />
              これまでの記入内容で解答を提出し、採点に進みます。
            </p>
            <button
              onClick={() => {
                setShowTimeUpModal(false);
                handleSubmitExam();
              }}
              style={{
                width: '100%',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
              data-testid="timeup-proceed-btn"
            >
              採点へ進む 📝
            </button>
          </div>
        </div>
      )}

      {/* 採点結果発表モーダル（ブラウザalert廃止） */}
      {showExamResultModal && lastExamResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          data-testid="exam-result-modal"
        >
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: lastExamResult.passed ? '2px solid #22c55e' : '2px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '54px', marginBottom: '8px' }}>
              {lastExamResult.score === 100 ? '🎖️' : lastExamResult.passed ? '👑' : '🌱'}
            </div>

            <div
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '2px 10px',
                borderRadius: '12px',
                background: 'var(--surface-subtle)',
                color: 'var(--text-subtle)',
                marginBottom: '8px',
              }}
            >
              {currentSubjectData.icon} {currentSubjectData.subjectLabel}（{stage === 1 ? 'Stage 1（過去問本番）' : 'Stage 2（同等未見問題）'}）
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', color: 'var(--text)', fontWeight: '800' }}>
              {lastExamResult.score === 100
                ? '満点クリア！おめでとう！'
                : lastExamResult.passed
                ? '合格ドクター認定！'
                : '採点完了（あと一歩！）'}
            </h3>

            <div
              style={{
                fontSize: '44px',
                fontWeight: '900',
                margin: '12px 0 4px',
                color: lastExamResult.passed ? '#15803d' : 'var(--text)',
              }}
              data-testid="result-score-display"
            >
              {lastExamResult.score} <span style={{ fontSize: '20px' }}>点</span>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-subtle)', marginBottom: '16px' }}>
              正解数: <strong>{lastExamResult.correctCount}</strong> / {lastExamResult.totalQuestions} 問
              （合格基準: 80点以上）
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6', background: 'var(--surface-subtle)', padding: '12px', borderRadius: '10px', margin: '0 0 20px 0' }}>
              {lastExamResult.passed
                ? '素晴らしい実力です！全問カルテの分析が完璧でした。認定証を受け取りましょう！'
                : '惜しい！間違えた単元をカルテで復習して、再挑戦してみましょう。採点結果はいつでも成績表から見返せます。'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lastExamResult.passed && (
                <button
                  onClick={() => {
                    setShowExamResultModal(false);
                    setShowCertModal(true);
                  }}
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                  data-testid="show-cert-from-result-btn"
                >
                  📜 合格認定証を受け取る！
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowExamResultModal(false);
                    setShowHistoryModal(true);
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--surface-subtle)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  data-testid="view-history-from-result-btn"
                >
                  📋 成績表を見る
                </button>

                <button
                  onClick={() => {
                    setShowExamResultModal(false);
                    navigate('/');
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  data-testid="return-home-from-result-btn"
                >
                  🏠 ホームに戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 過去の採点カルテ・成績表モーダル */}
      {showHistoryModal && (
        <FinalExamHistoryModal onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
};
