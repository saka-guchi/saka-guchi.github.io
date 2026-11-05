import { APP_TERMS } from '../constants/terms';
import { PauseConfirmModal } from '../components/PauseConfirmModal';
import { recordDailyStudyCompleted } from '../utils/progress-analytics';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { db, type StoredPack } from '../db';
import type { Subject, FinalChallengeResult } from '../types';
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
import { getExamScoreSummary, getExamBadgeTier, getExamBadgeInfo } from '../utils/exam-scores';
import { sound } from '../utils/sound-effects';
import { awardSessionPoints } from '../utils/points-manager';
import { SubmitConfirmModal } from '../components/final-challenge/SubmitConfirmModal';
import { ExamReviewPage } from '../components/final-challenge/ExamReviewPage';
import { ExamProblemViewer } from '../components/final-challenge/ExamProblemViewer';
import {
  ENABLE_TEXT_VIEW,
  resolveExamViewMode,
  loadPendingReview,
  savePendingReview,
  clearPendingReview,
  loadFinalizedReview,
  saveFinalizedReview,
  clearFinalizedReview,
  loadPausedAnswering,
  savePausedAnswering,
  clearPausedAnswering,
} from '../utils/final-challenge-storage';
import styles from './FinalChallengePage.module.css';

export const FinalChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startSkillFocusSession } = useAppStore();

  // URLクエリパラメータから初期年度・初期教科を安全に取得
  const queryYear = Number(searchParams.get('year')) as ExamYear;
  const querySubject = searchParams.get('subject') as Subject;

  const validYear: ExamYear = SUPPORTED_EXAM_YEARS.includes(queryYear) ? queryYear : 2024;
  const validSubject: Subject = (['rika', 'sansu', 'shakai', 'kokugo'] as Subject[]).includes(querySubject)
    ? querySubject
    : 'rika';

  // 判定中・確定後・中断データ（再読み込み・再開用）。初回描画時に1度だけ読む
  const [initialPending] = useState(() => loadPendingReview(validYear, validSubject));
  const [initialFinalized] = useState(() => (!initialPending ? loadFinalizedReview(validYear, validSubject) : null));
  const [initialPaused] = useState(() =>
    !initialPending && !initialFinalized ? loadPausedAnswering(validYear, validSubject) : null
  );
  const [currentYear, setCurrentYear] = useState<ExamYear>(validYear);
  const [currentSubject, setCurrentSubject] = useState<Subject>(validSubject);
  const [stage] = useState<1 | 2>(1); // Stage 1（過去問本番）のみ提供

  // URLクエリパラメータの変更に合わせて年度・教科を同期
  const isFirstSyncRef = useRef(true);
  useEffect(() => {
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }
    const pending = loadPendingReview(validYear, validSubject);
    const finalized = !pending ? loadFinalizedReview(validYear, validSubject) : null;
    const paused = !pending && !finalized ? loadPausedAnswering(validYear, validSubject) : null;
    setCurrentYear(validYear);
    setCurrentSubject(validSubject);
    setCurrentPage(paused?.currentPage ?? 1);
    if (paused?.remainingSeconds) {
      setSubjectTimes(prev => ({ ...prev, [validSubject]: paused.remainingSeconds }));
    }
    setAnswers(pending?.answers ?? finalized?.answers ?? paused?.answers ?? {});
    setRubricChecks(pending?.rubricChecks ?? finalized?.rubricChecks ?? {});
    setMarkedZeroSlots(pending?.markedZeroSlots ?? finalized?.markedZeroSlots ?? {});
    setIsTimeUpSubmitted(!!(pending?.isTimeUpSubmitted ?? finalized?.isTimeUpSubmitted));
    setIsResumed(!!pending);
    setIsFinalized(!!finalized);
    setLastExamResult(finalized?.lastExamResult ?? null);
    setHasMasterBadge(!!finalized?.hasMasterBadge);
    isFinalizingRef.current = !!finalized;
    isSubmittingRef.current = false;
    setViewModeState(pending || finalized ? 'reviewing' : 'answering');
  }, [validYear, validSubject]);
  const [examHistory, setExamHistory] = useState<FinalChallengeResult[]>([]);

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

  const [subjectTimes, setSubjectTimes] = useState<Record<Subject, number>>(() => {
    const base = getInitialTimes(validYear);
    if (initialPaused?.remainingSeconds && initialPaused.remainingSeconds > 0) {
      base[validSubject] = initialPaused.remainingSeconds;
    }
    return base;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPaused?.currentPage ?? 1); // p.1 (表紙) から開始
  const [scanZoom, setScanZoom] = useState(100); // 原本スキャン画像専用ズーム（100%=全体表示Fit）
  const [rawViewMode, setViewMode] = useState<'text' | 'image'>(() =>
    resolveExamViewMode(initialPending?.viewMode ?? initialFinalized?.viewMode ?? initialPaused?.viewMode)
  );
  const viewMode: 'text' | 'image' = ENABLE_TEXT_VIEW ? rawViewMode : 'image';
  const [pageLayout, setPageLayout] = useState<'single' | 'spread'>('single'); // 原本スキャン時の「1ページ」/「見開き（2ページ）」
  const [storedPack, setStoredPack] = useState<StoredPack | null>(BUILTIN_YASUDA_PACK);

  // 回答状態: slotId -> 入力値
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialPending?.answers ?? initialFinalized?.answers ?? initialPaused?.answers ?? {}
  );
  // 記述問題の自己採点用状態: slotId -> [要素インデックスの正誤]
  const [rubricChecks, setRubricChecks] = useState<Record<string, Record<number, boolean>>>(
    initialPending?.rubricChecks ?? initialFinalized?.rubricChecks ?? {}
  );
  const [markedZeroSlots, setMarkedZeroSlots] = useState<Record<string, boolean>>(
    initialPending?.markedZeroSlots ?? initialFinalized?.markedZeroSlots ?? {}
  );
  // 画面: 'answering'(解答用紙) / 'reviewing'(見直しページ)
  const [viewModeState, setViewModeState] = useState<'answering' | 'reviewing'>(
    initialPending || initialFinalized ? 'reviewing' : 'answering'
  );
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [isTimeUpSubmitted, setIsTimeUpSubmitted] = useState(
    !!(initialPending?.isTimeUpSubmitted ?? initialFinalized?.isTimeUpSubmitted)
  );
  const [isResumed, setIsResumed] = useState(!!initialPending);
  const [isFinalized, setIsFinalized] = useState(!!initialFinalized);
  // 二重実行ガード（ボタンのdisabledに頼らない）
  const isSubmittingRef = useRef(false);
  const isFinalizingRef = useRef(!!initialFinalized);
  const [showCertModal, setShowCertModal] = useState(false);
  const [hasMasterBadge, setHasMasterBadge] = useState(!!initialFinalized?.hasMasterBadge);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [lastExamResult, setLastExamResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(initialFinalized?.lastExamResult ?? null);

  const currentYearData = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[currentYear] || FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2024];
  const currentSubjectData = currentYearData[currentSubject] || currentYearData.rika;
  const currentSections = currentSubjectData.sections;
  const currentTotalPages = currentSubjectData.totalPages;

  // 過去の試験履歴の読み込み（最高点バッジ表示用）
  useEffect(() => {
    db.finalChallengeResults.toArray().then(setExamHistory);
  }, [isFinalized]);

  // パック読み込み
  useEffect(() => {
    db.contentPacks.toArray().then(packs => {
      if (packs.length > 0) {
        setStoredPack(packs[0]);
      }
    });
  }, []);



  // タイマー: 現在選択中の教科の残り時間を毎秒カウントダウン
  useEffect(() => {
    if (viewModeState === 'reviewing' || showCertModal || isPaused) return;

    const timer = setInterval(() => {
      setSubjectTimes(prev => {
        const current = prev[currentSubject] ?? 0;
        if (current <= 1) {
          clearInterval(timer);
          return { ...prev, [currentSubject]: 0 };
        }
        return { ...prev, [currentSubject]: current - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSubject, viewModeState, showCertModal, isPaused]);

  // 制限時間0: ダイアログなしで自動提出（提出処理は1回だけ）
  const timeIsUp = (subjectTimes[currentSubject] ?? 1) <= 0;
  useEffect(() => {
    if (timeIsUp && viewModeState === 'answering') {
      sound.playPop();
      submitRef.current(true);
    }
  }, [timeIsUp, viewModeState]);


  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleInputChange = (slotId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [slotId]: val }));
  };

  // 未入力の欄の数（実データから算出）
  const unansweredCount = currentSections
    .flatMap(s => s.slots)
    .filter(s => !(answers[s.id] || '').trim()).length;

  const handleOpenSubmitConfirm = () => {
    setShowSubmitConfirmModal(true);
  };

  // 提出処理（1回だけ実行されるガード付き）。タイムアップ時はダイアログなしで呼ばれる
  const handleProceedSubmit = (fromTimeUp = false) => {
    if (isSubmittingRef.current || viewModeState === 'reviewing') return;
    isSubmittingRef.current = true;
    setShowSubmitConfirmModal(false);
    setIsTimeUpSubmitted(fromTimeUp);
    clearPausedAnswering(currentYear, currentSubject);
    setViewModeState('reviewing');
    const hasOpen = currentSections.flatMap(s => s.slots).some(s => s.answerType === 'open');
    if (!hasOpen) {
      // 記述がない試験は状態Aを飛ばして、そのまま確定する
      void handleFinalizeScore();
    }
  };
  const submitRef = useRef(handleProceedSubmit);
  submitRef.current = handleProceedSubmit;

  // 判定中データの保存（見直しページ中・未確定のあいだ。localStorage不可でも止めない）
  useEffect(() => {
    if (viewModeState !== 'reviewing' || isFinalized) return;
    const hasOpen = currentSections.flatMap(s => s.slots).some(s => s.answerType === 'open');
    if (!hasOpen) return;
    savePendingReview({
      version: 1,
      year: currentYear,
      subject: currentSubject,
      answers,
      rubricChecks,
      markedZeroSlots,
      isTimeUpSubmitted,
      timestamp: Date.now(),
    });
  }, [viewModeState, isFinalized, answers, rubricChecks, markedZeroSlots, isTimeUpSubmitted, currentYear, currentSubject]);

  // 見直しページ中の「戻る」はホームへ（履歴を置換）
  useEffect(() => {
    if (viewModeState !== 'reviewing') return;
    window.history.pushState(null, '', window.location.href);
    const onPop = () => {
      clearFinalizedReview(currentYear, currentSubject);
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [viewModeState, navigate, currentYear, currentSubject]);

  const handleRubricChange = (slotId: string, rubricIndex: number, checked: boolean) => {
    if (isFinalized) return;
    setRubricChecks(prev => ({ ...prev, [slotId]: { ...(prev[slotId] || {}), [rubricIndex]: checked } }));
    setMarkedZeroSlots(prev => ({ ...prev, [slotId]: false }));
  };

  // 「どれも書けなかった」: チェックを全部外して判定ずみにする
  const handleMarkZero = (slotId: string) => {
    if (isFinalized) return;
    setRubricChecks(prev => ({ ...prev, [slotId]: {} }));
    setMarkedZeroSlots(prev => ({ ...prev, [slotId]: true }));
  };

  // 確定処理（1回だけ保存。失敗時はガード解除して再試行可能）
  const handleFinalizeScore = async () => {
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;
    try {
      let correctCount = 0;
      const allSlots = currentSections.flatMap(s => s.slots);
      const questionScores: Record<string, { isCorrect: boolean; userSelfScored?: boolean }> = {};

      for (const slot of allSlots) {
        if (slot.answerType === 'open') {
          // 記述: すべてのポイントにチェックが付いたら正解
          const checks = rubricChecks[slot.id] || {};
          const totalRubrics = slot.rubricItems?.length || 1;
          const passedRubrics = Object.values(checks).filter(Boolean).length;
          const isOk = !markedZeroSlots[slot.id] && passedRubrics === totalRubrics;
          if (isOk) correctCount++;
          questionScores[slot.id] = { isCorrect: isOk, userSelfScored: true };
        } else {
          const userAns = (answers[slot.id] || '').trim();
          const expected = (stage === 1 ? slot.correctAnswer : slot.stage2CorrectAnswer || slot.correctAnswer).trim();
          const isOk = userAns.toLowerCase() === expected.toLowerCase();
          if (isOk) correctCount++;
          questionScores[slot.id] = { isCorrect: isOk, userSelfScored: false };
        }
      }

      const totalQuestions = allSlots.length;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= 60;
      setHasMasterBadge(getExamBadgeTier(score) === 'gold');

      await db.finalChallengeResults.add({
        examId: `yasuda-${currentYear}-${currentSubject}`,
        stage,
        timestamp: Date.now(),
        score,
        totalScore: 100,
        passed,
        questionScores,
      });
      // 保存成功後にだけ判定中データを削除し、確定後のスナップショットをsessionStorageに保持
      clearPendingReview(currentYear, currentSubject);
      clearPausedAnswering(currentYear, currentSubject);
      const resultObj = { score, passed, correctCount, totalQuestions };
      saveFinalizedReview({
        version: 1,
        year: currentYear,
        subject: currentSubject,
        answers,
        rubricChecks,
        markedZeroSlots,
        isTimeUpSubmitted,
        lastExamResult: resultObj,
        hasMasterBadge: getExamBadgeTier(score) === 'gold',
        timestamp: Date.now(),
      });

      awardSessionPoints(passed ? 20 : 5, 'vet_challenge');
      recordDailyStudyCompleted().catch(() => {});

      setLastExamResult(resultObj);
      setIsFinalized(true);
      if (passed) sound.playAnimalHappy(); else sound.playPop();
    } catch (err) {
      console.error('[handleFinalizeScore] 保存に失敗しました。再試行できます:', err);
      isFinalizingRef.current = false;
    }
  };


  // 現在ページの画像（インポート済みの場合またはpublicフォールバック）
  const getPageImageUrl = (pageNumber: number): string | null => {
    if (pageNumber < 1 || pageNumber > currentTotalPages) return null;
    const pad = String(pageNumber).padStart(3, '0');
    const pageImageKey = `images/pages/${currentYear}/${currentSubject}/mondai_p${pad}.webp`;
    const pageImageAltKey = `images/pages/${currentYear}/${currentSubject}/mondai_p${pad}.png`;
    const publicFallback = `${import.meta.env.BASE_URL}pages/${currentYear}/${currentSubject}/mondai_p${pad}.webp`;
    return (
      storedPack?.images?.[pageImageKey] ||
      storedPack?.images?.[pageImageAltKey] ||
      publicFallback
    );
  };

  const pageImageData = getPageImageUrl(currentPage);
  const nextPageImageData = currentPage < currentTotalPages ? getPageImageUrl(currentPage + 1) : null;

  // 傍線部ジャンプ用マップ（スロット番号・傍線部番号とページ番号の対応）
  const kokugoUnderlinePages: Record<string, { page: number; elementId: string }> = {
    // 2024年度 国語 傍線部ジャンプ
    'kokugo-2024-02-01-1': { page: 2, elementId: 'kokugo-2024-underline-a' },
    'kokugo-2024-02-01-2': { page: 3, elementId: 'kokugo-2024-underline-b' },
    'kokugo-2024-02-02': { page: 2, elementId: 'kokugo-2024-underline-1' },
    'kokugo-2024-02-03': { page: 3, elementId: 'kokugo-2024-underline-2' },
    'kokugo-2024-02-04': { page: 3, elementId: 'kokugo-2024-underline-3' },
    'kokugo-2024-02-05': { page: 4, elementId: 'kokugo-2024-underline-4' },
    'kokugo-2024-02-06': { page: 5, elementId: 'kokugo-2024-underline-5' },
    'kokugo-2024-03-01': { page: 8, elementId: 'kokugo-2024-underline-6' },
    'kokugo-2024-03-02': { page: 8, elementId: 'kokugo-2024-underline-7' },
    'kokugo-2024-03-03': { page: 10, elementId: 'kokugo-2024-underline-8' },
    'kokugo-2024-03-04-1': { page: 10, elementId: 'kokugo-2024-underline-9' },
    'kokugo-2024-03-04-2': { page: 10, elementId: 'kokugo-2024-underline-9' },
    'kokugo-2024-03-05-1': { page: 10, elementId: 'kokugo-2024-underline-10' },
    'kokugo-2024-03-05-2': { page: 10, elementId: 'kokugo-2024-underline-10' },
    'kokugo-2024-03-06': { page: 10, elementId: 'kokugo-2024-underline-11' },
    'kokugo-2024-03-07': { page: 10, elementId: 'kokugo-2024-underline-12' },
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

    if (ENABLE_TEXT_VIEW && viewMode !== 'text') {
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
  const currentScoreSummary = getExamScoreSummary(examHistory, currentYear, currentSubject);

  if (viewModeState === 'reviewing') {
    return (
      <>
      <ExamReviewPage
        year={currentYear}
        subject={currentSubject}
        subjectLabel={currentSubjectData.subjectLabel}
        sections={currentSections}
        answers={answers}
        rubricChecks={rubricChecks}
        markedZeroSlots={markedZeroSlots}
        onRubricChange={handleRubricChange}
        onMarkZero={handleMarkZero}
        isFinalized={isFinalized}
        onFinalize={() => handleFinalizeScore()}
        onGoHome={() => {
          clearFinalizedReview(currentYear, currentSubject);
          navigate('/', { replace: true });
        }}
        isTimeUpSubmitted={isTimeUpSubmitted}
        isResumed={isResumed}
        onShowCertificate={() => setShowCertModal(true)}
        onStartSkillFocus={(skillId) => {
          sound.playChime();
          startSkillFocusSession(skillId);
          navigate('/study');
        }}
        onOpenSubjectCaseStudy={(sub) => {
          sound.playPop();
          navigate(`/?caseStudySubject=${sub}`);
        }}
        currentPage={currentPage}
        totalPages={currentTotalPages}
        onPageChange={setCurrentPage}
        pageLayout={pageLayout}
        onPageLayoutChange={setPageLayout}
        scanZoom={scanZoom}
        onScanZoomChange={setScanZoom}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        getPageImageUrl={getPageImageUrl}
        pageContents={subjectContents}
      />
      {showCertModal && (
        <DoctorCertificateModal
          onClose={() => setShowCertModal(false)}
          examTitle={`${currentYear}年度 ${currentSubjectData.subjectLabel} 過去問`}
          isPerfectScore={lastExamResult?.score === 100}
          hasMasterBadge={hasMasterBadge}
        />
      )}
      </>
    );
  }

  return (
    <div className={styles.container} data-testid="final-challenge-page">
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              sound.playPop();
              setIsPaused(true);
            }}
            aria-label="戻る・中断"
            data-testid="challenge-back-btn"
          >
            ← 戻る
          </button>

          <span className={styles.modeBadge}>{APP_TERMS.VET_CHALLENGE_WITH_ICON}</span>

          {/* 受験中の年度・教科タイトル表示 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
            }}
            data-testid="challenge-exam-badge"
          >
            <span>📅 {currentYear}年度</span>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
              {currentSubjectData.icon} {currentSubjectData.subjectLabel}
            </span>
          </div>
        </div>

        {/* 制限時間タイマー & 最高スコア */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
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

          {/* 現在選択中教科の過去最高スコア表示 */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              background: currentScoreSummary.isPerfect
                ? 'linear-gradient(135deg, #fef08a, #fde047)'
                : currentScoreSummary.bestScore !== null
                ? 'var(--surface-hover)'
                : 'transparent',
              border: currentScoreSummary.isPerfect
                ? '1.5px solid #ca8a04'
                : currentScoreSummary.bestScore !== null
                ? '1px solid var(--border)'
                : '1px dashed var(--border)',
              color: currentScoreSummary.isPerfect ? '#713f12' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
            data-testid="header-best-score-badge"
            title={`${currentYear}年度 ${currentSubjectData.subjectLabel} の最高スコア`}
          >
            {currentScoreSummary.isPerfect ? (
              <span>👑 100点 満点！</span>
            ) : currentScoreSummary.bestScore !== null ? (
              <span>
                {currentScoreSummary.passed ? '⭐ 合格 ' : '最高 '}: {currentScoreSummary.bestScore}点
              </span>
            ) : (
              <span>未受験</span>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* 左: 問題ページビューア（共通部品） */}
        <ExamProblemViewer
          stage={stage}
          currentYear={currentYear}
          currentSubject={currentSubject}
          currentSubjectLabel={currentSubjectData.subjectLabel}
          currentPage={currentPage}
          currentTotalPages={currentTotalPages}
          onPageChange={setCurrentPage}
          pageLayout={pageLayout}
          onPageLayoutChange={setPageLayout}
          scanZoom={scanZoom}
          onScanZoomChange={setScanZoom}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          pageImageData={pageImageData}
          nextPageImageData={nextPageImageData}
          currentPageContent={currentPageContent}
          currentSections={currentSections}
        />

        {/* 右: 解答用紙（設問番号順・大問ごとの構造化） */}
        <section className={styles.sheetArea} data-testid="challenge-answer-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ font: 'var(--font-heading)', margin: 0 }}>解答用紙</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>
              全 {currentSections.flatMap(s => s.slots).length} 欄
            </span>
          </div>

          <div className={styles.slotList}>
            {currentSections.map(sec => {
              const rikaSubSlots = currentSubject === 'rika' && sec.sectionNumber === 1
                ? sec.slots.filter(s => s.questionNumber === '1')
                : [];
              const isRikaSubGroup = rikaSubSlots.length > 1 && rikaSubSlots.some(s => Boolean(s.partNumber));

              return (
                <div key={sec.sectionNumber} className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>{sec.title} ({sec.pageRange})</div>

                  {/* 理科問1のような小問集合はスッキリ並べる（小問が複数かつ枝記号がある場合のみ） */}
                  {isRikaSubGroup && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>大問{sec.sectionNumber} 問1</div>
                      <div className={styles.subSlotGrid}>
                        {rikaSubSlots.map(slot => (
                          <div key={slot.id} className={styles.slotItem}>
                            <label htmlFor={`slot-input-${slot.id}`} style={{ fontWeight: 'bold' }}>
                              {slot.partNumber ? `[${slot.partNumber}]` : slot.label}
                            </label>
                            <input
                              id={`slot-input-${slot.id}`}
                              name={`slot_${slot.id}`}
                              type="text"
                              placeholder="語句を入力"
                              className={styles.textInput}
                              value={answers[slot.id] || ''}
                              onChange={e => handleInputChange(slot.id, e.target.value)}
                              data-testid={`slot-${slot.id}`}
                              autoComplete="off"
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
                            <label htmlFor={`kanji-input-${slot.id}`} style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text)' }}>
                              {slot.label}
                            </label>
                            <input
                              id={`kanji-input-${slot.id}`}
                              name={`kanji_${slot.id}`}
                              type="text"
                              placeholder={slot.id.endsWith('01') || slot.id.endsWith('02') || slot.id.endsWith('03') || slot.id.endsWith('04') || slot.id.endsWith('05') ? '漢字を入力' : 'ひらがなで入力'}
                              className={styles.textInput}
                              style={{ height: '38px', fontSize: '14px' }}
                              value={answers[slot.id] || ''}
                              onChange={e => handleInputChange(slot.id, e.target.value)}
                              data-testid={`slot-${slot.id}`}
                              autoComplete="off"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* その他の設問 */}
                  {sec.slots
                    .filter(s => !(isRikaSubGroup && s.questionNumber === '1'))
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
                              id={`open-input-${slot.id}`}
                              name={`open_${slot.id}`}
                              placeholder={
                                currentSubject === 'kokugo'
                                  ? '記述の答えを入力（提出時に採点要素・キーワード判定が確認できます）'
                                  : '記述の答えを入力（提出時に自己採点要素を確認できます）'
                              }
                              className={styles.textArea}
                              style={{ height: currentSubject === 'kokugo' ? '90px' : '70px' }}
                              value={currentAns}
                              onChange={e => handleInputChange(slot.id, e.target.value)}
                              data-testid={`slot-${slot.id}`}
                              autoComplete="off"
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
                            id={`numeric-input-${slot.id}`}
                            name={`numeric_${slot.id}`}
                            type="number"
                            placeholder="数値を入力"
                            className={styles.textInput}
                            value={currentAns}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                            autoComplete="off"
                          />
                        ) : (slot.stage2Options || slot.options) ? (
                          <div
                            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                            data-testid={`slot-${slot.id}`}
                            data-value={currentAns}
                          >
                            {(() => {
                              const opts = (stage === 2 && slot.stage2Options) ? slot.stage2Options : (slot.options || []);
                              const symbolList = opts.map(o => o.trim().slice(0, 1)).filter(s => s.length > 0);
                              return (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {symbolList.map(sym => {
                                    const isSelected = currentAns === sym;
                                    return (
                                      <button
                                        key={sym}
                                        type="button"
                                        onClick={() => {
                                          handleInputChange(slot.id, isSelected ? '' : sym);
                                        }}
                                        style={{
                                          minWidth: '44px',
                                          height: '42px',
                                          padding: '6px 16px',
                                          borderRadius: '8px',
                                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                          background: isSelected ? 'var(--primary)' : 'var(--surface)',
                                          color: isSelected ? '#ffffff' : 'var(--text)',
                                          fontWeight: isSelected ? 700 : 600,
                                          cursor: 'pointer',
                                          fontSize: '16px',
                                          boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                                          transition: 'all 120ms ease',
                                        }}
                                        data-testid={`quick-btn-${slot.id}-${sym}`}
                                        aria-pressed={isSelected}
                                      >
                                        {sym}
                                      </button>
                                    );
                                  })}
                                  {currentAns && (
                                    <span
                                      style={{
                                        fontSize: '13px',
                                        color: 'var(--primary)',
                                        fontWeight: 700,
                                        marginLeft: '4px',
                                      }}
                                    >
                                      ✓ 選択中: 【{currentAns}】
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input
                              id={`term-input-${slot.id}`}
                              name={`term_${slot.id}`}
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
                              autoComplete="off"
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
              );
            })}
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              className={styles.submitExamBtn}
              onClick={handleOpenSubmitConfirm}
              data-testid="submit-exam-btn"
            >
              こたえを出して採点する
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '6px' }}>
              ※ 制限時間（{currentSubjectData.timeLimitMinutes}分）がゼロになると自動で提出・採点に進みます。
            </div>
          </div>
        </section>
      </main>





      {/* 過去の採点カルテ・成績表モーダル */}
      {showHistoryModal && (
        <FinalExamHistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {/* 提出確認ダイアログ */}
      <SubmitConfirmModal
        isOpen={showSubmitConfirmModal}
        unansweredCount={unansweredCount}
        onConfirm={() => handleProceedSubmit(false)}
        onCancel={() => setShowSubmitConfirmModal(false)}
      />

      {/* 試験一時停止・中断確認ポップアップ */}
      <PauseConfirmModal
        isOpen={isPaused}
        title="試験を一時停止中"
        description={
          <>
            試験タイマーと進行を一時停止しています。<br />
            一息ついて、どうするか選んでね。
          </>
        }
        resumeLabel="▶ 試験をつづける"
        saveQuitLabel="💾 ここまでの解答を残してホームへ"
        saveQuitTitle="解答した内容を保存してホームへ戻ります"
        resetLabel="🔄 この試験をリセットして最初から（ホームへ）"
        onResume={() => setIsPaused(false)}
        onSaveAndQuit={() => {
          savePausedAnswering({
            version: 1,
            year: currentYear,
            subject: currentSubject,
            answers,
            currentPage,
            remainingSeconds: subjectTimes[currentSubject] ?? 0,
            timestamp: Date.now(),
          });
          setIsPaused(false);
          navigate('/');
        }}
        onResetAndQuit={() => {
          clearPausedAnswering(currentYear, currentSubject);
          clearPendingReview(currentYear, currentSubject);
          clearFinalizedReview(currentYear, currentSubject);
          setAnswers({});
          setIsPaused(false);
          navigate('/');
        }}
      />
    </div>
  );
};
