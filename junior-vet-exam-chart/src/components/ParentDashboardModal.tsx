import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../db';
import { ALL_PROGRESS_SKILLS } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { getMemoryRetention } from '../utils/memory-retention';
import { getTodayStudyStats, type TodayStudyStats } from '../utils/progress-analytics';
import { getPointsSummary, type PointsSummary } from '../utils/points-manager';
import { REFERENCE_BOOKS, type ReferenceBookInfo } from '../data/extra-history-80';
import { getRefBookProgress, type RefBookProgress } from '../utils/reference-book-store';
import { getSkillStage } from '../utils/mastery-helper';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import type { FinalChallengeResult } from '../types';
import { getQuestionReports, toggleReportResolved, deleteQuestionReport, type QuestionReportItem } from '../utils/question-reports';
import styles from './ParentDashboardModal.module.css';
import {
  runMentalCareMigration,
  getSharedWeatherMap,
  getSharedWeeklySummaries,
  getSharedParentRequests,
  getSharedCareCards,
  getSharedCareSignal,
  isCareSignalActive,
  acknowledgeCareSignal,
  isParentPinSet,
  verifyParentPin,
  setParentPin,
  resetParentPinAndSharedData,
  getParentAuditLogs,
  getParentPinLockoutStatus,
  generateParentGuidance,
  type ParentAuditLogEntry,
  type WeatherType,
  type SharedCareSignal,
  type ParentRequestType,
  type SharedCareCard,
  type SharedWeeklySummary,
  type SharedWeatherDaily,
  type SharedParentRequestMap,
} from '../utils/mental-care';
import { useBodyScrollLock } from '../utils/use-body-scroll-lock';

interface ParentDashboardModalProps {
  onClose: () => void;
  onStartWeaknessQuiz?: (skillId: string) => void;
  onInspectQuestion?: (questionId: string) => void;
}

interface DailyCount {
  dateStr: string; // MM/DD
  fullDate: string; // YYYY-MM-DD
  count: number;
}

// 獣医師チャレンジの科目抽出
const getExamSubjectFromId = (examId: string): 'rika' | 'sansu' | 'shakai' | 'kokugo' => {
  if (examId.includes('kokugo')) return 'kokugo';
  if (examId.includes('sansu')) return 'sansu';
  if (examId.includes('shakai')) return 'shakai';
  return 'rika';
};

