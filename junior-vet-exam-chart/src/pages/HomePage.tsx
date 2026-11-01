import React, { useState, useEffect } from 'react';
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
import { APP_VERSION, BUILD_TIMESTAMP } from '../version';
import { checkForAppUpdate } from '../utils/version-checker';
import { getDaysUntilExam } from '../utils/countdown-helper';
import { AnimatedVetPet } from '../components/AnimatedVetPet';
import { ReferenceBookQuizModal } from '../components/ReferenceBookQuizModal';
import { REFERENCE_BOOKS } from '../data/extra-history-80';
import { getRefBookProgress } from '../utils/reference-book-store';
import type { Subject } from '../types';
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
  const [showParentModal, setShowParentModal] = useState(false);
  const [showAllAnimalsModal, setShowAllAnimalsModal] = useState(false);
  const [flashCardSkillId, setFlashCardSkillId] = useState<string | null>(null);
  const [activeRefBookId, setActiveRefBookId] = useState<string | null>(null);
  const [refBookTick, setRefBookTick] = useState<number>(0);

  // テーマ・サウンド状態
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSkillSubject, setSelectedSkillSubject] = useState<'all' | 'rika' | 'sansu' | 'shakai' | 'kokugo'>('all');
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
  const [manualCheckStatus, setManualCheckStatus] = useState<string | null>(null);

  const handleManualUpdateCheck = async () => {
    sound.playPop();
    setManualCheckStatus('checking');
    const res = await checkForAppUpdate();
    if (res.hasUpdate) {
      setManualCheckStatus('update-available');
    } else if (!res.isOnline) {
      setManualCheckStatus('offline');
      setTimeout(() => setManualCheckStatus(null), 3000);
    } else {
      setManualCheckStatus('latest');
      setTimeout(() => setManualCheckStatus(null), 3000);
    }
  };

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
      return '全教科オススメ10問をスタート！ 🐾';
    }
    const subjectNames: Record<Subject, { label: string; icon: string }> = {
      rika: { label: '理科', icon: '🧪' },
      sansu: { label: '算数', icon: '📐' },
      shakai: { label: '社会', icon: '🗾' },
      kokugo: { label: '国語', icon: '📖' },
    };
    // ALL_STUDY_SUBJECTSの順序でソートして見やすく並べる
    const sortedSelected = ALL_STUDY_SUBJECTS.filter(s => selectedStudySubjects.includes(s));
    const labels = sortedSelected.map(s => subjectNames[s]?.label || s).join('・');
    const icons = sortedSelected.map(s => subjectNames[s]?.icon || '').join('');
    return `${labels} 10問をスタート！ ${icons || '🐾'}`;
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

  // 科目別フィルター（小学生向け科目タブ：すべて・理科・算数・社会）
  const filteredSkills = enrichedSkills.filter(skill => {
    if (selectedSkillSubject === 'all') return true;
    return skill.subject === selectedSkillSubject;
  });

  const masteredCount = filteredSkills.filter(s => s.isMastered).length;
  const remainingCount = filteredSkills.length - masteredCount;

  // 各教科のスキル数カウント
  const rikaCount = enrichedSkills.filter(s => s.subject === 'rika').length;
  const sansuCount = enrichedSkills.filter(s => s.subject === 'sansu').length;
  const shakaiCount = enrichedSkills.filter(s => s.subject === 'shakai').length;
  const kokugoCount = enrichedSkills.filter(s => s.subject === 'kokugo').length;

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
            title="合格カルテ完成度: 全56テーマの「記憶メーター（定着度）」の平均値です。クリックで100%にするための方法をチェック！"
            data-testid="completion-progress-group"
            role="button"
            tabIndex={0}
            aria-label={`合格カルテ完成度 ${completionPercent}%。クリックで100%にする方法を表示`}
          >
            <div className={styles.progressLabel}>
              <span className={styles.progressLabelTitle}>
                合格カルテ完成度 <span style={{ fontSize: '11px' }}>❓</span>
              </span>
              <strong data-testid="completion-percent">{completionPercent}%</strong>
            </div>
            <div className={styles.progressBarBg} aria-label="攻略度進捗バー">
              <div className={styles.progressBarFill} style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          {/* 右上操作コントロール群 */}
          <div className={styles.headerControls}>
            {/* 保護者カルテボタン */}
            <button
              className={styles.parentBadgeBtn}
              onClick={() => {
                sound.playPop();
                setShowParentModal(true);
              }}
              title="保護者カルテ（学習進度グラフ・ほめ言葉ヒント・A4弱点印刷）"
              aria-label="保護者カルテ"
              data-testid="header-parent-btn"
            >
              <span style={{ fontSize: '15px' }}>👨‍👩‍👧</span>
              <span>保護者カルテ</span>
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
              aria-label="設定と教材の読み込み"
              data-testid="header-menu-btn"
            >
              ⋯
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
            <strong>ナース猫のミケちゃん:</strong>「おかえりなさい、先生！今日は【{nextStamp.name}】が元気をなくして待っているよ。10問カルテをといて、とびっきりの笑顔にしてあげよう！」
          </div>
        </section>

        {/* ゾーン1: 上段2カラム（今日のカルテ学習 と 番外クエスト参考書道場） */}
        <div className={styles.topCardsGrid}>
          {/* 左カラム: 今日のカルテ学習 */}
          <section className={styles.todayCard} data-testid="today-study-card">
            <div className={styles.todayCardContent} data-testid="card-breakdown">
              <div className={styles.badgeRow}>
                <span className={styles.badgeToday}>🩺 今日のカルテ学習</span>
                <span style={{ color: 'var(--border)', margin: '0 2px' }}>|</span>
                <span className={styles.estimatedTime}>⏱️ 目安: 約5分</span>
              </div>
              <h2 className={styles.todayHeading} style={{ margin: '2px 0', fontSize: '20px' }}>
                今日のオススメ 10問をといて、動物を元気にしよう！
              </h2>
              <p className={styles.todaySubText} style={{ margin: 0, fontSize: '13px' }}>
                理科・算数・社会・国語の4教科すべてに対応！毎日少しずつ解くのが記憶のコツだよ。
              </p>

              {/* 出題教科セグメントコントロール（複数選択対応・トグルUI） */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)' }}>
                    出題教科（タップで複数選べるよ！）:
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
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

              {/* 今日の10問内訳 */}
              <div className={styles.todayMenuRow}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)', marginRight: '4px' }}>
                  📋 内訳:
                </span>
                <span className={styles.todayMenuPill}>🔄 復習 3</span>
                <span className={styles.todayMenuPill}>✏️ やり直し 2</span>
                <span className={styles.todayMenuPill}>🌱 新知識 2</span>
                <span className={styles.todayMenuPill}>⭐ 応用 3</span>
              </div>
            </div>

            <div className={styles.todayActions}>
              <button
                className={styles.startBtn}
                onClick={handleStartToday}
                data-testid="start-study-btn"
              >
                {getStartButtonLabel()}
              </button>
            </div>
          </section>

          {/* 右カラム: 番外クエスト（名作参考書マスター） */}
          <section className={styles.extraStudyCard} data-testid="section-extra-study">
            <div className={styles.extraHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={styles.extraBadgeQuest}>🎒 番外クエスト</span>
                <span style={{ color: 'var(--border)', margin: '0 2px' }}>|</span>
                <span className={styles.extraSubjectBadge}>出題教科：🗾 社会</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                人気参考書マスター ⚡
              </span>
            </div>

            <div>
              <h2 className={styles.extraHeading}>
                📕 中学入試 即答キーワードで覚える歴史人物80
              </h2>
              <p className={styles.extraSubText} style={{ marginTop: '4px' }}>
                入試頻出の重要人物80人を完全網羅！即答キーワード＆名門中入試問題でサクサクスピード攻略しよう！
              </p>
            </div>

            {/* 学習進捗・達成度 */}
            {(() => {
              const histProg = getRefBookProgress('history-80');
              const book = REFERENCE_BOOKS[0];
              return (
                <div className={styles.extraProgressRow} data-testid="extra-history-progress">
                  <span className={styles.extraProgressLabel}>
                    🏆 マスター状況:
                  </span>
                  <span className={styles.extraProgressValue}>
                    {histProg.masteredIds.length} / {book.availableQuestionsCount} 人 達成
                  </span>
                  {histProg.clearedSessionsCount > 0 && (
                    <span style={{ color: '#059669', fontWeight: 'bold', marginLeft: 'auto' }}>
                      （クリア {histProg.clearedSessionsCount} 回）
                    </span>
                  )}
                </div>
              );
            })()}

            <div className={styles.extraActions}>
              <button
                className={styles.extraStartBtn}
                onClick={() => {
                  sound.playPop();
                  setActiveRefBookId('history-80');
                }}
                data-testid="start-extra-book-btn"
              >
                ⚡ 歴史人物80 特訓スタート！（10問） ❯
              </button>
              <div className={styles.extraUpcomingHint}>
                📚 理科・算数の名作参考書クエストも今後続々追加予定！
              </div>
            </div>
          </section>
        </div>

        {/* ゾーン2: 元気にした動物スタンプ帳（ドットノイズ解消・高コントラスト） */}
        <section className={styles.stampSection}>
          <div className={styles.stampLeft}>
            <div>
              <div className={styles.stampHeaderTitle}>
                🐾 元気にした動物スタンプ帳（毎日: {earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹 ＋ カルテ全快: {allMasteredSkills.length} / {enrichedSkills.length} 匹）
              </div>
              <div className={styles.stampNextHint}>
                👉 今日の10問で【{nextStamp.icon} {nextStamp.name}】、カルテ特訓（Lv.4マスター）で【患者動物たち】が全快スタンプになるよ！
              </div>
            </div>

            {/* スロット切り替えミニトグル */}
            <div className={styles.stampPreviewToggleRow} role="tablist" aria-label="スタンプスロット切り替え">
              <button
                type="button"
                className={`${styles.stampPreviewTabBtn} ${stampPreviewType === 'daily' ? styles.stampPreviewTabBtnActive : ''}`}
                onClick={() => setStampPreviewType('daily')}
                data-testid="preview-tab-daily"
              >
                📅 毎日の学習（{earnedStampIds.length} / {ANIMAL_STAMPS.length}）
              </button>
              <button
                type="button"
                className={`${styles.stampPreviewTabBtn} ${stampPreviewType === 'chart' ? styles.stampPreviewTabBtnActive : ''}`}
                onClick={() => setStampPreviewType('chart')}
                data-testid="preview-tab-chart"
              >
                🩺 カルテ全快（{allMasteredSkills.length} / {enrichedSkills.length}）
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
              </div>
            ) : (
              <div className={styles.stampIconRow}>
                {enrichedSkills.slice(0, 16).map(skill => {
                  const isEarned = skill.isMastered;
                  const details = getSkillStampDetails(skill);
                  return (
                    <div
                      key={skill.id}
                      className={`${styles.stampSlot} ${isEarned ? styles.stampSlotActive : ''}`}
                      style={{
                        borderColor: isEarned ? '#10b981' : 'var(--border)',
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
                      title={isEarned ? `${details.name}: 全快！クリックで豆知識` : `${details.name}（${skill.title}）: カルテ特訓で全快させよう！`}
                      data-testid={`preview-chart-stamp-${skill.id}`}
                    >
                      {isEarned ? details.icon : '🔒'}
                    </div>
                  );
                })}
                {enrichedSkills.length > 16 && (
                  <button
                    type="button"
                    className={styles.stampSlot}
                    style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', border: '1.5px solid var(--primary)', cursor: 'pointer' }}
                    onClick={() => {
                      setStampModalTab('chart');
                      sound.playPop();
                      setShowStampModal(true);
                    }}
                    title="スタンプ帳ですべての全快動物を見る"
                  >
                    +{enrichedSkills.length - 16}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            className={styles.stampBookBtn}
            onClick={() => {
              sound.playPop();
              setShowStampModal(true);
            }}
            data-testid="open-stamp-book-btn"
          >
            📖 スタンプ帳をひらく
          </button>
        </section>

        {/* スマホ専用下段ビュー切り替えタブ（スクロール不要で認定試験に瞬時に移動可能） */}
        <div className={styles.mobileTabSwitcher} role="tablist" aria-label="カルテ進度と認定試験の切り替え">
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${mobileBottomTab === 'progress' ? styles.mobileTabBtnActive : ''}`}
            onClick={() => {
              sound.playPop();
              setMobileBottomTab('progress');
            }}
            data-testid="mobile-tab-progress"
          >
            🩺 カルテ進度 ({filteredSkills.length})
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

        {/* ゾーン3: 下段2カラム（全テーマのカルテ進度 と 獣医師認定試験） */}
        <div className={styles.bottomCardsGrid}>
          {/* 左カラム: 🩺 受験カルテ進度（全テーマ） */}
          <div
            className={`${styles.card} ${mobileBottomTab !== 'progress' ? styles.cardHiddenOnMobile : ''}`}
            data-testid="card-weakness"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                🩺 受験カルテ進度（全{ALL_PROGRESS_SKILLS.length}テーマ）
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className={styles.quickExamJumpBtn}
                  onClick={() => {
                    sound.playPop();
                    setMobileBottomTab('exam');
                    const examEl = document.querySelector('[data-testid="card-final-challenge"]');
                    if (examEl && typeof examEl.scrollIntoView === 'function') {
                      examEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  data-testid="quick-jump-exam-btn"
                  title="合格ドクター認定試験へ瞬時にジャンプ"
                >
                  🏆 認定試験へ ❯
                </button>
                <button
                  className={styles.helpLinkBtn}
                  onClick={() => {
                    sound.playPop();
                    setShowLevelHelpModal(true);
                  }}
                  title="Lvについて知る"
                >
                  ❓ Lvってなに？
                </button>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: '2px 0 4px 0' }}>
              マスター達成（⭐Lv.4以上）：<strong style={{ color: 'var(--primary)' }}>{masteredCount} / {filteredSkills.length} テーマ</strong>
            </div>

            {/* 合格のカギ（Lv.4マスター）の進度と集め方の説明（カルテ領域に配置） */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 12px', margin: '8px 0 10px 0' }} data-testid="key-progress-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px', color: '#92400e' }}>
                  🔑 合格のカギ: {masteredCount} / {filteredSkills.length} 個
                </strong>
                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>
                  {selectedSkillSubject === 'all' ? '全教科' : selectedSkillSubject === 'rika' ? '理科' : selectedSkillSubject === 'sansu' ? '算数' : '社会'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px', lineHeight: '1.5' }}>
                【集め方】下のカルテでテーマを学習し、<strong>【⭐Lv.4 マスター】</strong>にすると手に入ります。
              </div>
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>
                  🐾 カギ全達成特典: 全動物からの感謝メッセージ
                </span>
                {masteredCount >= filteredSkills.length && filteredSkills.length > 0 ? (
                  <button
                    onClick={() => {
                      sound.playChime();
                      setShowAllAnimalsModal(true);
                    }}
                    style={{
                      background: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                    data-testid="all-animals-message-btn"
                  >
                    🎉 メッセージを見る！
                  </button>
                ) : (
                  <span style={{ fontSize: '10px', color: '#b45309', background: '#fef9c3', padding: '2px 6px', borderRadius: '8px' }}>
                    🔒 あと {remainingCount} 個
                  </span>
                )}
              </div>
            </div>

            {/* 小学生向け科目別フィルター */}
            <div className={styles.categoryFilterRow} data-testid="skill-subject-filter-row">
              {[
                { id: 'all', label: `🌟 すべて (${ALL_PROGRESS_SKILLS.length})` },
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
                  <span>✏️ レベルアップをめざすテーマ（あと {remainingCount} つ）</span>
                  <span style={{ fontSize: '12px' }}>{showUnmasteredSkills ? '▲ とじる' : '▼ ひらく（特訓する）'}</span>
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
                        <span className={styles.patientIcon}>{patientIcon}</span>
                        <div>
                          <div className={styles.skillTitle}>{skill.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                            患者: <strong>{patientName}</strong>（{skill.subjectLabel}）
                          </div>
                        </div>
                      </div>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>

                    <div className={styles.skillHint}>
                      👉 {skill.nextGoalHint}
                    </div>

                    <div className={styles.skillMetaRow}>
                      <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                        <span>記憶メーター:</span>
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
                          title="この単元の問題を集中的に解いてレベルアップ！"
                          data-testid={`focus-study-btn-${skill.id}`}
                        >
                          <span>🎯 この単元を特訓してLvアップ！</span>
                          <span className={styles.btnArrow}>❯</span>
                        </button>

                        <button
                          className={styles.quickFlashBtnSecondary}
                          onClick={() => {
                            sound.playPop();
                            setFlashCardSkillId(skill.id);
                          }}
                          title="重要ポイントをサクッと復習して記憶メーターをアップ！"
                          data-testid={`quick-flash-btn-${skill.id}`}
                        >
                          <span>📇 暗記カード</span>
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
                  <span>✅ 全快マスター達成テーマ（{masteredCount} つ）</span>
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
                        <span className={styles.patientIcon}>{patientIcon}</span>
                        <div>
                          <div className={styles.skillTitle}>{skill.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--success-text)' }}>
                            患者: <strong>{patientName}（全快！）</strong>（{skill.subjectLabel}）
                          </div>
                        </div>
                      </div>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>

                    <div className={styles.skillHintMastered}>
                      🎉 {skill.nextGoalHint}
                    </div>

                    <div className={styles.skillMetaRow}>
                      <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                        <span>記憶メーター:</span>
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
                          title="この単元の問題を復習して全快をキープ！"
                          data-testid={`focus-study-btn-mastered-${skill.id}`}
                        >
                          <span>🎯 この単元を復習</span>
                          <span className={styles.btnArrow}>❯</span>
                        </button>

                        <button
                          className={styles.quickFlashBtnSecondary}
                          onClick={() => {
                            sound.playPop();
                            setFlashCardSkillId(skill.id);
                          }}
                          title="重要ポイントをサクッと復習して記憶メーターをアップ！"
                          data-testid={`quick-flash-btn-mastered-${skill.id}`}
                        >
                          <span>📇 暗記カード</span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                🏆 合格ドクター認定試験
              </h3>
              <span style={{ fontSize: '12px', background: 'var(--primary-weak)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                理科・算数・社会
              </span>
            </div>

            <div className={styles.challengeStatus}>
              {/* 試験内容の説明 */}
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '12px' }}>
                実際の入試問題に挑む総合テストです。各教科いつでも力試しに挑戦できます！
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-subtle)' }}>
                  <li><strong>Stage 1（過去問本番）</strong>: 実際の入試問題（過去問原本）を見ながら受験</li>
                  <li><strong>Stage 2（同等未見問題）</strong>: Skill構成と難易度が同等の新しい未見問題で実力判定</li>
                </ul>
              </div>

              {/* クリア報酬カード */}
              <div className={styles.rewardCard} data-testid="challenge-reward-card">
                <div className={styles.rewardTitle}>
                  <span>🎖️ 認定試験クリアの豪華報酬！</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '8px' }}>
                  本番テストを突破して、実力の証（ライセンス＆バッジ）を獲得しよう：
                </div>
                <ul className={styles.rewardList}>
                  <li style={{ marginBottom: '8px' }}>
                    👑 <strong>Stage 1（過去問本番）クリア</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      → <strong>「合格ドクター認定証（ライセンス）」</strong>授与＆画像保存！
                    </div>
                  </li>
                  <li>
                    ⭐ <strong>Stage 1 & 2（同等未見問題）両方クリア</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      → <strong>「金のマスター獣医師バッジ」</strong>をアンロック！
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className={styles.challengeBtn}
                onClick={() => {
                  sound.playPop();
                  navigate('/final-challenge');
                }}
                data-testid="final-challenge-link-btn"
              >
                合格ドクター認定試験を受ける 🏆
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  setShowHistoryModal(true);
                }}
                style={{
                  background: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                data-testid="open-exam-history-btn"
              >
                📋 過去の採点カルテ・成績表を見る
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* フッター: バージョン表記と設定へのリンク */}
      <footer style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: '12px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }} data-testid="home-footer-version">
        <span>みならい獣医さんの中学受験カルテ v{APP_VERSION} ({BUILD_TIMESTAMP})</span>

        {/* 手動バージョン更新チェックボタン */}
        <button
          onClick={handleManualUpdateCheck}
          disabled={manualCheckStatus === 'checking'}
          style={{
            background: manualCheckStatus === 'update-available' ? '#fdf4ff' : 'var(--surface-subtle)',
            border: manualCheckStatus === 'update-available' ? '1.5px solid #d946ef' : '1px solid var(--border)',
            borderRadius: '999px',
            padding: '3px 10px',
            color: manualCheckStatus === 'update-available' ? '#86198f' : 'var(--primary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '800',
            transition: 'all 0.2s ease',
          }}
          title="最新バージョンがないかサーバーを確認します"
          data-testid="manual-update-check-btn"
        >
          {manualCheckStatus === 'checking'
            ? '🔄 確認中...'
            : manualCheckStatus === 'update-available'
            ? '🚀 新バージョンあり！'
            : manualCheckStatus === 'latest'
            ? '✅ 最新版です'
            : manualCheckStatus === 'offline'
            ? '⚠️ オフライン'
            : '🔄 更新をチェック'}
        </button>

        <button
          onClick={() => {
            sound.playPop();
            setShowParentModal(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#c2410c',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          data-testid="footer-parent-btn"
        >
          👨‍👩‍👧 保護者カルテ
        </button>
        <button
          onClick={() => {
            sound.playPop();
            navigate('/settings');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ⚙️ 設定・キャッシュ更新
        </button>
      </footer>

      {/* 動物スタンプ帳モーダル */}
      {showStampModal && (
        <div className={styles.modalOverlay} onClick={() => setShowStampModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>📖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text)' }}>
                    🐾 みならい獣医さんの動物シール帳
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                    集めた動物たちをクリックすると、メッセージや豆知識が飛び出すよ！
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

            {/* スタンプ帳モーダル内タブ切り替え */}
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
                📅 毎日の学習スタンプ（{earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹）
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
                🩺 カルテ全快ドクタースタンプ（{allMasteredSkills.length} / {enrichedSkills.length} 匹）
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
                                💡 カルテ特訓で【⭐Lv.4 マスター】を達成すると全快スタンプが手に入るよ！
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
                                🎯 この単元を特訓して全快にする ❯
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                  data-testid="action-item-focus"
                >
                  <span style={{ fontSize: '26px' }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                      ① 単元の「特訓問題」を解いて正解する（大幅UP！）
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      カルテの「🎯 この単元を特訓してLvアップ！」で正解すると、記憶メーターが一気に80%〜100%（全快）へ上がります。
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                  data-testid="action-item-flashcard"
                >
                  <span style={{ fontSize: '26px' }}>📇</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                      ② 「暗記カード」をサクッとめくって復習する（急速チャージ！）
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      時間がないときは「📇 暗記カード」で急所ポイントを思い出すだけで、記憶メーターが即座に回復します。
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                  data-testid="action-item-daily"
                >
                  <span style={{ fontSize: '26px' }}>🐾</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                      ③ 「今日のオススメ10問」を毎日解く（100%キープ！）
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '2px' }}>
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
                  🎯 カルテ進度で記憶メーターを100%にする ❯
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { stage: 'M1', lv: 'Lv.1', name: '🌱 みならい助手', desc: '選択肢を見れば正解を選べるレベル！まずはここからスタート。' },
                { stage: 'M2', lv: 'Lv.2', name: '🌿 てごたえあり', desc: '選択肢を見る前に、頭の中で「答えはこれだ！」と思い出せるレベル！' },
                { stage: 'M3', lv: 'Lv.3', name: '🍀 なっとく理由', desc: '「なぜそうなるのか」の理由や、解く手順までしっかり説明できるレベル！' },
                { stage: 'M4', lv: 'Lv.4', name: '⭐ カルテマスター', desc: '数字や問題の場面が変わった【初めて見る応用問題】でも自力で解けるレベル！' },
                { stage: 'M5', lv: 'Lv.5', name: '👑 かんぺき定着', desc: '1日後や3日後に復習しても忘れていない、本物の実力がついた証拠！' },
                { stage: 'M6', lv: 'Lv.6', name: '🏆 合格ドクター', desc: '本番形式のテストで満点を達成！未来の獣医さんへの第一歩です！' },
              ].map(item => (
                <div
                  key={item.stage}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary)' }}>{item.lv}</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', lineHeight: '1.5' }}>{item.desc}</div>
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
                    全テーマの合格のカギ（⭐Lv.4マスター）達成おめでとう！
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

      {/* 番外クエスト・名作参考書特訓モーダル */}
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
