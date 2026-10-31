import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { ALL_PROGRESS_SKILLS } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { getMemoryRetention } from '../utils/memory-retention';
import { getTodayStudyStats, type TodayStudyStats } from '../utils/progress-analytics';
import { ANIMAL_STAMPS, getEarnedStampIds } from '../data/animal-stamps';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import type { FinalChallengeResult } from '../types';
import { getQuestionReports, toggleReportResolved, deleteQuestionReport, type QuestionReportItem } from '../utils/question-reports';
import styles from './ParentDashboardModal.module.css';

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

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({
  onClose,
  onStartWeaknessQuiz,
  onInspectQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'advice' | 'print' | 'reports'>('charts');
  const [reports, setReports] = useState<QuestionReportItem[]>(() => getQuestionReports());
  const [examResults, setExamResults] = useState<FinalChallengeResult[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);

  // 本日の学習量（時間、解答数、正答率、連続日数、累計）
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
  }, []);

  // 教科別マスター進度
  const rikaSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'rika');
  const sansuSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'sansu');
  const shakaiSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'shakai');

  const rikaMastered = rikaSkills.filter(s => s.isMastered).length;
  const sansuMastered = sansuSkills.filter(s => s.isMastered).length;
  const shakaiMastered = shakaiSkills.filter(s => s.isMastered).length;

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
      subjectLabel: skill.subject === 'rika' ? '🧪 理科' : skill.subject === 'sansu' ? '📐 算数' : '🗾 社会',
      title: skill.title,
      tip: enhancement?.flashCard.tip || skill.nextGoalHint || '基本の考え方をしっかり整理しよう。',
      examPoint: enhancement?.flashCard.examPoint || '',
      question: enhancement?.flashCard.question || `【${skill.title}】の重要ポイントを説明し、解法の道筋を書きなさい。`,
      answer: enhancement?.flashCard.answer || '基本解説を参照',
      retention: skill.retention,
    };
  });

  // 動物シール
  const earnedStamps = getEarnedStampIds();

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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
        data-testid="parent-dashboard-modal"
      >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          border: '2px solid var(--border)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>👨‍👩‍👧</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                保護者カルテ
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                お子さんの学習量・理解度の推移・ほめ言葉ヒント・A4弱点印刷
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
          }}
        >
          {(() => {
            const unresolvedCount = reports.filter(r => !r.resolved).length;
            return [
              { id: 'charts', label: '📈 学習・成績グラフ', badge: 0 },
              { id: 'advice', label: '🐱 ほめ言葉＆お約束', badge: 0 },
              { id: 'print', label: '🖨️ 弱点処方箋＆A4印刷', badge: 0 },
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
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ================= タブ1: グラフ可視化 ================= */}
          {activeTab === 'charts' && (
            <>
              {/* サマリーカード 4枚（本日の学習実績を最優先表示） */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
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
                    総時間 約{todayStats.totalMinutes}分 / 動物 {earnedStamps.length}匹
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

              {/* 3教科の理解度・マスター進度（全テーマ） */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                  📊 3教科のマスター進度（全{ALL_PROGRESS_SKILLS.length}テーマ）
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: '🧪 理科', count: rikaSkills.length, mastered: rikaMastered, color: '#ec4899', bg: '#fdf2f8' },
                    { label: '📐 算数', count: sansuSkills.length, mastered: sansuMastered, color: '#3b82f6', bg: '#eff6ff' },
                    { label: '🗾 社会', count: shakaiSkills.length, mastered: shakaiMastered, color: '#10b981', bg: '#f0fdf4' },
                  ].map(sub => {
                    const percent = Math.round((sub.mastered / sub.count) * 100);
                    return (
                      <div key={sub.label} style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: sub.color }}>{sub.label}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                            合格のカギ: <strong>{sub.mastered}</strong> / {sub.count} テーマ達成 ({percent}%)
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

              {/* 合格ドクター認定試験のスコア推移グラフ */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 'bold' }}>
                    🎯 本番認定試験の得点推移（実力判定）
                  </h4>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                    ―― 合格ライン (80点)
                  </span>
                </div>

                {examResults.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '12px' }}>
                    まだ認定試験のデータがありません。ホーム画面の「合格ドクター認定試験」を受験すると、ここに点数の伸びが折れ線グラフで記録されます。
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '140px' }}>
                    <svg viewBox="0 0 540 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* 合格ライン 80点 */}
                      <line x1="20" y1="40" x2="520" y2="40" stroke="#86efac" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="5" y="44" fontSize="10" fill="#16a34a" fontWeight="bold">80点</text>

                      {/* 底辺 0点 */}
                      <line x1="20" y1="120" x2="520" y2="120" stroke="#cbd5e1" strokeWidth="1" />

                      {/* 折れ線プロット */}
                      {(() => {
                        const points = examResults.map((r, i) => {
                          const x = 30 + (i / Math.max(1, examResults.length - 1)) * 480;
                          const y = 120 - (r.score / 100) * 100;
                          return { x, y, r };
                        });
                        const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={polylineStr}
                            />
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                                <text x={p.x} y={p.y - 8} fontSize="10" fontWeight="bold" fill="#92400e" textAnchor="middle">
                                  {p.r.score}点
                                </text>
                                <text x={p.x} y={134} fontSize="9" fill="#64748b" textAnchor="middle">
                                  第{idx + 1}回
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= タブ2: 声かけヒント＆お約束 ================= */}
          {activeTab === 'advice' && (
            <>
              {/* ナース猫ミケちゃんの声かけアドバイス */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.5px solid #fde68a',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '32px' }}>🐱</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#92400e', fontWeight: 'bold' }}>
                      ナース猫ミケちゃんからの「今日のお子さんへの声かけヒント」
                    </h4>
                    <div style={{ fontSize: '11px', color: '#b45309' }}>
                      中学受験のモチベーションを高める具体的なほめ言葉
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid #fef08a', lineHeight: '1.6', fontSize: '13px', color: '#78350f' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    💡 今日のおすすめの褒め言葉：
                  </p>
                  <blockquote style={{ margin: '0 0 10px 0', paddingLeft: '12px', borderLeft: '3px solid #f59e0b', fontStyle: 'italic', color: '#1e293b' }}>
                    「毎日ちゃんと5分カルテを開いて解いているのが本当に偉いね！コツコツ続ける力は、入試本番で一番大きな武器になるよ。」
                  </blockquote>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    ※ 結果（点数）だけでなく、「毎日机に向かった行動」や「途中で諦めず考え直したプロセス」を具体的に認めてあげると、自己肯定感と学習意欲が劇的に高まります。
                  </p>
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
                      type="text"
                      value={editGoalText}
                      onChange={e => setEditGoalText(e.target.value)}
                      placeholder="例: 算数で80点取れたらケーキバイキング！"
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
            </>
          )}

          {/* ================= タブ3: 弱点処方箋＆A4印刷 ================= */}
          {activeTab === 'print' && (
            <>
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
                                  📱 お子さんにこの単元を解かせる（サクッと暗記カードを起動）
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

          {/* ================= タブ4: 問題修正依頼一覧 ================= */}
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