// 獣医師チャレンジの科目メタ情報
const getExamSubjectMeta = (subjectOrExamId: string) => {
  const sub = subjectOrExamId.includes('kokugo')
    ? 'kokugo'
    : subjectOrExamId.includes('sansu')
    ? 'sansu'
    : subjectOrExamId.includes('shakai')
    ? 'shakai'
    : subjectOrExamId === 'rika' || subjectOrExamId.includes('rika')
    ? 'rika'
    : (subjectOrExamId as 'rika' | 'sansu' | 'shakai' | 'kokugo');

  switch (sub) {
    case 'sansu':
      return { subject: 'sansu' as const, label: '算数', icon: '📐', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    case 'shakai':
      return { subject: 'shakai' as const, label: '社会', icon: '🗾', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    case 'kokugo':
      return { subject: 'kokugo' as const, label: '国語', icon: '📖', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' };
    case 'rika':
    default:
      return { subject: 'rika' as const, label: '理科', icon: '🧪', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
  }
};

// 獣医師チャレンジの年度抽出
const getExamYearLabel = (examId: string): string => {
  const match = examId.match(/202\d/);
  return match ? `${match[0]}年度` : '';
};

// ごほうびバッジ情報の判定（60点合格、80点銅、90点銀、100点金）
const getRewardBadgeInfo = (score: number) => {
  if (score >= 100) return { label: '🥇 金のマスターバッジ獲得！', color: '#b45309', bg: '#fef3c7' };
  if (score >= 90) return { label: '🥈 銀のドクターバッジ獲得！', color: '#475569', bg: '#f1f5f9' };
  if (score >= 80) return { label: '🥉 銅のドクターバッジ獲得！', color: '#92400e', bg: '#ffedd5' };
  if (score >= 60) return { label: '🎖️ 合格ドクター認定証 授与！', color: '#15803d', bg: '#dcfce7' };
  return { label: `🐾 合格ラインまであと${60 - score}点`, color: '#64748b', bg: '#f8fafc' };
};

// JST 短縮日付 (MM/DD)
const formatExamShortDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(timestamp));
};

// JST 日時 (YYYY/MM/DD HH:mm)
const formatExamDateTime = (timestamp: number) => {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({
  onClose,
  onStartWeaknessQuiz,
  onInspectQuestion,
}) => {
  useBodyScrollLock();
  const [activeTab, setActiveTab] = useState<'charts' | 'advice' | 'mental' | 'reports'>('charts');

  // こころ機能データ（保護者開示データのみ・private非参照）
  const [sharedWeatherMap, setSharedWeatherMap] = useState<SharedWeatherDaily>({});
  const [sharedRequests, setSharedRequests] = useState<SharedParentRequestMap>({});
  const [sharedCareCards, setSharedCareCards] = useState<SharedCareCard[]>([]);
  const [sharedWeeklySummaries, setSharedWeeklySummaries] = useState<Record<string, SharedWeeklySummary>>({});
  const [careSignal, setCareSignal] = useState<SharedCareSignal | null>(null);

  // 保護者PIN管理
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(() => isParentPinSet());
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => !isParentPinSet());
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetAgreed, setResetAgreed] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<ParentAuditLogEntry[]>(() => getParentAuditLogs());
  const [lockoutStatus, setLockoutStatus] = useState(() => getParentPinLockoutStatus());
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 親のアクションチェックリスト
  const [parentChecklist, setParentChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('junior_vet_parent_action_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [actionDoneToast, setActionDoneToast] = useState<string | null>(null);
  const [showAllWeatherAdvice, setShowAllWeatherAdvice] = useState<boolean>(false);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // 初期化・データ移行
  useEffect(() => {
    isMountedRef.current = true;
    runMentalCareMigration();

    const hasPin = isParentPinSet();
    setIsPinConfigured(hasPin);
    setIsPinUnlocked(!hasPin);

    setSharedWeatherMap(getSharedWeatherMap());
    setSharedRequests(getSharedParentRequests());
    setSharedCareCards(getSharedCareCards());
    setSharedWeeklySummaries(getSharedWeeklySummaries());
    setCareSignal(getSharedCareSignal());

    return () => {
      isMountedRef.current = false;
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, []);

  
  // ロックアウト状態と監査ログの更新
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current && typeof window !== 'undefined') {
        setLockoutStatus(getParentPinLockoutStatus());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 本日日付 (JST)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()).replace(/\//g, '-');
  }, []);

  // 今日の共有お天気とリクエスト（本日データがなければ最新の記録を参照）
  const sortedWeatherDates = useMemo(() => Object.keys(sharedWeatherMap).sort(), [sharedWeatherMap]);
  const todaySharedWeather = sharedWeatherMap[todayStr] || (
    sortedWeatherDates.length > 0 ? sharedWeatherMap[sortedWeatherDates[sortedWeatherDates.length - 1]] : undefined
  );
  
  const sortedRequestDates = useMemo(() => Object.keys(sharedRequests).sort(), [sharedRequests]);
  const latestRequest = sortedRequestDates.length > 0 ? sharedRequests[sortedRequestDates[sortedRequestDates.length - 1]] : undefined;

  // ガイダンス生成
  const guidance = useMemo(() => {
    return generateParentGuidance(
      todaySharedWeather?.weather || null,
      latestRequest?.request
    );
  }, [todaySharedWeather, latestRequest]);

  // 親のケアアクション トグル
  const handleToggleParentAction = (actionId: string) => {
    sound.playAnimalHappy();
    const next = { ...parentChecklist, [actionId]: !parentChecklist[actionId] };
    setParentChecklist(next);
    localStorage.setItem('junior_vet_parent_action_checklist', JSON.stringify(next));

    if (next[actionId]) {
      fireConfetti({ count: 20 });
      setActionDoneToast('ナイスサポート！お子さんの心の安全基地が守られました🐾');
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      actionTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setActionDoneToast(null);
        }
      }, 3500);
    }
  };

  // 警戒サイン解除
  const handleAcknowledgeSignal = () => {
    sound.playPop();
    acknowledgeCareSignal();
    setCareSignal(getSharedCareSignal());
  };

  // PINロック解除
  const handleUnlockPin = async () => {
    const res = await verifyParentPin(pinInput);
    if (res.success) {
      sound.playPop();
      setIsPinUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      sound.playPop();
      setPinError(res.isLocked ? '連続失敗のため一時的にロックされています' : 'PIN番号が違います');
    }
  };

  // PIN新規設定 (2回入力検証)
  const handleSetNewPin = async () => {
    if (newPinInput.length !== 4 || !/^\d+$/.test(newPinInput)) {
      sound.playPop();
      setPinError('4桁の半角数字を入力してください');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      sound.playPop();
      setPinError('確認用の番号が一致しません');
      return;
    }
    await setParentPin(newPinInput);
    sound.playFanfare();
    setIsPinConfigured(true);
    setIsPinUnlocked(true);
    setShowPinSetup(false);
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setAuditLogs(getParentAuditLogs());
  };

  // PINリセット実行（2段階確認後）
  const handleExecuteResetPin = () => {
    if (!resetAgreed) return;
    resetParentPinAndSharedData();
    sound.playPop();
    setIsPinConfigured(false);
    setIsPinUnlocked(false);
    setShowResetConfirm(false);
    setResetAgreed(false);
    setSharedWeatherMap({});
    setSharedRequests({});
    setSharedCareCards([]);
    setSharedWeeklySummaries({});
    setPinError('');
    setAuditLogs(getParentAuditLogs());
  };

  // 長押し3秒タイマー
  const handleStartHold = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    const start = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, Math.round((elapsed / 3000) * 100));
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        sound.playPop();
        setShowPinSetup(true);
        setHoldProgress(0);
      }
    }, 50);
  };

  const handleEndHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const [reports, setReports] = useState<QuestionReportItem[]>(() => getQuestionReports());
  const [examResults, setExamResults] = useState<FinalChallengeResult[]>([]);
  const [selectedExamSubject, setSelectedExamSubject] = useState<'all' | 'rika' | 'sansu' | 'shakai' | 'kokugo'>('all');
  const [selectedExamPlotIndex, setSelectedExamPlotIndex] = useState<number | null>(null);

  // 教科別フィルタリングされた認定試験履歴
  const filteredExamResults = useMemo(() => {
    if (selectedExamSubject === 'all') return examResults;
    return examResults.filter(r => getExamSubjectFromId(r.examId) === selectedExamSubject);
  }, [examResults, selectedExamSubject]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);

  // 本日の学習量（時間、解答数、正答率、連続日数、累計）
  const [pointsSummary, setPointsSummary] = useState<PointsSummary>(() => getPointsSummary());
  const [refBookProgressList, setRefBookProgressList] = useState<{
    book: ReferenceBookInfo;
    progress: RefBookProgress;
  }[]>(() => {
    return REFERENCE_BOOKS.map(book => ({
      book,
      progress: getRefBookProgress(book.id),
    }));
  });
  const [todayStats, setTodayStats] = useState<TodayStudyStats>({
    questionCount: 0,
    studyMinutes: 0,
    accuracy: 0,
    streakDays: 0,
    totalAttempts: 0,
    totalMinutes: 0,
  });

  // 親子のお約束メモ（localStorage永続化）
  const [rewardGoal, setRewardGoal] = useState<string>(() => {
    return localStorage.getItem('junior_vet_reward_goal') || '算数で80点取れたらケーキバイキング！';
  });
  const [rewardAchieved, setRewardAchieved] = useState<boolean>(() => {
    return localStorage.getItem('junior_vet_reward_achieved') === 'true';
  });
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [editGoalText, setEditGoalText] = useState<string>(rewardGoal);

  // 弱点テーマの保護者向け指導アドバイス展開状態
  const [expandedSkillIds, setExpandedSkillIds] = useState<string[]>([]);

  const toggleSkillExpand = (skillId: string) => {
    sound.playPop();
    setExpandedSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  // データ集計
  useEffect(() => {
    // 1. 認定試験履歴
    db.finalChallengeResults.orderBy('timestamp').toArray().then(res => {
      setExamResults(res);
    });

    // 2. 解答数・正答率
    db.attempts.toArray().then(attempts => {
      setTotalAttempts(attempts.length);
      const correct = attempts.filter(a => a.isCorrect).length;
      setTotalCorrect(correct);
    });

    // 3. 直近14日間の日別学習問題数
    db.dailySessions.toArray().then(sessions => {
      const now = new Date();
      const last14Days: DailyCount[] = [];

      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const fullDate = `${yyyy}-${mm}-${dd}`;
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

        // その日のセッションから問題数を算出
        const s = sessions.find(session => session.date === fullDate);
        const count = s ? (s.questionIds?.length || 0) : 0;

        last14Days.push({ dateStr, fullDate, count });
      }

      setDailyCounts(last14Days);
    });

    // 4. 今日の学習データ集計
    getTodayStudyStats().then(setTodayStats);

    const handlePointsUpdate = () => {
      setPointsSummary(getPointsSummary());
      setRefBookProgressList(
        REFERENCE_BOOKS.map(book => ({
          book,
          progress: getRefBookProgress(book.id),
        }))
      );
    };
    window.addEventListener('junior-vet-points-updated', handlePointsUpdate);
    return () => {
      window.removeEventListener('junior-vet-points-updated', handlePointsUpdate);
    };
  }, []);

  // 教科別マスター進度
  const rikaSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'rika');
  const sansuSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'sansu');
  const shakaiSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'shakai');
  const kokugoSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'kokugo');

  const rikaMastered = rikaSkills.filter(s => s.isMastered).length;
  const sansuMastered = sansuSkills.filter(s => s.isMastered).length;
  const shakaiMastered = shakaiSkills.filter(s => s.isMastered).length;
  const kokugoMastered = kokugoSkills.filter(s => s.isMastered).length;

  // 弱点テーマTOP3（記憶定着メーターが低い順）
  const weakestSkills = [...ALL_PROGRESS_SKILLS]
    .map(s => ({ ...s, retention: getMemoryRetention(s.id) }))
    .sort((a, b) => a.retention - b.retention)
    .slice(0, 3);

  // A4弱点克服チェックシート用データ（TOP3単元）
  const worksheetItems = weakestSkills.map((skill, idx) => {
    const enhancement = THEME_ENHANCEMENTS[skill.id];
    return {
      number: idx + 1,
      skillId: skill.id,
      subjectLabel: skill.subject === 'rika' ? '🧪 理科' : skill.subject === 'sansu' ? '📐 算数' : skill.subject === 'shakai' ? '🗾 社会' : '📖 国語',
      title: skill.title,
      tip: enhancement?.flashCard.tip || skill.nextGoalHint || '基本の考え方をしっかり整理しよう。',
      examPoint: enhancement?.flashCard.examPoint || '',
      question: enhancement?.flashCard.question || `【${skill.title}】の重要ポイントを説明し、解法の道筋を書きなさい。`,
      answer: enhancement?.flashCard.answer || '基本解説を参照',
      retention: skill.retention,
    };
  });

  // 元気にした動物たち（症例全快数）
  const masteredAnimalCount = ALL_PROGRESS_SKILLS.filter(s => {
    const stage = getSkillStage(s.id, s.stage);
    return stage === 'M4' || stage === 'M5';
  }).length;

  // お約束メモの保存
  const handleSaveGoal = () => {
    sound.playPop();
    setRewardGoal(editGoalText);
    localStorage.setItem('junior_vet_reward_goal', editGoalText);
    setIsEditingGoal(false);
  };

  const handleToggleRewardAchieved = () => {
    const next = !rewardAchieved;
    setRewardAchieved(next);
    localStorage.setItem('junior_vet_reward_achieved', String(next));
    if (next) {
      sound.playFanfare();
      fireConfetti({ count: 40 });
    } else {
      sound.playPop();
    }
  };

  // 印刷
  const handlePrint = () => {
    sound.playPop();
    window.print();
  };

  // 最大解答数（棒グラフのスケール用）
  const maxDailyCount = Math.max(15, ...dailyCounts.map(d => d.count));

  return (
    <>
      <div
        className={styles.screenOnlyModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-primary, #f8fafc)',
          width: '100%',
          height: '100%',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        data-testid="parent-dashboard-modal"
      >
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--surface, #ffffff)',
          boxShadow: '0 0 32px rgba(0, 0, 0, 0.08)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* フル画面ヘッダー（左上統一戻るボタン完備） */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              aria-label="ホームへ戻る"
              data-testid="parent-back-btn"
            >
              ← 戻る
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>👨‍⚕️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                  指導医ログ
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  見習い獣医さんの学習量・理解度の推移・ほめ言葉ヒント・A4弱点印刷
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              padding: '4px 8px',
            }}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* タブナビゲーション */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-subtle)',
            padding: '4px 16px 0',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {(() => {
            const unresolvedCount = reports.filter(r => !r.resolved).length;
            return [
              { id: 'charts', label: '📈 成績カルテ', badge: 0 },
              { id: 'advice', label: '💬 コミュニケーション', badge: 0 },
              { id: 'mental', label: `💚 こころ${careSignal?.active ? ' 🔴' : ''}`, badge: careSignal?.active ? 1 : 0 },
              {
                id: 'reports',
                label: `🛠️ 修正依頼${unresolvedCount > 0 ? ` (${unresolvedCount})` : ''}`,
                badge: unresolvedCount,
              },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playPop();
                  setActiveTab(tab.id as any);
                }}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--surface, #ffffff)' : 'transparent',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-subtle)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                data-testid={`parent-tab-${tab.id}`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      lineHeight: '1.2',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ));
          })()}
        </div>

        {/* コンテンツエリア */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {activeTab === 'charts' && (
            <>
              {/* サマリーカード 4枚（本日の学習実績を最優先表示） */}
              <div className={styles.summaryGrid}>
                {/* 1. 今日の学習時間（最重要・緑系） */}
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(34, 197, 94, 0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>⏱️ 本日の学習時間</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#15803d', margin: '4px 0' }} data-testid="today-study-minutes">
                    {todayStats.studyMinutes > 0 ? `約 ${todayStats.studyMinutes} 分` : '0 分'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#166534' }}>
                    {todayStats.studyMinutes >= 5 ? '目標5分クリア！💮' : todayStats.studyMinutes > 0 ? '毎日コツコツ継続中！' : '本日の学習はこれから'}
                  </div>
                </div>

                {/* 2. 今日の解答数（最重要・青系） */}
                <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(59, 130, 246, 0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>📝 本日の解答数</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#1d4ed8', margin: '4px 0' }} data-testid="today-question-count">
                    {todayStats.questionCount} 問
                  </div>
                  <div style={{ fontSize: '10px', color: '#1e40af' }}>
                    {todayStats.questionCount > 0 ? `正答率: ${todayStats.accuracy}%` : '目安: 1日10問'}
                  </div>
                </div>

                {/* 3. 連続学習日数（習慣化・黄系） */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>🔥 連続学習日数</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#b45309', margin: '4px 0' }} data-testid="parent-streak-days">
                    {todayStats.streakDays} 日
                  </div>
                  <div style={{ fontSize: '10px', color: '#78350f' }}>
                    {todayStats.streakDays > 0 ? '毎日の習慣が定着中！' : '今日からスタート！'}
                  </div>
                </div>

                {/* 4. 累計学習実績＆動物（優先度を下げて1枚に統合・ピンク系） */}
                <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9d174d', fontWeight: 'bold' }}>🏆 累計学習実績</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#db2777', margin: '4px 0' }}>
                    {todayStats.totalAttempts} 問
                  </div>
                  <div style={{ fontSize: '10px', color: '#be185d' }}>
                    総時間 約{todayStats.totalMinutes}分 / 元気にした動物 {masteredAnimalCount}匹
                  </div>
                  <div style={{ fontSize: '10px', color: '#9d174d', fontWeight: 'bold', marginTop: '4px', borderTop: '1px dashed #fbcfe8', paddingTop: '3px' }} data-testid="summary-points-status">
                    🐾 元気のもと: {pointsSummary.totalPoints}こ（{pointsSummary.currentRank.badge} {pointsSummary.currentRank.title}）
                  </div>
                </div>
              </div>

              {/* 直近14日間の日別学習問題数グラフ（SVGバーチャート） */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                    📈 直近14日間の学習問題数推移
                  </h4>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>
                    ―― 推奨ライン（1日10問）
                  </span>
                </div>

                {/* SVGチャート */}
                <div style={{ width: '100%', height: '140px' }}>
                  <svg viewBox="0 0 560 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* 背景グリッド線と目標ライン (10問) */}
                    <line x1="20" y1="50" x2="550" y2="50" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x="5" y="54" fontSize="10" fill="#2563eb" fontWeight="bold">10問</text>

                    <line x1="20" y1="110" x2="550" y2="110" stroke="#e2e8f0" strokeWidth="1" />

                    {/* 棒グラフ */}
                    {dailyCounts.map((d, idx) => {
                      const barWidth = 24;
                      const gap = (530 - dailyCounts.length * barWidth) / (dailyCounts.length - 1);
                      const x = 30 + idx * (barWidth + gap);
                      const height = Math.min(100, (d.count / maxDailyCount) * 100);
                      const y = 110 - height;
                      const isToday = idx === dailyCounts.length - 1;

                      return (
                        <g key={d.fullDate}>
                          {/* バー */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={height}
                            rx={4}
                            fill={isToday ? '#2563eb' : d.count >= 10 ? '#3b82f6' : d.count > 0 ? '#93c5fd' : '#e2e8f0'}
                          />
                          {/* 数値ラベル */}
                          {d.count > 0 && (
                            <text
                              x={x + barWidth / 2}
                              y={y - 4}
                              fontSize="9"
                              fontWeight="bold"
                              fill="#1e293b"
                              textAnchor="middle"
                            >
                              {d.count}
                            </text>
                          )}
                          {/* 日付ラベル */}
                          <text
                            x={x + barWidth / 2}
                            y={124}
                            fontSize="9"
                            fill={isToday ? '#2563eb' : '#64748b'}
                            fontWeight={isToday ? 'bold' : 'normal'}
                            textAnchor="middle"
                          >
                            {d.dateStr}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '4px' }}>
                  毎日10問ずつコツコツ進めると、忘却曲線に基づき長期記憶に定着します。
                </div>
              </div>

              {/* 4教科の理解度・マスター進度（全テーマ） */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                  📊 4教科の症例カルテ全快進度（全{ALL_PROGRESS_SKILLS.length}テーマ）
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: '🧪 理科', count: rikaSkills.length, mastered: rikaMastered, color: '#ec4899', bg: '#fdf2f8' },
                    { label: '📐 算数', count: sansuSkills.length, mastered: sansuMastered, color: '#3b82f6', bg: '#eff6ff' },
                    { label: '🗾 社会', count: shakaiSkills.length, mastered: shakaiMastered, color: '#10b981', bg: '#f0fdf4' },
                    { label: '📖 国語', count: kokugoSkills.length, mastered: kokugoMastered, color: '#e11d48', bg: '#fff1f2' },
                  ].map(sub => {
                    const percent = Math.round((sub.mastered / sub.count) * 100);
                    return (
                      <div key={sub.label} style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: sub.color }}>{sub.label}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                            全快: <strong>{sub.mastered}</strong> / {sub.count} 症例達成 ({percent}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(8, percent)}%`, height: '100%', background: sub.color, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 獣医師チャレンジのスコア推移グラフ */}
              {/* 知識の処方箋マスター進度（名作参考書特訓） */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }} data-testid="prescription-progress-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                    💊 知識の処方箋マスター進度（名作参考書特訓）
                  </h4>
                  <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'bold' }}>
                    入試頻出の特効知識を処方！
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
                  名作参考書から厳選した重要知識をクイズ形式で特訓した進捗です。
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {refBookProgressList.map(({ book, progress }) => {
                    const isAvailable = book.status === 'available';
                    const masteredCount = progress.masteredIds.length;
                    const totalCount = book.availableQuestionsCount;
                    const percent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

                    return (
                      <div
                        key={book.id}
                        style={{
                          background: 'var(--surface)',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          opacity: isAvailable ? 1 : 0.75,
                        }}
                        data-testid={`prescription-card-${book.id}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{book.coverEmoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' }}>
                              {book.title}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isAvailable ? '#ccfbf1' : '#f1f5f9',
                                color: isAvailable ? '#0f766e' : '#64748b',
                                fontWeight: 'bold',
                              }}
                            >
                              {book.badgeText}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                            {isAvailable ? (
                              <>
                                処方完了: <strong>{masteredCount}</strong> / {totalCount} 人 ({percent}%)
                                {progress.clearedSessionsCount > 0 && (
                                  <span style={{ marginLeft: '6px', color: '#0d9488', fontWeight: 'bold' }}>
                                    （完了 {progress.clearedSessionsCount}回）
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>近日調合予定</span>
                            )}
                          </span>
                        </div>

                        {/* プログレスバー */}
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: isAvailable ? `${Math.max(masteredCount > 0 ? 8 : 0, percent)}%` : '0%',
                              height: '100%',
                              background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>

                        {isAvailable && progress.lastStudiedAt && (
                          <div style={{ fontSize: '10px', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '4px' }}>
                            最終処方日時: {progress.lastStudiedAt}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 獣医師チャレンジのスコア推移グラフ */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                    🏆 獣医師チャレンジの得点推移（実力判定）
                  </h4>
                  {/* ごほうび基準ライン凡例 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#15803d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '0', borderTop: '2px dashed #22c55e' }} />
                      🎖️ 合格 (60点)
                    </span>
                    <span style={{ color: '#b45309', opacity: 0.85 }}>⋯ 🥉 80点</span>
                    <span style={{ color: '#475569', opacity: 0.85 }}>⋯ 🥈 90点</span>
                    <span style={{ color: '#ca8a04', opacity: 0.85 }}>⋯ 🥇 100点</span>
                  </div>
                </div>

                {/* 教科切り替えセグメントコントロール */}
                <div
                  role="tablist"
                  aria-label="獣医師チャレンジ 教科切り替え"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e2e8f0',
                    padding: '4px',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {[
                    { id: 'all' as const, label: 'すべて', icon: '🌈', color: '#334155', count: examResults.length },
                    { id: 'rika' as const, label: '理科', icon: '🧪', color: '#0d9488', count: examResults.filter(r => r.examId.includes('rika')).length },
                    { id: 'sansu' as const, label: '算数', icon: '📐', color: '#2563eb', count: examResults.filter(r => r.examId.includes('sansu')).length },
                    { id: 'shakai' as const, label: '社会', icon: '🗾', color: '#16a34a', count: examResults.filter(r => r.examId.includes('shakai')).length },
                    { id: 'kokugo' as const, label: '国語', icon: '📖', color: '#e11d48', count: examResults.filter(r => r.examId.includes('kokugo')).length },
                  ].map(tab => {
                    const isSelected = selectedExamSubject === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        data-testid={`exam-filter-${tab.id}`}
                        onClick={() => {
                          setSelectedExamSubject(tab.id);
                          setSelectedExamPlotIndex(null);
                        }}
                        style={{
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '7px',
                          fontSize: '12px',
                          fontWeight: isSelected ? 'bold' : '500',
                          background: isSelected ? '#ffffff' : 'transparent',
                          color: isSelected ? tab.color : '#64748b',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            background: isSelected ? `${tab.color}18` : '#cbd5e1',
                            color: isSelected ? tab.color : '#475569',
                            fontWeight: 'bold',
                          }}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filteredExamResults.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '12px' }}>
                    {selectedExamSubject === 'all'
                      ? 'まだ認定試験のデータがありません。ホーム画面の「獣医師チャレンジ」を受験すると、ここに点数の伸びが折れ線グラフで記録されます。'
                      : `まだ「${selectedExamSubject === 'rika' ? '🧪 理科' : selectedExamSubject === 'sansu' ? '📐 算数' : selectedExamSubject === 'shakai' ? '🗾 社会' : '📖 国語'}」の受験データがありません。「獣医師チャレンジ」を受験すると、ここに教科別の点数推移が記録されます。`}
                  </div>
                ) : (
                  <>
                    <div style={{ width: '100%', height: '175px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <svg viewBox="0 0 540 170" style={{ width: '100%', minWidth: '420px', height: '100%', overflow: 'visible' }}>
                        {/* 100点 (金) */}
                        <line x1="30" y1="25" x2="520" y2="25" stroke="#eab308" strokeWidth="1" strokeDasharray="2 3" opacity="0.45" />
                        <text x="6" y="28" fontSize="9" fill="#ca8a04" fontWeight="600">100点</text>

                        {/* 80点 (銅) */}
                        <line x1="30" y1="49" x2="520" y2="49" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
                        <text x="12" y="52" fontSize="9" fill="#b45309" fontWeight="600">80点</text>

                        {/* 60点 (合格ライン 認定証) */}
                        <line x1="30" y1="73" x2="520" y2="73" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" />
                        <text x="6" y="76" fontSize="10" fill="#15803d" fontWeight="bold">60点</text>

                        {/* 底辺 0点 */}
                        <line x1="30" y1="135" x2="520" y2="135" stroke="#cbd5e1" strokeWidth="1" />
                        <text x="16" y="138" fontSize="9" fill="#94a3b8">0点</text>

                        {/* 折れ線プロット */}
                        {(() => {
                          const activeIdx = selectedExamPlotIndex !== null && selectedExamPlotIndex < filteredExamResults.length
                            ? selectedExamPlotIndex
                            : filteredExamResults.length - 1;

                          const points = filteredExamResults.map((r, i) => {
                            const x = filteredExamResults.length === 1
                              ? 275
                              : 55 + (i / (filteredExamResults.length - 1)) * 445;
                            const y = 135 - (Math.min(100, Math.max(0, r.score)) / 100) * 110;
                            const subMeta = getExamSubjectMeta(r.examId);
                            const yearLabel = getExamYearLabel(r.examId);
                            const dateLabel = formatExamShortDate(r.timestamp);
                            return { x, y, r, subMeta, yearLabel, dateLabel, origIndex: i };
                          });

                          const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');
                          const lineColor = selectedExamSubject === 'all'
                            ? '#f59e0b'
                            : getExamSubjectMeta(selectedExamSubject).color;

                          return (
                            <>
                              {points.length > 1 && (
                                <polyline
                                  fill="none"
                                  stroke={lineColor}
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={polylineStr}
                                />
                              )}
                              {points.map((p, idx) => {
                                const isSelected = activeIdx === idx;
                                const isPassed = p.r.score >= 60;
                                const ptColor = selectedExamSubject === 'all' ? p.subMeta.color : lineColor;

                                return (
                                  <g
                                    key={idx}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedExamPlotIndex(idx)}
                                  >
                                    {/* 選択中の外側ハイライトリング */}
                                    {isSelected && (
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="10"
                                        fill={ptColor}
                                        opacity="0.25"
                                      />
                                    )}
                                    {/* 点本体 */}
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r={isSelected ? 6 : 4.5}
                                      fill={ptColor}
                                      stroke="#ffffff"
                                      strokeWidth={isSelected ? 2.5 : 2}
                                    />
                                    {/* 得点表示 */}
                                    <text
                                      x={p.x}
                                      y={p.y - 9}
                                      fontSize="10"
                                      fontWeight="bold"
                                      fill={isPassed ? '#15803d' : '#92400e'}
                                      textAnchor="middle"
                                    >
                                      {p.r.score}点
                                    </text>
                                    {/* 横軸ラベル 1行目: 回数 & アイコン/年度 */}
                                    <text
                                      x={p.x}
                                      y={148}
                                      fontSize="9"
                                      fontWeight={isSelected ? 'bold' : 'normal'}
                                      fill={isSelected ? 'var(--text)' : '#64748b'}
                                      textAnchor="middle"
                                    >
                                      {selectedExamSubject === 'all'
                                        ? `${p.subMeta.icon}第${idx + 1}回`
                                        : `第${idx + 1}回 (${p.yearLabel})`}
                                    </text>
                                    {/* 横軸ラベル 2行目: 日付 */}
                                    <text
                                      x={p.x}
                                      y={160}
                                      fontSize="8"
                                      fill="#94a3b8"
                                      textAnchor="middle"
                                    >
                                      {p.dateLabel}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* 選択された試験回の詳細インスペクターカード */}
                    {(() => {
                      const activeIdx = selectedExamPlotIndex !== null && selectedExamPlotIndex < filteredExamResults.length
                        ? selectedExamPlotIndex
                        : filteredExamResults.length - 1;
                      const activeResult = filteredExamResults[activeIdx];
                      if (!activeResult) return null;
                      const meta = getExamSubjectMeta(activeResult.examId);
                      const year = getExamYearLabel(activeResult.examId);
                      const dateStr = formatExamDateTime(activeResult.timestamp);
                      const badge = getRewardBadgeInfo(activeResult.score);

                      return (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: `1.5px solid ${meta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: meta.bg,
                                color: meta.color,
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              {meta.icon} {meta.label}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text)' }}>
                              {year} Stage {activeResult.stage}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              （{dateStr} 受験）
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: meta.color }}>
                              {activeResult.score}点
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
              {/* 現在の弱点テーマTOP3 */}
              <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text)', fontWeight: 'bold' }}>
                  🩺 お子さんの「現在復習すべき弱点テーマ」TOP 3
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {weakestSkills.map(skill => {
                    const isExpanded = expandedSkillIds.includes(skill.id);
                    const enhancement = THEME_ENHANCEMENTS[skill.id];

                    return (
                      <div
                        key={skill.id}
                        style={{
                          background: 'var(--surface)',
                          border: isExpanded ? '1.5px solid #3b82f6' : '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpanded ? '0 4px 12px rgba(59, 130, 246, 0.08)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                                {skill.subject === 'rika' ? '🧪 理科' : skill.subject === 'sansu' ? '📐 算数' : '🗾 社会'}
                              </span>
                              <strong style={{ fontSize: '13px' }}>{skill.title}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              忘却メーター定着度: <strong>{skill.retention}%</strong>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleSkillExpand(skill.id)}
                            style={{
                              background: isExpanded ? '#dbeafe' : '#f0fdf4',
                              color: isExpanded ? '#1e40af' : '#166534',
                              border: `1px solid ${isExpanded ? '#bfdbfe' : '#bbf7d0'}`,
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            data-testid={`toggle-advice-btn-${skill.id}`}
                          >
                            {isExpanded ? '▲ ガイドを閉じる' : '💡 急所・指導ヒントを見る'}
                          </button>
                        </div>

                        {/* 保護者向け 急所・指導処方箋（アコーディオン展開） */}
                        {isExpanded && (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                            data-testid={`advice-content-${skill.id}`}
                          >
                            {/* 急所ポイント */}
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                                💡 お子さんのつまずき急所:
                              </div>
                              <div style={{ color: '#334155', lineHeight: '1.4' }}>
                                {enhancement?.flashCard.examPoint || skill.nextGoalHint || '基本の考え方をしっかり整理させましょう。'}
                              </div>
                            </div>

                            {/* 家庭での声かけ・解法のコツ */}
                            {enhancement?.flashCard.tip && (
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#047857', marginBottom: '2px' }}>
                                  🗣️ 家庭での声かけ・解法のコツ:
                                </div>
                                <div style={{ color: '#334155', lineHeight: '1.4' }}>
                                  {enhancement.flashCard.tip}
                                </div>
                              </div>
                            )}

                            {/* 出題例と答え */}
                            {enhancement?.flashCard.question && (
                              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px 10px' }}>
                                <div style={{ fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                                  📝 出題される問題の例:
                                </div>
                                <div style={{ color: '#0f172a', fontWeight: '500', marginBottom: '4px' }}>
                                  {enhancement.flashCard.question}
                                </div>
                                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                                  ✅ 正解: {enhancement.flashCard.answer}
                                </div>
                              </div>
                            )}

                            {/* お子さんにやらせたい場合の連携ボタン */}
                            {onStartWeaknessQuiz && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button
                                  onClick={() => {
                                    sound.playPop();
                                    // 保護者カルテは閉じずに、お子さんに解かせる暗記カードを前面に開く
                                    onStartWeaknessQuiz(skill.id);
                                  }}
                                  style={{
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '7px 14px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                                  }}
                                  data-testid={`start-quiz-btn-${skill.id}`}
                                >
                                  📱 お子さんにこの症例を解かせる（トリアージ・カードを起動）
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* A4弱点克服チェックシート印刷機能 */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🖨️</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#065f46', fontWeight: 'bold' }}>
                  A4弱点克服チェックシートを印刷（机での復習用）
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#047857', lineHeight: '1.5' }}>
                  弱点テーマの急所ポイントと解答記入欄を、家庭用プリンターでA4用紙1枚にきれいに印刷できます。<br />
                  実際の入試と同じように「紙と鉛筆」で書かせたい時にご活用ください。
                </p>
                <button
                  onClick={handlePrint}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  }}
                  data-testid="print-worksheet-btn"
                >
                  🖨️ A4弱点克服プリントを印刷（またはPDF保存）
                </button>
              </div>
            </>
          )}

          {/* ================= タブ2: コミュニケーション ＆ お約束 ================= */}
          {activeTab === 'advice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="parent-communication-tab">
              {/* アクション完了フィードバック */}
              {actionDoneToast && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'fadeIn 0.2s ease',
                  }}
                  data-testid="parent-action-done-toast"
                >
                  <span>🎉</span>
                  <span>{actionDoneToast}</span>
                </div>
              )}

              {/* 1. ナース猫ミケちゃんからの「今日かけたい言葉（承認・共感フレーズ）」最適化統合カード */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.5px solid #fde68a',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                }}
                data-testid="recommended-phrases-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '32px' }}>🐱</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#92400e', fontWeight: 800 }}>
                      ナース猫ミケちゃんからの「今日のお子さんへの声かけヒント」（今日かけたい言葉）
                    </h4>
                    <div style={{ fontSize: '11px', color: '#b45309' }}>
                      中学受験のモチベーションを高める具体的なほめ言葉・承認フレーズ
                    </div>
                  </div>
                </div>

                {/* フレーズ一覧 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                  {guidance.recommendedPhrases && guidance.recommendedPhrases.length > 0 ? (
                    guidance.recommendedPhrases.map(phrase => (
                      <div
                        key={phrase.id}
                        style={{
                          background: '#ffffff',
                          borderLeft: '4px solid #f59e0b',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px' }}>
                          💬 {phrase.title || phrase.situation}
                        </div>
                        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                          {phrase.detail || phrase.phrase}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        background: '#ffffff',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px' }}>
                        💬 努力と継続を認める声かけ
                      </div>
                      <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                        「毎日ちゃんと5分カルテを開いて解いているのが本当に偉いね！コツコツ続ける力は、入試本番で一番大きな武器になるよ。」
                      </div>
                    </div>
                  )}
                </div>

                {/* ミケちゃんのワンポイントアドバイス */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#78350f',
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>声かけのコツ:</strong> 結果（点数）だけでなく、「毎日机に向かった行動」や「途中で諦めず考え直したプロセス」を具体的に認めてあげると、自己肯定感と学習意欲が劇的に高まります。
                </div>
              </div>

              {/* 2. 家庭でできるケア行動（親のアクション・チェックリスト） */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  borderRadius: '16px',
                  padding: '18px 20px',
                }}
                data-testid="home-care-checklist-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>🍵</span>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#9a3412', fontWeight: 800 }}>
                      家庭でできるケア行動（親のアクション・チェックリスト）
                    </h4>
                  </div>
                  <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 700 }}>
                    タップして実行をチェック ✅
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {guidance.careActions.map(action => {
                    const isDone = !!parentChecklist[action.id];
                    return (
                      <div
                        key={action.id}
                        onClick={() => handleToggleParentAction(action.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          background: isDone ? '#f0fdf4' : '#fff7ed',
                          border: `1.5px solid ${isDone ? '#86efac' : '#fdba74'}`,
                          borderRadius: '10px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        role="checkbox"
                        aria-checked={isDone}
                        data-testid={`parent-action-item-${action.id}`}
                      >
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>
                          {isDone ? '✅' : '⬜'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isDone ? '#166534' : '#7c2d12',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
                            {action.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px', lineHeight: 1.4 }}>
                            {action.desc || action.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. 今は避けたほうがよいNGワード（理由と解説） */}
              <div
                style={{
                  background: '#fff1f2',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '16px',
                  padding: '18px 20px',
                }}
                data-testid="ng-words-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '22px' }}>⚠️</span>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#9f1239', fontWeight: 800 }}>
                    今は避けたほうがよいNGワード（理由と解説）
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {guidance.avoidPhrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ffe4e6',
                        borderRadius: '10px',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#e11d48' }}>
                        {phrase}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 親子のごほうび約束メモ */}
              <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🎁</span>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text)', fontWeight: 'bold' }}>
                      親子のごほうび約束メモ
                    </h4>
                  </div>
                  {!isEditingGoal && (
                    <button
                      onClick={() => setIsEditingGoal(true)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                      }}
                    >
                      ✏️ 編集する
                    </button>
                  )}
                </div>

                {isEditingGoal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      id="parent-goal-input"
                      name="parentGoal"
                      type="text"
                      value={editGoalText}
                      onChange={e => setEditGoalText(e.target.value)}
                      placeholder="例: 算数で80点取れたらケーキバイキング！"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--primary)',
                        fontSize: '14px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setIsEditingGoal(false)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12px' }}
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSaveGoal}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        保存する
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: rewardAchieved ? '#dcfce7' : '#ffffff',
                      border: `1.5px solid ${rewardAchieved ? '#86efac' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>現在の約束目標：</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: rewardAchieved ? '#15803d' : 'var(--text)', marginTop: '2px' }}>
                        {rewardGoal}
                      </div>
                    </div>

                    <button
                      onClick={handleToggleRewardAchieved}
                      style={{
                        background: rewardAchieved ? '#16a34a' : 'var(--surface-subtle)',
                        color: rewardAchieved ? '#ffffff' : 'var(--text)',
                        border: `1.5px solid ${rewardAchieved ? '#15803d' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-pill)',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {rewardAchieved ? '🎉 約束達成！おめでとう！' : '⬜ 達成したらチェック！'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= タブ3: こころの見守り処方箋 ================= */}
          {activeTab === 'mental' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="parent-mental-tab">
              {/* アクション完了フィードバック */}
              {actionDoneToast && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'fadeIn 0.2s ease',
                  }}
                  data-testid="parent-action-done-toast"
                >
                  <span>🎉</span>
                  <span>{actionDoneToast}</span>
                </div>
              )}

              {/* 保護者PINロック状態の表示 */}
              {!isPinUnlocked ? (
                !isPinConfigured ? (
                  /* 未設定時: 長押し3秒で設定開始 */
                  <div
                    style={{
                      background: '#ffffff',
                      border: '2px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '28px 24px',
                      textAlign: 'center',
                      maxWidth: '440px',
                      margin: '20px auto',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                    data-testid="parent-pin-unset-container"
                  >
                    <div style={{ fontSize: '38px', marginBottom: '8px' }}>🔐</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                      保護者PINが未設定です
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                      お子さんのプライバシーと家庭の安心基地を守るため、保護者の方があらかじめ4桁のPIN番号を設定してください。
                    </p>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        color: '#475569',
                        marginBottom: '20px',
                        textAlign: 'left',
                      }}
                    >
                      ⚠️ <strong>ご注意:</strong> このロックはうっかり見られないためのもので、完全な防止ではありません。
                    </div>

                    {!showPinSetup ? (
                      <div>
                        <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700, marginBottom: '8px' }}>
                          👇 ボタンを【3秒間長押し】して設定を開始
                        </div>
                        <button
                          type="button"
                          onMouseDown={handleStartHold}
                          onMouseUp={handleEndHold}
                          onMouseLeave={handleEndHold}
                          onTouchStart={handleStartHold}
                          onTouchEnd={handleEndHold}
                          style={{
                            padding: '12px 24px',
                            background: holdProgress > 0 ? '#059669' : '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '280px',
                            userSelect: 'none',
                            boxShadow: '0 3px 8px rgba(4, 120, 87, 0.3)',
                            transition: 'background 0.15s ease',
                          }}
                          data-testid="parent-pin-hold-setup-btn"
                        >
                          🔒 保護者PINを設定する（長押し3秒）
                        </button>
                        {holdProgress > 0 && (
                          <div style={{ width: '100%', maxWidth: '280px', margin: '8px auto 0', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${holdProgress}%`, height: '100%', background: '#10b981', transition: 'width 0.05s linear' }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* PIN設定フォーム（2回入力） */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }} data-testid="parent-pin-setup-form">
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                          新しい4桁の数字を決めてください
                        </div>
                        <input
                          id="new-parent-pin"
                          name="new-parent-pin"
                          type="password"
                          maxLength={4}
                          placeholder="新しい4桁のPIN"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            fontSize: '18px',
                            letterSpacing: '4px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '1.5px solid #94a3b8',
                            width: '160px',
                          }}
                          data-testid="parent-pin-new-input"
                        />
                        <input
                          id="confirm-parent-pin"
                          name="confirm-parent-pin"
                          type="password"
                          maxLength={4}
                          placeholder="もう一度入力（確認）"
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            fontSize: '18px',
                            letterSpacing: '4px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '1.5px solid #94a3b8',
                            width: '160px',
                          }}
                          data-testid="parent-pin-confirm-input"
                        />
                        {pinError && (
                          <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700 }}>
                            {pinError}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPinSetup(false);
                              setNewPinInput('');
                              setConfirmPinInput('');
                              setPinError('');
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={handleSetNewPin}
                            style={{
                              padding: '8px 20px',
                              background: '#047857',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            data-testid="save-parent-pin-btn"
                          >
                            PINを登録して解錠 ❯
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* PIN設定済み・ロック画面 */
                  <div
                    style={{
                      background: '#ffffff',
                      border: '2px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '24px',
                      textAlign: 'center',
                      maxWidth: '400px',
                      margin: '20px auto',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                    data-testid="parent-pin-locked-container"
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                      保護者PINロック
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                      お子さんのプライバシーと安全基地を守るため、この画面は保護者PINで保護されています。
                    </p>

                    {lockoutStatus.isLocked ? (
                      /* ロックアウト中画面 (迂回防止: 忘れた場合ボタン非表示) */
                      <div
                        style={{
                          background: '#fef2f2',
                          border: '1.5px solid #f87171',
                          borderRadius: '10px',
                          padding: '16px',
                          color: '#991b1b',
                        }}
                        data-testid="parent-pin-lockout-notice"
                      >
                        <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>
                          ⚠️ 連続失敗のため一時的にロックされています
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>
                          ロック解除まで: <strong>{lockoutStatus.remainingText}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '6px' }}>
                          ※ セキュリティ保護のため、ロックアウト中はPINリセットも実行できません。
                        </div>
                      </div>
                    ) : (
                      /* 通常のPIN入力フォーム */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <input
                          id="parent-pin-input"
                          name="parent-pin-input"
                          type="password"
                          maxLength={4}
                          placeholder="4桁の数字"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            fontSize: '18px',
                            letterSpacing: '4px',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '1.5px solid #94a3b8',
                            width: '140px',
                          }}
                          data-testid="parent-pin-verify-input"
                        />
                        {pinError && (
                          <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700 }} data-testid="parent-pin-error">
                            {pinError}
                          </div>
                        )}
                        <button
                          onClick={handleUnlockPin}
                          style={{
                            padding: '10px 24px',
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '200px',
                          }}
                          data-testid="parent-pin-unlock-btn"
                        >
                          ロック解除 ❯
                        </button>
                        <button
                          onClick={() => {
                            sound.playPop();
                            setShowResetConfirm(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            marginTop: '8px',
                          }}
                          data-testid="parent-pin-forgot-btn"
                        >
                          PINを忘れた場合（データをリセットして解除）
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <>
                  {/* 冒頭の約束（常時表示） */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.6,
                    }}
                  >
                    ℹ️ <strong>この画面の約束:</strong> お子さんを責めたり詮索したりせず、家庭の安心基地を整えるヒントとしてご活用ください。見守っていることをお子さんと共有し、話したくないときは無理に聞き出さないことをお約束ください。
                  </div>

                  {/* 🚨 重大な警戒サイン（active時のみ最上部に赤アラート表示） */}
                  {careSignal?.active && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '2px solid #ef4444',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '22px' }}>🚨</span>
                            <h4 style={{ margin: 0, fontSize: '15px', color: '#991b1b', fontWeight: 800 }}>
                              こころの警戒サインが検知されました
                            </h4>
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5, fontWeight: 600 }}>
                            「あらし」のサインが複数日連続している、または限界に近いSOSサインが届いています。勉強はいったん脇に置き、お子さんの睡眠・休養と安心を最優先にしてください。
                          </p>
                        </div>
                        <button
                          onClick={handleAcknowledgeSignal}
                          style={{
                            padding: '8px 16px',
                            background: '#991b1b',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          確認しました（警戒解除）
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1. お子さんのこころのお天気サイン */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
                      border: '1.5px solid #a7f3d0',
                      borderRadius: '16px',
                      padding: '18px 20px',
                    }}
                    data-testid="child-mental-forecast-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '28px' }}>
                          {todaySharedWeather?.weather === 'sunny' ? '☀️' :
                           todaySharedWeather?.weather === 'cloudy' ? '⛅' :
                           todaySharedWeather?.weather === 'rainy' ? '🌧️' :
                           todaySharedWeather?.weather === 'storm' ? '⛈️' : '🕊️'}
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', color: '#065f46', fontWeight: 800 }}>
                            お子さんのこころのお天気サイン: 【{todaySharedWeather?.weatherLabel || guidance.weatherLabel}】
                          </h4>
                          <div style={{ fontSize: '11px', color: '#047857' }}>
                            {todaySharedWeather ? `最新記録日: ${todaySharedWeather.updatedAt.split('T')[0]} (プライバシー配慮により要約表示)` : '本日はまだ記録がありません（または伝えない設定です）'}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          background: '#d1fae5',
                          color: '#065f46',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        🌱 安全基地サポート中
                      </span>
                    </div>

                    <p style={{ margin: '8px 0', fontSize: '13px', color: '#1f2937', lineHeight: 1.6, fontWeight: 600 }}>
                      {guidance.statusSummary}
                    </p>

                    {/* お子さんからのお願いバッジ */}
                    {latestRequest && (
                      <div
                        style={{
                          marginTop: '8px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          color: '#1e40af',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>💌 お子さんからのお願いサイン:</strong>{' '}
                        {latestRequest.request === 'listen' && '「話を聞いてほしい」'}
                        {latestRequest.request === 'quiet' && '「少しそっとしておいてほしい」'}
                        {latestRequest.request === 'refresh' && '「いっしょに気分転換したい」'}
                      </div>
                    )}
                  </div>

                  {/* 6. お子さんからの「伝えるカード」＆直近のまとめ */}
                  {(sharedCareCards.length > 0 || Object.keys(sharedWeeklySummaries).length > 0) && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '18px 20px',
                      }}
                    >
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', fontWeight: 800 }}>
                        📬 届いたカード＆週のまとめ
                      </h4>

                      {/* 伝えるカード */}
                      {sharedCareCards.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                            お子さんから届いたメッセージカード:
                          </div>
                          {sharedCareCards.map((card) => (
                            <div
                              key={card.id}
                              style={{
                                background: '#fdf4ff',
                                border: '1px solid #f5d0fe',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                fontSize: '12px',
                                color: '#86198f',
                              }}
                            >
                              <strong>
                                💌 「
                                {card.cardTitle || (
                                  card.templateId === 'listen' ? '話を聞いてほしいな' :
                                  card.templateId === 'quiet' ? '少しそっとしておいてね' : 'いっしょに気分転換したいな'
                                )}
                                」
                              </strong>
                              <span style={{ fontSize: '10px', color: '#a21caf', marginLeft: '8px' }}>
                                ({card.sentAt || card.createdAt.split('T')[0]})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 週のまとめ（統計のみ開示） */}
                      {Object.keys(sharedWeeklySummaries).length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                            直近の週の傾向（プライバシー保護要約）:
                          </div>
                          {Object.values(sharedWeeklySummaries).slice(-2).map((ws, idx) => {
                            const weatherEntries = Object.entries(ws.weatherCounts || {}) as [WeatherType, number][];
                            const topWeather = weatherEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'sunny';
                            const totalActs = Object.values(ws.copingCategoryCounts || {}).reduce((sum, v) => sum + v, 0);

                            return (
                              <div
                                key={idx}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  fontSize: '11px',
                                  color: '#334155',
                                  marginBottom: '6px',
                                }}
                              >
                                週最多のお天気: {topWeather === 'sunny' ? '☀️ はれ' : topWeather === 'cloudy' ? '⛅ くもり' : topWeather === 'rainy' ? '🌧️ あめ' : '⛈️ あらし'} / こころの活動回数: {totalActs}回
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. 「もっと見る」天気別ヒント展開 */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setShowAllWeatherAdvice(prev => !prev)}
                      style={{
                        background: 'none',
                        border: '1px solid #cbd5e1',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        color: '#475569',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {showAllWeatherAdvice ? '▲ 天気別の声かけヒントを閉じる' : '▼ 他のお天気（はれ/くもり/あめ/あらし）のヒント一覧を見る'}
                    </button>

                    {showAllWeatherAdvice && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                        {(['sunny', 'cloudy', 'rainy', 'storm'] as WeatherType[]).map(w => {
                          const g = generateParentGuidance(w);
                          return (
                            <div
                              key={w}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '12px 14px',
                              }}
                            >
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                                {w === 'sunny' ? '☀️' : w === 'cloudy' ? '⛅' : w === 'rainy' ? '🌧️' : '⛈️'} {g.weatherLabel}
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, marginBottom: '6px' }}>
                                {g.statusSummary}
                              </div>
                              <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>
                                おすすめ: {g.recommendedPhrases[0]?.phrase}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 8. 保護者PIN設定・管理 */}
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px dashed #cbd5e1',
                      fontSize: '12px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <strong>🔒 保護者PINセキュリティ:</strong>{' '}
                      {isPinConfigured ? '設定済み（保護中）' : '未設定（誰でも閲覧可能）'}
                    </div>

                    {!showPinSetup ? (
                      <button
                        onClick={() => {
                          setShowPinSetup(true);
                          setPinError('');
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        {isPinConfigured ? 'PINを変更する' : 'PINを設定する'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="4桁の数字"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            width: '90px',
                            borderRadius: '4px',
                            border: '1px solid #94a3b8',
                          }}
                        />
                        <button
                          onClick={handleSetNewPin}
                          style={{
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setShowPinSetup(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#64748b',
                          }}
                        >
                          キャンセル
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="parent-reports-tab">
              <div
                style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                    🛠️ お子様からの問題チェック・修正依頼一覧
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    お子様が学習中に「おかしいかも？」と指摘した問題がここに届きます。ワンタップで直接該当問題を解いて確認できます。
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: reports.filter(r => !r.resolved).length > 0 ? '#fee2e2' : 'var(--surface)',
                    color: reports.filter(r => !r.resolved).length > 0 ? '#b91c1c' : 'var(--text-subtle)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  未対応: {reports.filter(r => !r.resolved).length} 件 / 全 {reports.length} 件
                </span>
              </div>

              {reports.length === 0 ? (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px dashed var(--border)',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                  data-testid="no-reports-message"
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🐾</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                    現在、問題や解答の指摘はありません
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-subtle)', margin: 0 }}>
                    お子様が学習画面で「おうちの人に相談」ボタンを押すと、ここにメモが届きます。
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.map(item => {
                    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
                      timeZone: 'Asia/Tokyo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(item.reportedAt));

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: item.resolved ? 'var(--surface-subtle)' : 'var(--surface)',
                          border: item.resolved ? '1px solid var(--border)' : '1.5px solid #fda4af',
                          borderRadius: '14px',
                          padding: '16px',
                          boxShadow: item.resolved ? 'none' : '0 4px 12px rgba(244, 63, 94, 0.08)',
                          opacity: item.resolved ? 0.8 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                        data-testid={`report-card-${item.id}`}
                      >
                        {/* ヘッダー行 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background:
                                  item.subject === 'rika' ? '#ecfdf5' : item.subject === 'sansu' ? '#eff6ff' : '#fff7ed',
                                color:
                                  item.subject === 'rika' ? '#065f46' : item.subject === 'sansu' ? '#1e40af' : '#9a3412',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {item.subject === 'rika' ? '🧪 理科' : item.subject === 'sansu' ? '📐 算数' : '🗾 社会'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                              {item.skillTitle || item.category || '学習問題'}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: item.resolved ? '#ecfdf5' : '#fee2e2',
                              color: item.resolved ? '#047857' : '#b91c1c',
                              border: `1px solid ${item.resolved ? '#a7f3d0' : '#fecdd3'}`,
                            }}
                          >
                            {item.resolved ? '✅ 確認・対応済み' : '⚠️ 未確認'}
                          </span>
                        </div>

                        {/* 指摘理由 ＆ 日時 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              background: '#fdf2f8',
                              color: '#9d174d',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fbcfe8',
                            }}
                          >
                            {item.reasonLabel}
                          </span>
                          <span style={{ color: 'var(--text-subtle)', fontSize: '11px' }}>
                            {formattedDate}（日本時間）
                          </span>
                        </div>

                        {/* お子様のメモ（吹き出し風） */}
                        {item.comment && (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>💬</span>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-subtle)', fontWeight: 700 }}>お子様からのメモ:</div>
                              <div style={{ marginTop: '2px' }}>{item.comment}</div>
                            </div>
                          </div>
                        )}

                        {/* 設問プレビュー */}
                        <div
                          style={{
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '11px',
                            color: 'var(--text-subtle)',
                            lineHeight: '1.4',
                          }}
                        >
                          <strong style={{ color: 'var(--text)' }}>設問: </strong>
                          {item.prompt.length > 80 ? `${item.prompt.slice(0, 80)}...` : item.prompt}
                        </div>

                        {/* アクションバー */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border-subtle)',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              sound.playChime();
                              onClose();
                              if (onInspectQuestion) {
                                onInspectQuestion(item.questionId);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                            }}
                            title="この問題を保護者自身が解いて内容・解答を確認する"
                            data-testid={`inspect-question-btn-${item.id}`}
                          >
                            <span>🔍</span>
                            <span>この問題を直接開いて解く（確認）</span>
                            <span style={{ fontSize: '10px' }}>❯</span>
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playPop();
                                const updated = toggleReportResolved(item.id);
                                setReports(updated);
                              }}
                              style={{
                                padding: '5px 10px',
                                background: item.resolved ? 'var(--surface)' : '#ecfdf5',
                                border: `1px solid ${item.resolved ? 'var(--border)' : '#a7f3d0'}`,
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: item.resolved ? 'var(--text-subtle)' : '#065f46',
                                cursor: 'pointer',
                              }}
                              data-testid={`toggle-resolved-btn-${item.id}`}
                            >
                              {item.resolved ? '未対応に戻す' : '✓ 解決済みにする'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                sound.playPop();
                                const updated = deleteQuestionReport(item.id);
                                setReports(updated);
                              }}
                              style={{
                                padding: '5px 8px',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: 'var(--text-subtle)',
                              }}
                              title="この依頼を削除"
                              aria-label="削除"
                              data-testid={`delete-report-btn-${item.id}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 最下部CTA（ハイブリッド配置） */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              style={{
                background: 'var(--primary, #0D9488)',
                color: 'white',
                border: 'none',
                padding: '12px 36px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
              }}
              data-testid="parent-bottom-back-btn"
            >
              ホームへ戻る ❯
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* A4弱点集中 克服チェックシート（印刷・PDF出力専用） */}
    <div className={styles.printOnlyWorksheet} data-testid="print-weakness-worksheet">
      <header className={styles.sheetHeader}>
        <div className={styles.sheetTitleRow}>
          <div>
            <h1 className={styles.sheetMainTitle}>
              🩺 みならい獣医さんの中学受験カルテ 【A4弱点集中 克服チェックシート】
            </h1>
            <p className={styles.sheetSubTitle}>
              〜 入試本番と同じように「紙と鉛筆」で書く！急所ポイントを声に出して読んでから挑戦しよう 〜
            </p>
          </div>
        </div>
        <div className={styles.sheetMetaBox}>
          <div className={styles.metaField}>
            実施日：<span className={styles.metaLine} style={{ minWidth: '90px' }}></span>
          </div>
          <div className={styles.metaField}>
            なまえ：<span className={styles.metaLine} style={{ minWidth: '130px' }}></span>
          </div>
          <div className={styles.stampBox}>
            💮 保護者確認印
          </div>
        </div>
      </header>

      <main className={styles.questionsContainer}>
        {worksheetItems.map((item) => (
          <div key={item.skillId} className={styles.questionBlock}>
            <div className={styles.questionHeader}>
              <div className={styles.questionBadgeTitle}>
                <span className={styles.subjectBadge}>{item.subjectLabel}</span>
                <span className={styles.questionTitle}>
                  【第{item.number}問】 {item.title}
                </span>
              </div>
              <span className={styles.retentionBadge}>忘却メーター: {item.retention}%</span>
            </div>

            <div className={styles.tipBox}>
              <span className={styles.tipLabel}>💡 急所ポイント＆解法のコツ:</span>
              {item.tip} {item.examPoint ? `(${item.examPoint})` : ''}
            </div>

            <div className={styles.promptText}>
              <strong>［設問］</strong> {item.question}
            </div>

            <div className={styles.workingArea}>
              <div className={styles.workingAreaLabel}>【計算・考え方メモ欄】</div>
            </div>

            <div className={styles.answerRow}>
              <span>【答え】</span>
              <span className={styles.answerBoxLine}></span>
            </div>
          </div>
        ))}
      </main>

      <footer className={styles.sheetFooter}>
        <div style={{ fontSize: '7.5pt', color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>
          🐾 間違えた問題はもう一度アプリで復習しよう！継続した積み重ねが合格への近道です。
        </div>
        <div className={styles.answerKeyRow}>
          {worksheetItems.map((item) => (
            <div key={item.skillId} className={styles.answerKeyItem}>
              <strong>問{item.number} 答え:</strong> {item.answer}
            </div>
          ))}
        </div>
      </footer>
    </div>
  </>
  );
};

