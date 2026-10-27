import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ANIMAL_STAMPS, getEarnedStampIds } from '../data/animal-stamps';
import { getMasteryLevelInfo } from '../utils/mastery-helper';
import { ALL_PROGRESS_SKILLS, type ComprehensiveSkillProgressItem } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { QuickFlashCardModal } from '../components/QuickFlashCardModal';
import { FinalExamHistoryModal } from '../components/FinalExamHistoryModal';
import { ParentDashboardModal } from '../components/ParentDashboardModal';
import { getMemoryRetention } from '../utils/memory-retention';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import { APP_VERSION, BUILD_TIMESTAMP } from '../version';
import styles from './HomePage.module.css';

type ThemeType = 'default' | 'sakura' | 'mint' | 'lavender' | 'night';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startDailySession } = useAppStore();
  const [earnedStampIds, setEarnedStampIds] = useState<string[]>([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [openedStampId, setOpenedStampId] = useState<string | null>(null);
  const [showLevelHelpModal, setShowLevelHelpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showAllAnimalsModal, setShowAllAnimalsModal] = useState(false);
  const [flashCardSkillId, setFlashCardSkillId] = useState<string | null>(null);

  // テーマ・サウンド状態
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSkillSubject, setSelectedSkillSubject] = useState<'all' | 'rika' | 'sansu' | 'shakai'>('all');
  const [selectedStudySubject, setSelectedStudySubject] = useState<'all' | 'rika' | 'sansu' | 'shakai'>('all');
  const [, setRetentionTick] = useState(0);

  useEffect(() => {
    const handleRetentionUpdate = () => setRetentionTick(t => t + 1);
    window.addEventListener('memory-retention-updated', handleRetentionUpdate);
    return () => window.removeEventListener('memory-retention-updated', handleRetentionUpdate);
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

  const handleStartToday = () => {
    sound.playChime();
    startDailySession(selectedStudySubject === 'all' ? undefined : selectedStudySubject);
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

  // 科目別フィルター（小学生向け科目タブ：すべて・理科・算数・社会）
  const filteredSkills = ALL_PROGRESS_SKILLS.filter(skill => {
    if (selectedSkillSubject === 'all') return true;
    return skill.subject === selectedSkillSubject;
  });

  const masteredCount = filteredSkills.filter(s => s.isMastered).length;
  const remainingCount = filteredSkills.length - masteredCount;

  // 各教科のスキル数カウント
  const rikaCount = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'rika').length;
  const sansuCount = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'sansu').length;
  const shakaiCount = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'shakai').length;

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
          <div className={styles.subTitle}>🐾 めざせ！未来のどうぶつのお医者さん</div>
          <h1 className={styles.mainTitle}>みならい獣医さんの中学受験カルテ</h1>
        </div>

        <div className={styles.headerRight}>
          {/* 連続学習ストリーク（ゲーミフィケーション） */}
          <div className={styles.streakBadge} title="連続学習日数">
            <span>🔥</span>
            <span>3日れんぞく！</span>
          </div>

          <div className={styles.progressLabel}>
            <span>合格カルテ完成度</span>
            <strong>35%</strong>
          </div>
          <div className={styles.progressBarBg} aria-label="攻略度進捗バー">
            <div className={styles.progressBarFill} style={{ width: '35%' }} />
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

        {/* ゾーン1: 今日の学習カード（Bento Grid Hero） */}
        <section className={styles.todayCard} data-testid="today-study-card">
          <div className={styles.todayCardContent} data-testid="card-breakdown">
            <div className={styles.badgeRow}>
              <span className={styles.badgeToday}>🩺 今日のカルテ学習</span>
              <span className={styles.estimatedTime}>⏱️ 目安: たった5分</span>
            </div>
            <h2 className={styles.todayHeading} style={{ margin: '2px 0' }}>
              今日のオススメ 10問をといて、動物を元気にしよう！
            </h2>
            <p className={styles.todaySubText} style={{ margin: 0 }}>
              理科・算数・社会の3教科すべてに対応！忘れないように毎日少しずつ解くのが記憶のコツだよ。
            </p>

            {/* 科目選択タブ */}
            <div className={styles.categoryFilterRow} style={{ marginTop: '10px', marginBottom: '8px' }}>
              {[
                { id: 'all', label: '🌟 全教科ミックス' },
                { id: 'rika', label: '🧪 理科' },
                { id: 'sansu', label: '📐 算数' },
                { id: 'shakai', label: '🗾 社会' },
              ].map(sub => (
                <button
                  key={sub.id}
                  className={`${styles.categoryFilterBtn} ${selectedStudySubject === sub.id ? styles.categoryFilterBtnActive : ''}`}
                  onClick={() => {
                    sound.playPop();
                    setSelectedStudySubject(sub.id as any);
                  }}
                  type="button"
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* 今日の10問内訳メニュー（わかりやすいタグ） */}
            <div className={styles.todayMenuRow}>
              <span className={styles.todayMenuPill}>🔄 復習：3問</span>
              <span className={styles.todayMenuPill}>✏️ やり直し：2問</span>
              <span className={styles.todayMenuPill}>🌱 新知識：2問</span>
              <span className={styles.todayMenuPill}>⭐ 応用問題：3問</span>
            </div>
          </div>

          <div className={styles.todayActions}>
            <button
              className={styles.startBtn}
              onClick={handleStartToday}
              data-testid="start-study-btn"
            >
              {selectedStudySubject === 'all'
                ? '全教科オススメ10問をスタート！ 🐾'
                : selectedStudySubject === 'rika'
                ? '理科 10問をスタート！ 🧪'
                : selectedStudySubject === 'sansu'
                ? '算数 10問をスタート！ 📐'
                : '社会 10問をスタート！ 🗾'}
            </button>
          </div>
        </section>

        {/* ゾーン2: 元気にした動物スタンプ帳（ドットノイズ解消・高コントラスト） */}
        <section className={styles.stampSection}>
          <div className={styles.stampLeft}>
            <div>
              <div className={styles.stampHeaderTitle}>
                🐾 元気にした動物スタンプ帳（{earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹）
              </div>
              <div className={styles.stampNextHint}>
                👉 今日の10問をとくと、次は【{nextStamp.icon} {nextStamp.name}】が元気になるよ！
              </div>
            </div>
            <div className={styles.stampIconRow}>
              {ANIMAL_STAMPS.map(stamp => {
                const isEarned = earnedStampIds.includes(stamp.id);
                return (
                  <div
                    key={stamp.id}
                    className={`${styles.stampSlot} ${isEarned ? styles.stampSlotActive : ''}`}
                    onClick={() => handleStampClick(isEarned)}
                    title={isEarned ? `${stamp.name}: 元気回復！クリックでプチ知識` : `${stamp.name}: 治療を待っているよ`}
                  >
                    {isEarned ? stamp.icon : '❓'}
                  </div>
                );
              })}
            </div>
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

        {/* ゾーン3: 下段2カラム（全37テーマのカルテ進度 と 獣医師認定試験） */}
        <div className={styles.bottomCardsGrid}>
          {/* 左カラム: 🩺 受験カルテ進度（全37テーマ） */}
          <div className={styles.card} data-testid="card-weakness">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                🩺 受験カルテ進度（全37テーマ）
              </h3>
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
              {/* 未達成テーマ */}
              {filteredSkills.filter(s => !s.isMastered).length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--warning-text)', marginTop: '4px' }}>
                  ✏️ レベルアップをめざすテーマ（あと {remainingCount} つ）
                </div>
              )}
              {filteredSkills.filter(s => !s.isMastered).map(skill => {
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

                      <button
                        className={styles.quickFlashBtn}
                        onClick={() => {
                          sound.playPop();
                          setFlashCardSkillId(skill.id);
                        }}
                        title="30秒で重要ポイントを復習して記憶メーターをアップ！"
                        data-testid={`quick-flash-btn-${skill.id}`}
                      >
                        <span>📇 30秒暗記カード</span>
                        <span className={styles.btnArrow}>❯</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 達成済みテーマ */}
              {filteredSkills.filter(s => s.isMastered).length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--success-text)', marginTop: '12px' }}>
                  ✅ マスター達成済みのテーマ（{masteredCount} つ）
                </div>
              )}
              {filteredSkills.filter(s => s.isMastered).map(skill => {
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

                      <button
                        className={styles.quickFlashBtn}
                        onClick={() => {
                          sound.playPop();
                          setFlashCardSkillId(skill.id);
                        }}
                        title="30秒で重要ポイントを復習して記憶メーターをアップ！"
                        data-testid={`quick-flash-btn-mastered-${skill.id}`}
                      >
                        <span>📇 30秒暗記カード</span>
                        <span className={styles.btnArrow}>❯</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 🏆 合格ドクター認定試験 */}
          <div className={styles.card} data-testid="card-final-challenge">
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
      <footer style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: '12px', color: 'var(--text-subtle)' }} data-testid="home-footer-version">
        <span>みならい獣医さんの中学受験カルテ v{APP_VERSION} ({BUILD_TIMESTAMP})</span>
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
            marginLeft: '8px',
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
            marginLeft: '8px',
            fontSize: '12px',
          }}
        >
          ⚙️ 設定・キャッシュ更新
        </button>
      </footer>

      {/* 30秒フラッシュ暗記カードモーダル */}
      {flashCardSkillId && (
        <QuickFlashCardModal
          initialSkillId={flashCardSkillId}
          onClose={() => setFlashCardSkillId(null)}
        />
      )}

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {ANIMAL_STAMPS.map(stamp => {
                const isEarned = earnedStampIds.includes(stamp.id);
                const isOpened = openedStampId === stamp.id;

                return (
                  <div
                    key={stamp.id}
                    onClick={() => {
                      if (isEarned) {
                        sound.playAnimalHappy();
                        fireConfetti({ count: 20 });
                        setOpenedStampId(prev => (prev === stamp.id ? null : stamp.id));
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
            setShowParentModal(false);
            setFlashCardSkillId(skillId);
          }}
        />
      )}
    </div>
  );
};
