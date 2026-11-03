import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ANIMAL_STAMPS, getEarnedStampIds } from '../data/animal-stamps';
import { getMasteryLevelInfo, getSkillStage, getNextGoalHint } from '../utils/mastery-helper';
import { ALL_PROGRESS_SKILLS, type ComprehensiveSkillProgressItem } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { QuickFlashCardModal } from '../components/QuickFlashCardModal';
import { FinalExamHistoryModal } from '../components/FinalExamHistoryModal';
import { ParentDashboardModal } from '../components/ParentDashboardModal';
import { getMemoryRetention } from '../utils/memory-retention';
import { calculateExamChartCompletion, calculateStreakDays } from '../utils/progress-analytics';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import { getDaysUntilExam } from '../utils/countdown-helper';
import { AnimatedVetPet } from '../components/AnimatedVetPet';
import { ReferenceBookQuizModal } from '../components/ReferenceBookQuizModal';
import { REFERENCE_BOOKS } from '../data/extra-history-80';
import { getRefBookProgress } from '../utils/reference-book-store';
import type { Subject, FinalChallengeResult } from '../types';
import { db } from '../db';
import { SUPPORTED_EXAM_YEARS, FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT, type ExamYear } from '../data/final-challenge-data';
import { getAllExamScoreSummaries } from '../utils/exam-scores';
import styles from './HomePage.module.css';

type ThemeType = 'default' | 'sakura' | 'mint' | 'lavender' | 'night';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, startDailySession, startSkillFocusSession, startSingleQuestionSession } = useAppStore();
  const daysUntilExam = getDaysUntilExam(settings.targetExamDate);
  const [earnedStampIds, setEarnedStampIds] = useState<string[]>([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [openedStampIds, setOpenedStampIds] = useState<string[]>([]);
  // スタンプ帳モーダルのタブ（毎日の学習 or カルテ全快患者）
  const [stampModalTab, setStampModalTab] = useState<'daily' | 'chart'>('daily');
  // カルテ全快スタンプの教科フィルター
  const [chartStampSubject, setChartStampSubject] = useState<'all' | 'rika' | 'sansu' | 'shakai' | 'kokugo'>('all');
  // 開いたカルテスタンプのID一覧（開きっぱなし維持）
  const [openedChartStampIds, setOpenedChartStampIds] = useState<string[]>([]);
  // ホーム画面のプレビュースロット表示切り替え（daily or chart）
  const [stampPreviewType, setStampPreviewType] = useState<'daily' | 'chart'>('daily');
  const [showLevelHelpModal, setShowLevelHelpModal] = useState(false);
  const [showCompletionHelpModal, setShowCompletionHelpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [examHistory, setExamHistory] = useState<FinalChallengeResult[]>([]);
  const [selectedExamYear, setSelectedExamYear] = useState<ExamYear>(2026);
  const [showAllExamYears, setShowAllExamYears] = useState(false);

  useEffect(() => {
    db.finalChallengeResults.toArray().then(setExamHistory);
  }, [showHistoryModal]);

  const examSummaries = useMemo(() => {
    return getAllExamScoreSummaries(examHistory);
  }, [examHistory]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showAllAnimalsModal, setShowAllAnimalsModal] = useState(false);
  const [flashCardSkillId, setFlashCardSkillId] = useState<string | null>(null);
  const [activePatientSkillId, setActivePatientSkillId] = useState<string | null>(null);
  const [activeRefBookId, setActiveRefBookId] = useState<string | null>(null);
  const [refBookTick, setRefBookTick] = useState<number>(0);

  // テーマ・サウンド状態
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSkillSubject, setSelectedSkillSubject] = useState<'rika' | 'sansu' | 'shakai' | 'kokugo'>('rika');
  // 今日の学習の出題教科（複数選択可能。初期値は全4教科）
  const ALL_STUDY_SUBJECTS: Subject[] = ['rika', 'sansu', 'shakai', 'kokugo'];
  const [selectedStudySubjects, setSelectedStudySubjects] = useState<Subject[]>(['rika', 'sansu', 'shakai', 'kokugo']);
  // スマホ向け下段ビュー切り替え（カルテ進度 or 認定試験）
  const [mobileBottomTab, setMobileBottomTab] = useState<'progress' | 'exam'>('progress');
  // カルテ進度内のマスター達成テーマの開閉（スマホでの過剰スクロール防止）
  const [showMasteredSkills, setShowMasteredSkills] = useState(false);
  // レベルアップをめざすテーマの開閉（デフォルト折りたたみ）
  const [showUnmasteredSkills, setShowUnmasteredSkills] = useState(false);
  const [, setRetentionTick] = useState(0);
  const [, setSkillStagesTick] = useState(0);

  // 合格カルテ完成度（%）と連続学習日数（ストリーク）の動的計算
  const [completionPercent, setCompletionPercent] = useState<number>(() => calculateExamChartCompletion());
  const [studyStreak, setStudyStreak] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    // 記憶定着度更新時・ストリーク更新時・スキルステージ更新時の同期リスナー
    const handleRetentionUpdate = () => {
      if (!isMounted) return;
      setRetentionTick(t => t + 1);
      setCompletionPercent(calculateExamChartCompletion());
    };
    const handleSkillStageUpdate = () => {
      if (!isMounted) return;
      setSkillStagesTick(t => t + 1);
      setCompletionPercent(calculateExamChartCompletion());
    };
    const handleStreakUpdate = (e: any) => {
      if (!isMounted) return;
      if (typeof e.detail?.streak === 'number') {
        setStudyStreak(e.detail.streak);
      } else {
        calculateStreakDays().then(val => {
          if (isMounted) setStudyStreak(val);
        });
      }
    };

    window.addEventListener('memory-retention-updated', handleRetentionUpdate);
    window.addEventListener('skill-stage-updated', handleSkillStageUpdate);
    window.addEventListener('study-streak-updated', handleStreakUpdate);

    // 初期マウント時のストリーク計算
    calculateStreakDays().then(val => {
      if (isMounted) setStudyStreak(val);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('memory-retention-updated', handleRetentionUpdate);
      window.removeEventListener('skill-stage-updated', handleSkillStageUpdate);
      window.removeEventListener('study-streak-updated', handleStreakUpdate);
    };
  }, []);

  useEffect(() => {
    try {
      setEarnedStampIds(getEarnedStampIds());
      setSoundEnabled(sound.isEnabled());

      // 保存済みテーマの復元
      const savedTheme = (localStorage.getItem('junior_vet_theme') as ThemeType) || 'default';
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } catch {
      // ignore
    }
  }, []);

  const applyTheme = (theme: ThemeType) => {
    try {
      if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch {
      // ignore
    }
  };

  const cycleTheme = () => {
    sound.playPop();
    const order: ThemeType[] = ['default', 'sakura', 'mint', 'lavender', 'night'];
    const nextIndex = (order.indexOf(currentTheme) + 1) % order.length;
    const nextTheme = order[nextIndex];
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem('junior_vet_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const nextStamp = ANIMAL_STAMPS.find(s => !earnedStampIds.includes(s.id)) || ANIMAL_STAMPS[0];

  const isAllSubjectsSelected = selectedStudySubjects.length === ALL_STUDY_SUBJECTS.length;

  const handleSelectAllSubjects = () => {
    sound.playPop();
    setSelectedStudySubjects([...ALL_STUDY_SUBJECTS]);
  };

  const handleToggleSubject = (sub: Subject) => {
    sound.playPop();
    // 全教科選択されている状態で特定科目をタップした場合は、その科目のみを選択（直感的な絞り込み操作）
    if (isAllSubjectsSelected) {
      setSelectedStudySubjects([sub]);
      return;
    }

    if (selectedStudySubjects.includes(sub)) {
      // 既に選択中の科目をタップした場合:
      if (selectedStudySubjects.length > 1) {
        // 残り2科目以上あれば解除
        setSelectedStudySubjects(selectedStudySubjects.filter(s => s !== sub));
      } else {
        // 最後の1科目を解除しようとした場合は全教科選択に戻す（必ず1科目以上選ばれる）
        setSelectedStudySubjects([...ALL_STUDY_SUBJECTS]);
      }
    } else {
      // 未選択の科目をタップして追加（複数選択）
      const next = [...selectedStudySubjects, sub];
      setSelectedStudySubjects(next);
    }
  };

  const getStartButtonLabel = () => {
    if (isAllSubjectsSelected) {
      return '▶ 本日の診察をはじめる（10問）';
    }
    const subjectNames: Record<Subject, { label: string; icon: string }> = {
      rika: { label: '理科', icon: '🧪' },
      sansu: { label: '算数', icon: '📐' },
      shakai: { label: '社会', icon: '🗾' },
      kokugo: { label: '国語', icon: '📖' },
    };
    const sortedSelected = ALL_STUDY_SUBJECTS.filter(s => selectedStudySubjects.includes(s));
    const labels = sortedSelected.map(s => subjectNames[s]?.label || s).join('・');
    const icons = sortedSelected.map(s => subjectNames[s]?.icon || '').join('');
    return `▶ ${labels}の診察をはじめる（10問） ${icons || '🐾'}`;
  };

  const handleStartToday = () => {
    sound.playChime();
    startDailySession(isAllSubjectsSelected ? undefined : selectedStudySubjects);
    navigate('/study');
  };

  const handleStampClick = (isEarned: boolean) => {
    if (isEarned) {
      sound.playAnimalHappy();
      fireConfetti({ count: 25 });
    } else {
      sound.playPop();
    }
    setShowStampModal(true);
  };

  const getSubjectBadgeText = (subject: Subject) => {
    switch (subject) {
      case 'rika': return '出題教科：🧪 理科';
      case 'sansu': return '出題教科：📐 算数';
      case 'shakai': return '出題教科：🗾 社会';
      case 'kokugo': return '出題教科：📖 国語';
      default: return '出題教科';
    }
  };

  // 全スキルの動的ステージ反映
  const enrichedSkills: ComprehensiveSkillProgressItem[] = ALL_PROGRESS_SKILLS.map(skill => {
    const stage = getSkillStage(skill.id, skill.stage);
    const isMastered = stage === 'M4' || stage === 'M5';
    const nextGoalHint = getNextGoalHint(stage);
    return {
      ...skill,
      stage,
      isMastered,
      nextGoalHint,
    };
  });

  // 全カルテスキルのうち全快（M4/M5マスター）したスキル
  const allMasteredSkills = enrichedSkills.filter(s => s.isMastered);

  // カルテスキルのスタンプ情報ヘルパー
  const getSkillStampDetails = (skill: ComprehensiveSkillProgressItem) => {
    const enhance = THEME_ENHANCEMENTS[skill.id];
    const icon = enhance?.patientAnimal?.icon || skill.patientIcon || '🐾';
    const name = enhance?.patientAnimal?.name || skill.patientName || '患者どうぶつ';
    const role = enhance?.patientAnimal?.role || `${skill.subjectLabel}マスター`;
    const symptom = enhance?.patientAnimal?.symptom || `「${skill.title}のカルテをマスターしてくれてありがとう！すっかり元気になったよ！」`;
    const examPoint = enhance?.flashCard?.examPoint || enhance?.flashCard?.tip || `💡 急所ポイント: ${skill.nextGoalHint}。毎日の復習で全快をキープしよう！`;
    return { icon, name, role, symptom, examPoint };
  };

  // 科目別フィルター（小学生向け科目タブ：理科・算数・社会・国語）
  const filteredSkills = enrichedSkills.filter(skill => {
    return skill.subject === selectedSkillSubject;
  });

  const masteredCount = filteredSkills.filter(s => s.isMastered).length;
  const remainingCount = filteredSkills.length - masteredCount;

  // 全科目の合計マスター数および各教科のマスター数・スキル数
  const totalMasteredCount = enrichedSkills.filter(s => s.isMastered).length;
  const totalSkillsCount = enrichedSkills.length;
  const totalRemainingCount = totalSkillsCount - totalMasteredCount;

  const rikaCount = enrichedSkills.filter(s => s.subject === 'rika').length;
  const sansuCount = enrichedSkills.filter(s => s.subject === 'sansu').length;
  const shakaiCount = enrichedSkills.filter(s => s.subject === 'shakai').length;
  const kokugoCount = enrichedSkills.filter(s => s.subject === 'kokugo').length;

  const rikaMasteredCount = enrichedSkills.filter(s => s.subject === 'rika' && s.isMastered).length;
  const sansuMasteredCount = enrichedSkills.filter(s => s.subject === 'sansu' && s.isMastered).length;
  const shakaiMasteredCount = enrichedSkills.filter(s => s.subject === 'shakai' && s.isMastered).length;
  const kokugoMasteredCount = enrichedSkills.filter(s => s.subject === 'kokugo' && s.isMastered).length;

  const themeIcons: Record<ThemeType, string> = {
    default: '🩺 クリニック',
    sakura: '🌸 サクラ',
    mint: '🌿 ミント',
    lavender: '💜 ラベンダー',
    night: '🌙 夜空自習室',
  };

  return (
    <div className={styles.pageContainer} data-testid="home-page">
      {/* ヘッダー */}
      <header className={styles.header} data-testid="header">
        <div className={styles.headerLeft}>
          <AnimatedVetPet size={48} />
          <div className={styles.titleGroup}>
            <div className={styles.subTitle}>🐾 めざせ！未来のどうぶつのお医者さん</div>
            <h1 className={styles.mainTitle}>みならい獣医さんの中学受験カルテ</h1>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* ステータス情報バッジ群（カウントダウン・連続日数・完成度） */}
          <div className={styles.headerStatusGroup}>
            {/* 受験カウントダウン */}
            <div
              className={styles.countdownBadge}
              title={`2027年2月1日の受験本番まであと${daysUntilExam}日！一歩ずつマスターしていこう🐾`}
              data-testid="exam-countdown-badge"
            >
              <span>🎯</span>
              <span>2027/2/1 本番まで あと <strong className={styles.countdownNumber}>{daysUntilExam}</strong> 日！</span>
            </div>

            {/* 連続学習ストリーク（ゲーミフィケーション） */}
            <div className={styles.streakBadge} title="連続学習日数" data-testid="streak-badge">
              <span>{studyStreak > 0 ? '🔥' : '🌱'}</span>
              <span>{studyStreak > 0 ? `${studyStreak}日れんぞく！` : '今日からスタート！'}</span>
            </div>

            {/* 合格カルテ完成度（クリックで100%にするための解説を表示） */}
            <div
              className={styles.progressGroup}
              onClick={() => {
                sound.playPop();
                setShowCompletionHelpModal(true);
              }}
              title="合格カルテ完成度: 全56症例の「記憶メーター（定着度）」の平均値です。クリックで解説モーダルを表示！"
              data-testid="completion-progress-group"
              role="button"
              tabIndex={0}
              aria-label={`合格カルテ完成度 ${completionPercent}%。クリックで100%にする方法を表示`}
            >
              <div className={styles.progressLabel}>
                <span className={styles.progressLabelTitle}>
                  合格カルテ完成度 <span className={styles.helpIcon}>ⓘ</span>
                </span>
                <strong data-testid="completion-percent">{completionPercent}%</strong>
              </div>
              <div className={styles.progressBarBg} aria-label="攻略度進捗バー">
                <div className={styles.progressBarFill} style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>

          {/* 右上操作コントロール群 */}
          <div className={styles.headerControls}>
            {/* こころの相談室ボタン */}
            <button
              className={styles.mentalCareBadgeBtn}
              onClick={() => {
                sound.playPop();
                navigate('/mental-care');
              }}
              title="こころの相談室（モヤモヤ仕分けパズル・お守りコーピング・哲学対話）"
              aria-label="こころの相談室"
              data-testid="header-mental-care-btn"
            >
              <span className={styles.btnEmoji}>💚</span>
              <span>こころの相談室</span>
            </button>

            {/* 指導医ログボタン */}
            <button
              className={styles.parentBadgeBtn}
              onClick={() => {
                sound.playPop();
                setShowParentModal(true);
              }}
              title="指導医ログ（学習進度グラフ・ほめ言葉ヒント・A4弱点印刷）"
              aria-label="指導医ログ"
              data-testid="header-parent-btn"
            >
              <span className={styles.btnEmoji}>👨‍⚕️</span>
              <span>指導医ログ</span>
            </button>

            {/* テーマ着せ替えボタン */}
            <button
              className={styles.controlBtn}
              onClick={cycleTheme}
              title={`カラーテーマ切り替え: 現在 ${themeIcons[currentTheme]}`}
              aria-label="テーマ切り替え"
            >
              {currentTheme === 'sakura' ? '🌸' : currentTheme === 'mint' ? '🌿' : currentTheme === 'lavender' ? '💜' : currentTheme === 'night' ? '🌙' : '🎨'}
            </button>

            {/* サウンド切り替えボタン */}
            <button
              className={styles.controlBtn}
              onClick={handleToggleSound}
              title={soundEnabled ? '効果音: ON（クリックで消音）' : '効果音: OFF（クリックで有効化）'}
              aria-label="効果音切り替え"
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>

            {/* 設定メニューボタン */}
            <button
              className={styles.menuBtn}
              onClick={() => {
                sound.playPop();
                navigate('/settings');
              }}
              title="設定・データ管理"
              aria-label="設定と教材の読み込み"
              data-testid="header-menu-btn"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={styles.mainContent}>
        {/* ナース猫ミケちゃんのメンター応援バナー */}
        <section className={styles.mentorBar}>
          <div className={styles.mentorAvatar}>🐱</div>
          <div className={styles.mentorSpeech} style={{ flex: 1 }}>
            <strong>ナース猫のミケちゃん:</strong>「おかえりなさい、先生！今日は【{nextStamp.name}】が元気をなくして待っているよ。今日の診察で、元気にしてあげよう！」
          </div>
        </section>

        {/* ゾーン1: 上段2カラム（本日の診察 と 知識の処方箋） */}
        <div className={styles.topCardsGrid}>
          {/* 左カラム: 本日の診察 */}
          <section className={styles.todayCard} data-testid="today-study-card">
            <div className={styles.todayCardContent} data-testid="card-breakdown">
              <div className={styles.areaHeaderRow}>
                <h2 className={styles.areaTitle}>🩺 本日の診察</h2>
                <span className={styles.areaEstimatedTime}>⏱️ 目安: 約5分</span>
              </div>
              <p className={styles.areaDescription}>
                今日復習すべき10問を忘却曲線に合わせて自動出題
              </p>

              {/* 出題教科セグメントコントロール（複数選択対応・トグルUI） */}
              <div className={styles.subjectSelectContainer}>
                <div className={styles.subjectSelectHeader}>
                  <span className={styles.subjectSelectTitle}>
                    出題教科（タップで複数選べるよ！）:
                  </span>
                  <span className={styles.subjectSelectCount}>
                    {isAllSubjectsSelected ? '🌟 全教科ミックス' : `🎯 ${selectedStudySubjects.length}教科を選択中`}
                  </span>
                </div>
                <div className={styles.categoryFilterRow} role="group" aria-label="出題教科の選択（複数選択可能）">
                  <button
                    key="all"
                    type="button"
                    className={`${styles.categoryFilterBtn} ${isAllSubjectsSelected ? styles.categoryFilterBtnActive : ''}`}
                    onClick={handleSelectAllSubjects}
                    data-testid="study-subject-all"
                    title="全教科をまとめて出題"
                  >
                    {isAllSubjectsSelected ? '✓ 🌟 全教科' : '🌟 全教科'}
                  </button>
                  {[
                    { id: 'rika' as Subject, label: '理科', icon: '🧪' },
                    { id: 'sansu' as Subject, label: '算数', icon: '📐' },
                    { id: 'shakai' as Subject, label: '社会', icon: '🗾' },
                    { id: 'kokugo' as Subject, label: '国語', icon: '📖' },
                  ].map(sub => {
                    const isSelected = selectedStudySubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`${styles.categoryFilterBtn} ${isSelected ? styles.categoryFilterBtnActive : ''}`}
                        onClick={() => handleToggleSubject(sub.id)}
                        data-testid={`study-subject-${sub.id}`}
                        aria-pressed={isSelected}
                        title={`クリックして${sub.label}を出題教科に追加/解除`}
                      >
                        {isSelected ? `✓ ${sub.icon} ${sub.label}` : `${sub.icon} ${sub.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.todayActions}>
              <button
                className={styles.startBtn}
                onClick={handleStartToday}
                data-testid="start-study-btn"
                title="📋 今日の10問内訳: 🔄 復習 3 / ✏️ やり直し 2 / 🌱 新知識 2 / ⭐ 応用 3"
              >
                {getStartButtonLabel()}
              </button>
            </div>
          </section>

          {/* 右カラム: 知識の処方箋（名作参考書マスター） */}
          <section className={styles.extraStudyCard} data-testid="section-extra-study">
            <div className={styles.todayCardContent}>
              <div className={styles.areaHeaderRow}>
                <h2 className={styles.areaTitle}>💊 知識の処方箋</h2>
                <span className={styles.areaEstimatedTime}>⏱️ 目安: 約3分</span>
              </div>
              <p className={styles.areaDescription}>
                名作参考書から厳選した重要知識をクイズで定着
              </p>

              <div className={styles.extraBookInfoRow}>
                <span className={styles.extraBookTitle}>📕 歴史人物80</span>
                <span className={styles.extraSubjectPill}>🗾 社会</span>
              </div>

              {/* 学習進捗・達成度 */}
              {(() => {
                const histProg = getRefBookProgress('history-80');
                const book = REFERENCE_BOOKS[0];
                return (
                  <div className={styles.extraProgressRow} data-testid="extra-history-progress">
                    <span className={styles.extraProgressLabel}>
                      💊 処方状況:
                    </span>
                    <span className={styles.extraProgressValue}>
                      {histProg.masteredIds.length} / {book.availableQuestionsCount} 人
                    </span>
                    {histProg.clearedSessionsCount > 0 && (
                      <span className={styles.extraClearedBadge}>
                        （完了 {histProg.clearedSessionsCount} 回）
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className={styles.extraActions}>
              <button
                className={styles.extraStartBtn}
                onClick={() => {
                  sound.playPop();
                  setActiveRefBookId('history-80');
                }}
                data-testid="start-extra-book-btn"
              >
                💊 歴史人物80にチャレンジ（10問） ❯
              </button>
            </div>
          </section>
        </div>

        {/* ゾーン2: 元気にした動物たちのカルテ */}
        <section className={styles.stampSection}>
          <div className={styles.stampLeft}>
            <div>
              <div className={styles.stampHeaderTitle}>
                🐾 元気にした動物たち {earnedStampIds.length + allMasteredSkills.length}匹
              </div>
              <div className={styles.stampNextHint}>
                👉 本日の診察と症例スタディで、動物たちが全快するよ！
              </div>
            </div>

            {/* スロット切り替えミニトグル */}
            <div className={styles.stampPreviewToggleRow} role="tablist" aria-label="カルテスロット切り替え">
              <button
                type="button"
                className={`${styles.stampPreviewTabBtn} ${stampPreviewType === 'daily' ? styles.stampPreviewTabBtnActive : ''}`}
                onClick={() => setStampPreviewType('daily')}
                data-testid="preview-tab-daily"
              >
                📅 本日の診察（{earnedStampIds.length} / {ANIMAL_STAMPS.length}）
              </button>
              <button
                type="button"
                className={`${styles.stampPreviewTabBtn} ${stampPreviewType === 'chart' ? styles.stampPreviewTabBtnActive : ''}`}
                onClick={() => setStampPreviewType('chart')}
                data-testid="preview-tab-chart"
              >
                🩺 症例全快（{allMasteredSkills.length} / {enrichedSkills.length}）
              </button>
            </div>

            {stampPreviewType === 'daily' ? (
              <div className={styles.stampIconRow}>
                {ANIMAL_STAMPS.map(stamp => {
                  const isEarned = earnedStampIds.includes(stamp.id);
                  return (
                    <div
                      key={stamp.id}
                      className={`${styles.stampSlot} ${isEarned ? styles.stampSlotActive : ''}`}
                      onClick={() => {
                        setStampModalTab('daily');
                        handleStampClick(isEarned);
                      }}
                      title={isEarned ? `${stamp.name}: 元気回復！クリックでプチ知識` : `${stamp.name}: 治療を待っているよ`}
                    >
                      {isEarned ? stamp.icon : '❓'}
                    </div>
                  );
                })}
                {/* 案A（推奨）: 動物アイコン列の末尾に「すべて見る」チップを配置 */}
                <button
                  type="button"
                  className={styles.stampMoreChip}
                  onClick={() => {
                    sound.playPop();
                    setStampModalTab('daily');
                    setShowStampModal(true);
                  }}
                  data-testid="open-stamp-book-btn"
                  title="すべての動物カルテをひらく"
                  aria-label="動物カルテをひらく"
                >
                  <span className={styles.stampMoreText}>すべて見る</span>
                  <span className={styles.stampMoreArrow}>❯</span>
                </button>
              </div>
            ) : (
              <div className={styles.stampIconRow}>
                {enrichedSkills.slice(0, 15).map(skill => {
                  const isEarned = skill.isMastered;
                  const details = getSkillStampDetails(skill);
                  return (
                    <div
                      key={skill.id}
                      className={`${styles.stampSlot} ${isEarned ? styles.stampSlotActive : ''}`}
                      style={{
                        borderColor: isEarned ? '#10b981' : 'var(--color-border)',
                        background: isEarned ? '#ecfdf5' : 'var(--surface-subtle)',
                      }}
                      onClick={() => {
                        setStampModalTab('chart');
                        if (isEarned) {
                          sound.playAnimalHappy();
                          fireConfetti({ count: 20 });
                          setOpenedChartStampIds(prev => (prev.includes(skill.id) ? prev : [...prev, skill.id]));
                        } else {
                          sound.playPop();
                        }
                        setShowStampModal(true);
                      }}
                      title={isEarned ? `${details.name}: 全快！クリックで豆知識` : `${details.name}（${skill.title}）: 症例特訓で全快させよう！`}
                      data-testid={`preview-chart-stamp-${skill.id}`}
                    >
                      {isEarned ? details.icon : '🔒'}
                    </div>
                  );
                })}
                {/* 案A（推奨）: 症例全快プレビューでも末尾にチップを配置 */}
                <button
                  type="button"
                  className={styles.stampMoreChip}
                  onClick={() => {
                    sound.playPop();
                    setStampModalTab('chart');
                    setShowStampModal(true);
                  }}
                  data-testid="open-stamp-book-btn-chart"
                  title="すべての症例カルテをひらく"
                  aria-label="動物カルテをひらく"
                >
                  <span className={styles.stampMoreText}>すべて見る</span>
                  <span className={styles.stampMoreArrow}>❯</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* スマホ専用下段ビュー切り替えタブ（スクロール不要で認定試験に瞬時に移動可能） */}
        <div className={styles.mobileTabSwitcher} role="tablist" aria-label="症例スタディと認定試験の切り替え">
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${mobileBottomTab === 'progress' ? styles.mobileTabBtnActive : ''}`}
            onClick={() => {
              sound.playPop();
              setMobileBottomTab('progress');
            }}
            data-testid="mobile-tab-progress"
          >
            🩺 症例スタディ ({filteredSkills.length})
          </button>
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${mobileBottomTab === 'exam' ? styles.mobileTabBtnActiveGold : ''}`}
            onClick={() => {
              sound.playPop();
              setMobileBottomTab('exam');
            }}
            data-testid="mobile-tab-exam"
          >
            🏆 認定試験
          </button>
        </div>

        {/* ゾーン3: 下段2カラム（全テーマの症例スタディ と 獣医師認定試験） */}
        <div className={styles.bottomCardsGrid}>
          {/* 左カラム: 🩺 症例スタディ（全テーマ） */}
          <div
            className={`${styles.card} ${mobileBottomTab !== 'progress' ? styles.cardHiddenOnMobile : ''}`}
            data-testid="card-weakness"
          >
            <div className={styles.caseStudyHeaderRow}>
              <div className={styles.areaHeaderRow}>
              <h2 className={styles.areaTitle}>🩺 症例スタディ</h2>
            </div>
            </div>

            <p className={styles.areaDescription}>
              科目ごとの単元をすべて攻略しよう
            </p>

            {/* 症例スタディ 挑戦のごほうびカード（認定試験カードと完全統一） */}
            <div className={`${styles.rewardCard} ${styles.unifiedRewardCard}`} data-testid="key-progress-box">
              <div className={styles.rewardTitle}>🎖️ 挑戦のごほうび</div>
              <p className={styles.rewardDesc}>
                各科目のすべての症例理解度が<strong>【⭐Lv.4 マスター】</strong>になると、<strong>「動物からの感謝メッセージ」</strong>が届くよ！
              </p>
              <div className={styles.rewardBottomRow}>
                <span className={styles.rewardProgressText}>
                  全教科の全快進度: <strong>{totalMasteredCount} / {totalSkillsCount} テーマ</strong>
                </span>
                {totalMasteredCount >= totalSkillsCount && totalSkillsCount > 0 && (
                  <button
                    onClick={() => {
                      sound.playChime();
                      setShowAllAnimalsModal(true);
                    }}
                    className={styles.allAnimalsBtn}
                    data-testid="all-animals-message-btn"
                  >
                    🎉 感謝メッセージを見る！
                  </button>
                )}
              </div>
            </div>

            {/* 小学生向け科目別フィルター */}
            <div className={styles.categoryFilterRow} data-testid="skill-subject-filter-row">
              {[
                { id: 'rika', label: `🧪 理科 (${rikaCount})` },
                { id: 'sansu', label: `📐 算数 (${sansuCount})` },
                { id: 'shakai', label: `🗾 社会 (${shakaiCount})` },
                { id: 'kokugo', label: `📖 国語 (${kokugoCount})` },
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.categoryFilterBtn} ${selectedSkillSubject === cat.id ? styles.categoryFilterBtnActive : ''}`}
                  onClick={() => {
                    sound.playPop();
                    setSelectedSkillSubject(cat.id as any);
                  }}
                  data-testid={`skill-subject-btn-${cat.id}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* サクッと要点暗記カード（トリアージ・カード）導線バナー */}
            <div className={styles.triageBanner} data-testid="triage-card-banner">
              <div className={styles.triageBannerContent}>
                <div className={styles.triageBannerHeader}>
                  <span className={styles.triageBannerIcon}>📇</span>
                  <strong className={styles.triageBannerTitle}>
                    要点暗記カード
                  </strong>
                  <span className={styles.triageSubjectTag}>
                    {selectedSkillSubject === 'rika' ? '🧪 理科' : selectedSkillSubject === 'sansu' ? '📐 算数' : selectedSkillSubject === 'shakai' ? '🗾 社会' : '📖 国語'}
                  </span>
                </div>
                <p className={styles.triageBannerDesc}>
                  スキマ時間に重要急所をパッと思い出して、記憶キープ度をチャージしよう！
                </p>
              </div>
              <button
                className={styles.triageCardLaunchBtn}
                onClick={() => {
                  sound.playPop();
                  const firstSkillOfSubject = ALL_PROGRESS_SKILLS.find(s => s.subject === selectedSkillSubject);
                  setFlashCardSkillId(firstSkillOfSubject?.id || ALL_PROGRESS_SKILLS[0].id);
                }}
                title="全症例の急所・重症度をサクッと確認できるフラッシュカード"
                data-testid="launch-triage-card-btn"
              >
                <span>📇 カードをめくる ❯</span>
              </button>
            </div>

            {/* テーマリスト */}
            <div className={styles.allSkillsContainer}>
              {/* 未達成テーマ（過剰スクロール防止のためアコーディオン開閉・デフォルト閉） */}
              {filteredSkills.filter(s => !s.isMastered).length > 0 && (
                <button
                  type="button"
                  className={styles.unmasteredAccordionBtn}
                  onClick={() => {
                    sound.playPop();
                    setShowUnmasteredSkills(!showUnmasteredSkills);
                  }}
                  data-testid="toggle-unmastered-skills-btn"
                  title="レベルアップをめざすテーマの表示/非表示を切り替え"
                >
                  <span>✏️ 治療中の症例（あと {remainingCount} つ）</span>
                  <span className={styles.accordionToggleLabel}>{showUnmasteredSkills ? '▲ とじる' : '▼ ひらく（特訓する）'}</span>
                </button>
              )}
              {showUnmasteredSkills && filteredSkills.filter(s => !s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                const enhance = THEME_ENHANCEMENTS[skill.id];
                const patientIcon = enhance?.patientAnimal?.icon || skill.patientIcon || '🐾';
                const patientName = enhance?.patientAnimal?.name || skill.patientName || '患者どうぶつ';
                const retention = getMemoryRetention(skill.id);

                return (
                  <div key={skill.id} className={styles.skillRowMini}>
                    <div className={styles.skillRowTop}>
                      <div className={styles.skillTitleArea}>
                        <div
                          className={styles.patientIconWrap}
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playPop();
                            setActivePatientSkillId(prev => prev === skill.id ? null : skill.id);
                          }}
                          title={`患者: ${patientName}`}
                          role="button"
                          tabIndex={0}
                        >
                          <span className={styles.patientIcon}>{patientIcon}</span>
                          <div className={`${styles.patientTooltip} ${activePatientSkillId === skill.id ? styles.patientTooltipVisible : ''}`}>
                            患者: {patientName}
                          </div>
                        </div>
                        <div className={styles.skillTitle}>{skill.title}</div>
                      </div>
                      <div className={styles.skillBadgeGroup}>
                        <span className={styles.extraSubjectBadge}>
                          {getSubjectBadgeText(skill.subject)}
                        </span>
                        <span
                          className={styles.levelBadge}
                          style={{ color: info.badgeColor, background: info.badgeBg, cursor: 'pointer' }}
                          onClick={() => {
                            sound.playPop();
                            setShowLevelHelpModal(true);
                          }}
                          title={`${info.shortLabel}（クリックでLvの説明とレベルアップ方法を表示）`}
                          data-testid={`level-badge-${skill.id}`}
                          role="button"
                          tabIndex={0}
                        >
                          {info.shortLabel}
                        </span>
                      </div>
                    </div>

                    <div className={styles.skillMetaRow}>
                      <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                        <span>🌱 記憶キープ:</span>
                        <div className={styles.memoryBar}>
                          <div
                            className={styles.memoryBarFill}
                            style={{
                              width: `${retention}%`,
                              background: retention >= 80 ? 'var(--success)' : retention >= 50 ? 'var(--warning)' : '#ef4444',
                            }}
                          />
                        </div>
                        <strong data-testid={`retention-score-${skill.id}`}>{retention}%</strong>
                      </div>

                      <div className={styles.skillActionGroup}>
                        <button
                          className={styles.focusStudyBtn}
                          onClick={() => {
                            sound.playChime();
                            startSkillFocusSession(skill.id);
                            navigate('/study');
                          }}
                          title="この症例の問題を集中的に解いてレベルアップ！"
                          data-testid={`focus-study-btn-${skill.id}`}
                        >
                          <span>🎯 この症例を特訓する</span>
                          <span className={styles.btnArrow}>❯</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 達成済みテーマ（スマホでの過剰スクロール防止のためアコーディオン開閉） */}
              {filteredSkills.filter(s => s.isMastered).length > 0 && (
                <button
                  type="button"
                  className={styles.masteredAccordionBtn}
                  onClick={() => {
                    sound.playPop();
                    setShowMasteredSkills(!showMasteredSkills);
                  }}
                  data-testid="toggle-mastered-skills-btn"
                  title="マスター達成済みテーマの表示/非表示を切り替え"
                >
                  <span>✅ 全快した症例（{masteredCount} つ）</span>
                  <span>{showMasteredSkills ? '▲ とじる' : '▼ ひらく'}</span>
                </button>
              )}
              {showMasteredSkills && filteredSkills.filter(s => s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                const enhance = THEME_ENHANCEMENTS[skill.id];
                const patientIcon = enhance?.patientAnimal?.icon || skill.patientIcon || '🐾';
                const patientName = enhance?.patientAnimal?.name || skill.patientName || '患者どうぶつ';
                const retention = getMemoryRetention(skill.id);

                return (
                  <div key={skill.id} className={`${styles.skillRowMini} ${styles.skillRowMiniMastered}`}>
                    <div className={styles.skillRowTop}>
                      <div className={styles.skillTitleArea}>
                        <div
                          className={styles.patientIconWrap}
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playPop();
                            setActivePatientSkillId(prev => prev === skill.id ? null : skill.id);
                          }}
                          title={`患者: ${patientName}（全快！）`}
                          role="button"
                          tabIndex={0}
                        >
                          <span className={styles.patientIcon}>{patientIcon}</span>
                          <div className={`${styles.patientTooltip} ${activePatientSkillId === skill.id ? styles.patientTooltipVisible : ''}`}>
                            患者: {patientName}（全快！）
                          </div>
                        </div>
                        <div className={styles.skillTitle}>{skill.title}</div>
                      </div>
                      <div className={styles.skillBadgeGroup}>
                        <span className={styles.extraSubjectBadge}>
                          {getSubjectBadgeText(skill.subject)}
                        </span>
                        <span
                          className={styles.levelBadge}
                          style={{ color: info.badgeColor, background: info.badgeBg, cursor: 'pointer' }}
                          onClick={() => {
                            sound.playPop();
                            setShowLevelHelpModal(true);
                          }}
                          title={`${info.shortLabel}（クリックでLvの説明とレベルアップ方法を表示）`}
                          data-testid={`level-badge-${skill.id}`}
                          role="button"
                          tabIndex={0}
                        >
                          {info.shortLabel}
                        </span>
                      </div>
                    </div>

                    <div className={styles.skillMetaRow}>
                      <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                        <span>🌱 記憶キープ:</span>
                        <div className={styles.memoryBar}>
                          <div
                            className={styles.memoryBarFill}
                            style={{
                              width: `${retention}%`,
                              background: retention >= 80 ? 'var(--success)' : retention >= 50 ? 'var(--warning)' : '#ef4444',
                            }}
                          />
                        </div>
                        <strong data-testid={`retention-score-${skill.id}`}>{retention}%</strong>
                      </div>

                      <div className={styles.skillActionGroup}>
                        <button
                          className={styles.focusStudyBtn}
                          onClick={() => {
                            sound.playChime();
                            startSkillFocusSession(skill.id);
                            navigate('/study');
                          }}
                          title="この症例の問題を復習して全快をキープ！"
                          data-testid={`focus-study-btn-mastered-${skill.id}`}
                        >
                          <span>🎯 この症例を復習</span>
                          <span className={styles.btnArrow}>❯</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 🏆 合格ドクター認定試験 */}
          <div
            className={`${styles.card} ${mobileBottomTab !== 'exam' ? styles.cardHiddenOnMobile : ''}`}
            data-testid="card-final-challenge"
          >
            <div className={styles.examHeaderRow}>
              <div className={styles.areaHeaderRow}>
                <h2 className={styles.areaTitle}>🏆 獣医師認定試験</h2>
              </div>
            </div>

            <p className={styles.areaDescription}>
              実際の入試問題で力試しをしよう
            </p>

            {/* 認定試験 挑戦のごほうびカード */}
            <div className={`${styles.rewardCard} ${styles.unifiedRewardCard}`} data-testid="challenge-reward-card">
              <div className={styles.rewardTitle}>🎖️ 挑戦のごほうび</div>
              <p className={styles.rewardDesc}>
                各年度のすべての科目で高得点をとって合格証をゲット！
              </p>
              <ul className={styles.rewardScoreGrid}>
                <li>
                  <strong>📜 60点以上</strong>: 獣医学部 合格証
                </li>
                <li>
                  <strong>🥉 80点以上</strong>: 獣医師国家試験 合格証
                </li>
                <li>
                  <strong>🥈 90点以上</strong>: 動物診療施設 開設許可証
                </li>
                <li>
                  <strong>👑 100点</strong>: 世界獣医師会 会長賞
                </li>
              </ul>
            </div>

            {/* 年度ごと、科目ごとの1行入り口ボタンリスト */}
            <div className={styles.compactExamList} data-testid="compact-exam-list">
              {SUPPORTED_EXAM_YEARS.map(yr => {
                const yrData = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[yr] || {};
                const allFourSubjects: { id: Subject; label: string; icon: string }[] = [
                  { id: 'rika', label: '理科', icon: '🧪' },
                  { id: 'sansu', label: '算数', icon: '📐' },
                  { id: 'shakai', label: '社会', icon: '🗾' },
                  { id: 'kokugo', label: '国語', icon: '📖' },
                ];

                return (
                  <div key={yr} className={styles.compactExamRow} data-testid={`exam-year-row-${yr}`}>
                    <div className={styles.compactYearLabel}>
                      📅 {yr}年度
                    </div>

                    <div className={styles.compactSubjectBtns}>
                      {allFourSubjects.map(subItem => {
                        const sub = subItem.id;
                        const subData = yrData[sub];
                        const hasData = subData && subData.sections && subData.sections.length > 0;

                        if (!hasData) {
                          // 指示4: データがない科目は薄いグレーで「—(出題なし)」枠を出して位置を保つ
                          return (
                            <div
                              key={sub}
                              className={styles.compactExamBtnDisabled}
                              title={`${yr}年度は${subItem.label}の出題データがありません`}
                              aria-disabled="true"
                            >
                              <span className={styles.compactBtnIcon}>{subItem.icon}</span>
                              <span className={styles.compactBtnName}>{subItem.label}</span>
                              <span className={styles.compactBtnScoreDisabled}>—</span>
                            </div>
                          );
                        }

                        const summary = examSummaries[yr]?.[sub];
                        const bestScore = summary?.bestScore ?? null;
                        const isPerfect = summary?.isPerfect ?? false;
                        const badgeTier = summary?.badgeTier ?? null;

                        const scoreText = isPerfect ? '100点' : bestScore !== null ? `${bestScore}点` : '—';

                        return (
                          <button
                            key={sub}
                            type="button"
                            className={`${styles.compactExamBtn} ${
                              isPerfect
                                ? styles.compactExamBtnPerfect
                                : badgeTier === 'silver'
                                ? styles.compactExamBtnSilver
                                : badgeTier === 'bronze'
                                ? styles.compactExamBtnBronze
                                : badgeTier === 'certificate'
                                ? styles.compactExamBtnCert
                                : styles.compactExamBtnDefault
                            }`}
                            onClick={() => {
                              sound.playPop();
                              navigate(`/final-challenge?year=${yr}&subject=${sub}`);
                            }}
                            data-testid={`start-exam-btn-${yr}-${sub}`}
                            title={`${yr}年度 ${subData.subjectLabel}（過去最高得点: ${scoreText}）を受験`}
                          >
                            <span className={styles.compactBtnIcon}>
                              {isPerfect ? '👑' : subData.icon}
                            </span>
                            <span className={styles.compactBtnName}>
                              {subData.subjectLabel}
                            </span>
                            <span className={`${styles.compactBtnScore} ${isPerfect ? styles.compactBtnScorePerfect : ''}`}>
                              ({scoreText})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.compactExamNote}>
              <span>※カッコ内は過去の最高得点</span>
            </div>
          </div>
        </div>
      </main>



      {/* 動物カルテモーダル */}
      {showStampModal && (
        <div className={styles.modalOverlay} onClick={() => setShowStampModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleWrap}>
                <span className={styles.modalHeaderIcon}>📋</span>
                <div>
                  <h3 className={styles.modalHeaderTitle}>
                    🐾 元気にした動物たちのカルテ
                  </h3>
                  <div className={styles.modalHeaderSubtext}>
                    全快した動物たちをクリックすると、カルテのメッセージや豆知識が飛び出すよ！
                  </div>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  sound.playPop();
                  setShowStampModal(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* カルテモーダル内タブ切り替え */}
            <div className={styles.stampModalTabs} role="tablist">
              <button
                type="button"
                className={`${styles.stampModalTabBtn} ${stampModalTab === 'daily' ? styles.stampModalTabBtnActive : ''}`}
                onClick={() => {
                  sound.playPop();
                  setStampModalTab('daily');
                }}
                data-testid="stamp-tab-daily"
              >
                📅 本日の診察カルテ（{earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹）
              </button>
              <button
                type="button"
                className={`${styles.stampModalTabBtn} ${stampModalTab === 'chart' ? styles.stampModalTabBtnActive : ''}`}
                onClick={() => {
                  sound.playPop();
                  setStampModalTab('chart');
                }}
                data-testid="stamp-tab-chart"
              >
                🩺 症例全快ドクターカルテ（{allMasteredSkills.length} / {enrichedSkills.length} 匹）
              </button>
            </div>

            {stampModalTab === 'daily' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {ANIMAL_STAMPS.map(stamp => {
                  const isEarned = earnedStampIds.includes(stamp.id);
                  const isOpened = openedStampIds.includes(stamp.id);

                  return (
                    <div
                      key={stamp.id}
                      onClick={() => {
                        if (isEarned) {
                          sound.playAnimalHappy();
                          fireConfetti({ count: 20 });
                          // 1度クリックした動物は開きっぱなしを維持（他の動物をクリックしても閉じない）
                          setOpenedStampIds(prev => (prev.includes(stamp.id) ? prev : [...prev, stamp.id]));
                        } else {
                          sound.playPop();
                        }
                      }}
                      style={{
                        border: isEarned ? '2px solid var(--primary)' : '1px dashed var(--border)',
                        background: isEarned ? (isOpened ? '#fef3c7' : 'var(--primary-weak)') : 'var(--surface-subtle)',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        opacity: isEarned ? 1 : 0.65,
                        cursor: 'pointer',
                        boxShadow: isEarned ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                        transition: 'all 0.2s ease',
                        transform: isOpened ? 'scale(1.02)' : 'none',
                      }}
                      data-testid={`animal-stamp-${stamp.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '32px' }}>{isEarned ? stamp.icon : '🔒'}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text)' }}>
                            {stamp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: isEarned ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700' }}>
                            {isEarned ? `回復: ${stamp.patientTitle}` : '学習を続けて助けよう！'}
                          </div>
                        </div>
                      </div>

                      {isEarned && (
                        isOpened ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            {/* 飛び出す鳴き声・感謝メッセージ */}
                            <div
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #f59e0b',
                                color: '#92400e',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                lineHeight: '1.45',
                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)',
                              }}
                              data-testid={`stamp-cheer-${stamp.id}`}
                            >
                              🐾 {stamp.cheerMessage}
                            </div>

                            {/* 飛び出す獣医師プチ知識 */}
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-subtle)',
                                background: 'var(--surface)',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                lineHeight: '1.45',
                              }}
                              data-testid={`stamp-fact-${stamp.id}`}
                            >
                              {stamp.vetFact}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--primary)',
                              background: 'rgba(37, 99, 235, 0.08)',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            👆 タップするとメッセージと豆知識が飛び出すよ！
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 教科別絞り込み */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-subtle)' }}>教科:</span>
                  {[
                    { id: 'all', label: `🌟 すべて (${allMasteredSkills.length}/${enrichedSkills.length})` },
                    { id: 'rika', label: `🧪 理科 (${enrichedSkills.filter(s => s.subject === 'rika' && s.isMastered).length}/${rikaCount})` },
                    { id: 'sansu', label: `📐 算数 (${enrichedSkills.filter(s => s.subject === 'sansu' && s.isMastered).length}/${sansuCount})` },
                    { id: 'shakai', label: `🗾 社会 (${enrichedSkills.filter(s => s.subject === 'shakai' && s.isMastered).length}/${shakaiCount})` },
                    { id: 'kokugo', label: `📖 国語 (${enrichedSkills.filter(s => s.subject === 'kokugo' && s.isMastered).length}/${kokugoCount})` },
                  ].map(subTab => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setChartStampSubject(subTab.id as any);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: chartStampSubject === subTab.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: chartStampSubject === subTab.id ? 'var(--primary)' : 'var(--surface)',
                        color: chartStampSubject === subTab.id ? '#ffffff' : 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      data-testid={`chart-stamp-filter-${subTab.id}`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* カルテスタンプ一覧グリッド */}
                <div className={styles.chartStampGrid} data-testid="chart-stamp-grid">
                  {enrichedSkills
                    .filter(s => chartStampSubject === 'all' || s.subject === chartStampSubject)
                    .map(skill => {
                      const isEarned = skill.isMastered;
                      const isOpened = openedChartStampIds.includes(skill.id);
                      const details = getSkillStampDetails(skill);

                      return (
                        <div
                          key={skill.id}
                          className={`${styles.chartStampCard} ${isEarned ? styles.chartStampCardMastered : styles.chartStampCardLocked}`}
                          onClick={() => {
                            if (isEarned) {
                              sound.playAnimalHappy();
                              fireConfetti({ count: 20 });
                              setOpenedChartStampIds(prev => (prev.includes(skill.id) ? prev : [...prev, skill.id]));
                            } else {
                              sound.playPop();
                            }
                          }}
                          data-testid={`chart-animal-stamp-${skill.id}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '32px' }}>{isEarned ? details.icon : '🔒'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text)' }}>
                                  {details.name}
                                </div>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: isEarned ? '#ecfdf5' : 'var(--surface-subtle)',
                                    color: isEarned ? '#059669' : 'var(--text-subtle)',
                                    border: isEarned ? '1px solid #a7f3d0' : '1px solid var(--border)',
                                  }}
                                >
                                  {isEarned ? '🎉 全快！' : '🩺 治療中'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px', fontWeight: 600 }}>
                                【{skill.subjectLabel}】{skill.title}
                              </div>
                            </div>
                          </div>

                          {isEarned ? (
                            isOpened ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                <div
                                  style={{
                                    background: '#ffffff',
                                    border: '1.5px solid #10b981',
                                    color: '#065f46',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    lineHeight: '1.45',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                                  }}
                                  data-testid={`chart-stamp-cheer-${skill.id}`}
                                >
                                  🐾 {details.symptom}
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-subtle)',
                                    background: 'var(--surface)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    lineHeight: '1.45',
                                  }}
                                  data-testid={`chart-stamp-fact-${skill.id}`}
                                >
                                  {details.examPoint}
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#059669',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                }}
                              >
                                👆 タップすると全快メッセージと急所ポイントが飛び出すよ！
                              </div>
                            )
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                💡 症例特訓で【⭐Lv.4 マスター】を達成すると全快カルテが手に入るよ！
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sound.playChime();
                                  setShowStampModal(false);
                                  startSkillFocusSession(skill.id);
                                  navigate('/study');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--primary)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  alignSelf: 'flex-start',
                                  marginTop: '2px',
                                }}
                                data-testid={`train-from-stamp-${skill.id}`}
                              >
                                🎯 この症例を特訓して全快にする ❯
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 合格カルテ完成度 100%達成ガイドモーダル */}
      {showCompletionHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCompletionHelpModal(false)} data-testid="completion-help-modal">
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📈</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text)' }}>
                    合格カルテ完成度（現在: {completionPercent}%）を100%にするには？
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                    全{ALL_PROGRESS_SKILLS.length}テーマの「記憶定着メーター」の平均値だよ！
                  </div>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  sound.playPop();
                  setShowCompletionHelpModal(false);
                }}
                data-testid="close-completion-help-btn"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              {/* ナース猫ミケちゃんからのアドバイス */}
              <div
                style={{
                  background: 'var(--primary-weak)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '32px' }}>🐱</span>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text)' }}>
                  <strong>ナース猫のミケちゃん:</strong><br />
                  「先生、おつかれさま！合格カルテ完成度は全{ALL_PROGRESS_SKILLS.length}テーマの記憶定着メーターの平均値だよ。
                  人間の脳は時間が経つと少しずつ忘れちゃうけれど、<strong>3つのアクション</strong>で誰でも100%を満タンにできるよ！」
                </div>
              </div>

              {/* 100%にするための3つのアクション */}
              <div className={styles.modalActionList}>
                <div
                  className={styles.modalActionCard}
                  data-testid="action-item-focus"
                >
                  <span style={{ fontSize: '26px' }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <div className={styles.modalActionTitle}>
                      ① 症例の「特訓問題」を解いて正解する（大幅UP！）
                    </div>
                    <div className={styles.modalActionDesc}>
                      症例スタディの「🎯 この症例を特訓する」で正解すると、記憶キープ度が一気に80%〜100%（全快）へ上がります。
                    </div>
                  </div>
                </div>

                <div
                  className={styles.modalActionCard}
                  data-testid="action-item-flashcard"
                >
                  <span style={{ fontSize: '26px' }}>📇</span>
                  <div style={{ flex: 1 }}>
                    <div className={styles.modalActionTitle}>
                      ② 「トリアージ・カード」をサクッとめくって復習する（急速チャージ！）
                    </div>
                    <div className={styles.modalActionDesc}>
                      時間がないときは「📇 トリアージ・カード」で急所ポイントを思い出すだけで、記憶キープ度が即座に回復します。
                    </div>
                  </div>
                </div>

                <div
                  className={styles.modalActionCard}
                  data-testid="action-item-daily"
                >
                  <span style={{ fontSize: '26px' }}>🐾</span>
                  <div style={{ flex: 1 }}>
                    <div className={styles.modalActionTitle}>
                      ③ 「本日の診察」を毎日解く（100%キープ！）
                    </div>
                    <div className={styles.modalActionDesc}>
                      忘却曲線で減りかけた単元が自動で優先出題されるので、毎日1回解くだけで100%をずっとキープできます！
                    </div>
                  </div>
                </div>
              </div>

              {/* 現在の単元状況 */}
              <div
                style={{
                  background: 'var(--surface-subtle)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--success-text)', fontWeight: 800, fontSize: '18px' }}>
                    {enrichedSkills.filter(s => getMemoryRetention(s.id) >= 80).length} 単元
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>🟢 80%以上（バッチリ！）</div>
                </div>
                <div>
                  <div style={{ color: 'var(--warning-text)', fontWeight: 800, fontSize: '18px' }}>
                    {enrichedSkills.filter(s => getMemoryRetention(s.id) >= 50 && getMemoryRetention(s.id) < 80).length} 単元
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>🟡 50〜79%（復習の好機！）</div>
                </div>
                <div>
                  <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '18px' }}>
                    {enrichedSkills.filter(s => getMemoryRetention(s.id) < 50).length} 単元
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>🔴 50%未満（特訓しよう）</div>
                </div>
              </div>

              {/* アクションボタン */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className={styles.focusStudyBtn}
                  style={{ width: 'auto', padding: '10px 20px', fontSize: '13px' }}
                  onClick={() => {
                    sound.playPop();
                    setShowCompletionHelpModal(false);
                    const el = document.querySelector('[data-testid="card-weakness"]');
                    if (el && typeof el.scrollIntoView === 'function') {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  data-testid="jump-to-weakness-btn"
                >
                  🎯 症例スタディで記憶メーターを100%にする ❯
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lvってなに？（用語・レベル解説モーダル） */}
      {showLevelHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLevelHelpModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>💡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text)' }}>
                    知識のレベル（Lv）ってなに？
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                    中学受験の知識を「丸暗記」から「一生モノの武器」にする7ステップ！
                  </div>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  sound.playPop();
                  setShowLevelHelpModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="level-help-list">
              {[
                {
                  stage: 'M1',
                  lv: 'Lv.1',
                  name: '🌱 みならい助手',
                  desc: '選択肢を見れば正解を選べるレベル！まずはここからスタート。',
                  howToUp: '💡 選択肢なしでパッと思い出せると【Lv.2】へアップ！',
                },
                {
                  stage: 'M2',
                  lv: 'Lv.2',
                  name: '🌿 てごたえあり',
                  desc: '選択肢を見る前に、頭の中で「答えはこれだ！」と思い出せるレベル！',
                  howToUp: '💡 「なぜそうなるか」理由・手順問題に正解で【Lv.3】へアップ！',
                },
                {
                  stage: 'M3',
                  lv: 'Lv.3',
                  name: '🍀 なっとく理由',
                  desc: '「なぜそうなるのか」の理由や、解く手順までしっかり説明できるレベル！',
                  howToUp: '💡 場面が変わった応用問題に正解で【⭐Lv.4マスター】達成！',
                },
                {
                  stage: 'M4',
                  lv: 'Lv.4',
                  name: '⭐ カルテマスター',
                  desc: '数字や問題の場面が変わった【初めて見る応用問題】でも自力で解けるレベル！',
                  howToUp: '💡 1日後・3日後の復習で記憶メーターを高くキープすると【Lv.5】へ！',
                },
                {
                  stage: 'M5',
                  lv: 'Lv.5',
                  name: '👑 かんぺき定着',
                  desc: '1日後や3日後に復習しても忘れていない、本物の実力がついた証拠！',
                  howToUp: '💡 本番形式の「獣医師認定試験」で満点をとると最高峰【Lv.6】へ！',
                },
                {
                  stage: 'M6',
                  lv: 'Lv.6',
                  name: '🏆 合格ドクター',
                  desc: '本番形式のテストで満点を達成！未来の獣医さんへの第一歩です！',
                  howToUp: '🎉 全問制覇マスター達成！本番入試でも自信を持って挑もう！',
                },
              ].map(item => (
                <div
                  key={item.stage}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                  }}
                  data-testid={`level-help-item-${item.stage}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary)' }}>{item.lv}</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', lineHeight: '1.5' }}>{item.desc}</div>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700, marginTop: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '5px 8px', borderRadius: '6px', lineHeight: '1.4' }}>
                    {item.howToUp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 過去の認定試験採点カルテ・成績表モーダル */}
      {showHistoryModal && (
        <FinalExamHistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {/* 全動物たちからの特別感謝メッセージモーダル（カギ全問達成特典） */}
      {showAllAnimalsModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAllAnimalsModal(false)}
          data-testid="all-animals-modal"
        >
          <div
            className={styles.modalContent}
            style={{ maxWidth: '640px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🎉</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text)' }}>
                    全動物たちからの特別感謝メッセージ
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                    全テーマの【⭐Lv.4マスター】達成おめでとう！
                  </div>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  sound.playPop();
                  setShowAllAnimalsModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆 🐾 👑 🐾 🏆</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900', color: '#78350f' }}>
                「すべてのカルテをマスターしてくれてありがとう！！」
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
                きみが毎日カルテで学習してくれたおかげで、クリニックの動物たちがみんな元気になったよ！<br />
                きみはもう本物の知識をもった立派なみならい獣医さんです！
              </p>
            </div>

            {/* 動物たちの一言メッセージ一覧 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {ANIMAL_STAMPS.map(animal => (
                <div
                  key={animal.id}
                  style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                  data-testid={`animal-message-card-${animal.id}`}
                >
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{animal.icon}</span>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{animal.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', margin: '2px 0' }}>
                      {animal.cheerMessage}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-subtle)', lineHeight: '1.4' }}>
                      {animal.vetFact}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                className={styles.stampBookBtn}
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                onClick={() => {
                  sound.playPop();
                  setShowAllAnimalsModal(false);
                }}
              >
                ありがとう！これからも頑張るよ！ 🐾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 保護者向け学習・成長アナリティクスカルテモーダル */}
      {showParentModal && (
        <ParentDashboardModal
          onClose={() => setShowParentModal(false)}
          onStartWeaknessQuiz={(skillId) => {
            // 保護者カルテは開いたまま維持し、前面に暗記カードを表示する（閉じたら保護者カルテに戻る）
            setFlashCardSkillId(skillId);
          }}
          onInspectQuestion={(questionId) => {
            setShowParentModal(false);
            startSingleQuestionSession(questionId);
            navigate('/study');
          }}
        />
      )}

      {/* サクッと暗記カードモーダル（最前面スタック） */}
      {flashCardSkillId && (
        <QuickFlashCardModal
          initialSkillId={flashCardSkillId}
          onClose={() => setFlashCardSkillId(null)}
          onStartFocusSession={(skillId) => {
            setFlashCardSkillId(null);
            setShowParentModal(false);
            startSkillFocusSession(skillId);
            navigate('/study');
          }}
        />
      )}

      {/* 知識の処方箋・名作参考書特訓モーダル */}
      {activeRefBookId && (
        <ReferenceBookQuizModal
          bookId={activeRefBookId}
          onClose={() => setActiveRefBookId(null)}
          onUpdate={() => setRefBookTick(t => t + 1)}
        />
      )}
    </div>
  );
};
