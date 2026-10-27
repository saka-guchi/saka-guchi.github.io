import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ANIMAL_STAMPS, getEarnedStampIds } from '../data/animal-stamps';
import { getMasteryLevelInfo } from '../utils/mastery-helper';
import { RIKA_EXAM_SKILLS } from '../data/rika-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { DoctorCertificateModal } from '../components/DoctorCertificateModal';
import { QuickFlashCardModal } from '../components/QuickFlashCardModal';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import styles from './HomePage.module.css';

type ThemeType = 'default' | 'sakura' | 'mint' | 'night';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startDailySession, startSampleSession } = useAppStore();
  const [earnedStampIds, setEarnedStampIds] = useState<string[]>([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showLevelHelpModal, setShowLevelHelpModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [flashCardSkillId, setFlashCardSkillId] = useState<string | null>(null);

  // テーマ・サウンド状態
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setEarnedStampIds(getEarnedStampIds());
    setSoundEnabled(sound.isEnabled());
    
    // 保存済みテーマの復元
    const savedTheme = (localStorage.getItem('junior_vet_theme') as ThemeType) || 'default';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: ThemeType) => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  const cycleTheme = () => {
    sound.playPop();
    const order: ThemeType[] = ['default', 'sakura', 'mint', 'night'];
    const nextIndex = (order.indexOf(currentTheme) + 1) % order.length;
    const nextTheme = order[nextIndex];
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('junior_vet_theme', nextTheme);
  };

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const nextStamp = ANIMAL_STAMPS.find(s => !earnedStampIds.includes(s.id)) || ANIMAL_STAMPS[0];
  const masteredCount = RIKA_EXAM_SKILLS.filter(s => s.isMastered).length;
  const remainingCount = RIKA_EXAM_SKILLS.length - masteredCount;

  const handleStartToday = () => {
    sound.playChime();
    startDailySession();
    navigate('/study');
  };

  const handleStartSample = () => {
    sound.playPop();
    startSampleSession();
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

  // 分野別フィルター
  const filteredSkills = RIKA_EXAM_SKILLS.filter(skill => {
    if (selectedCategory === 'all') return true;
    const enhance = THEME_ENHANCEMENTS[skill.id];
    return enhance ? enhance.field === selectedCategory : true;
  });

  const themeIcons: Record<ThemeType, string> = {
    default: '🩺 デフォルト',
    sakura: '🌸 サクラ',
    mint: '🌿 ミント',
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
            {/* テーマ着せ替えボタン */}
            <button
              className={styles.controlBtn}
              onClick={cycleTheme}
              title={`カラーテーマ切り替え: 現在 ${themeIcons[currentTheme]}`}
              aria-label="テーマ切り替え"
            >
              {currentTheme === 'sakura' ? '🌸' : currentTheme === 'mint' ? '🌿' : currentTheme === 'night' ? '🌙' : '🎨'}
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
          <div className={styles.mentorSpeech}>
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
              忘れないように毎日少しずつ解くのが記憶のコツ！「もっとやりたい！」ときは何回でも遊べるよ。
            </p>

            {/* 今日の10問内訳メニュー（わかりやすいタグ） */}
            <div className={styles.todayMenuRow}>
              <span className={styles.todayMenuPill}>🔄 復習：3問</span>
              <span className={styles.todayMenuPill}>✏️ やり直し：2問</span>
              <span className={styles.todayMenuPill}>🌱 新知識：2問</span>
              <span className={styles.todayMenuPill}>⭐ 応用問題：3問</span>
            </div>

            <div>
              <button
                className={styles.textLinkBtn}
                onClick={handleStartSample}
              >
                📖 サンプル教材（全15問）を解く →
              </button>
            </div>
          </div>

          <div className={styles.todayActions}>
            <button
              className={styles.startBtn}
              onClick={handleStartToday}
              data-testid="start-study-btn"
            >
              オススメ10問をスタート！ 🐾
            </button>
          </div>
        </section>

        {/* ゾーン2: 元気にした動物スタンプ帳（日々の報酬・シール手帳） */}
        <section className={styles.stampSection}>
          <div className={styles.stampLeft}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text)' }}>
                🐾 元気にした動物スタンプ帳（{earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹）
              </div>
              <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px', fontWeight: '800' }}>
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

        {/* ゾーン3: 下段2カラム（全9テーマのカルテ進度 と 獣医師認定試験） */}
        <div className={styles.bottomCardsGrid}>
          {/* 左カラム: 🩺 全9テーマのカルテ進度（アコーディオン＆分野フィルターですっきり） */}
          <div className={styles.card} data-testid="card-weakness">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                🩺 全9テーマのカルテ進度
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
              マスター達成（⭐Lv.4以上）：<strong style={{ color: 'var(--primary)' }}>{masteredCount} / {RIKA_EXAM_SKILLS.length} テーマ</strong>（すべてLv.4にすると認定試験オープン！）
            </div>

            {/* 理科4分野フィルター */}
            <div className={styles.categoryFilterRow}>
              {[
                { id: 'all', label: 'すべて (9)' },
                { id: '生物', label: '🌿 生物 (3)' },
                { id: '物理', label: '⚡ 物理 (3)' },
                { id: '地学', label: '🌍 地学 (2)' },
                { id: '化学', label: '🧪 化学 (1)' },
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.categoryFilterBtn} ${selectedCategory === cat.id ? styles.categoryFilterBtnActive : ''}`}
                  onClick={() => {
                    sound.playPop();
                    setSelectedCategory(cat.id);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* テーマリスト（内部スクロールを撤廃し、スマートなカード表示） */}
            <div className={styles.allSkillsContainer}>
              {/* 未達成テーマ */}
              {filteredSkills.filter(s => !s.isMastered).length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#c2410c', marginTop: '4px' }}>
                  ✏️ レベルアップをめざすテーマ（あと {remainingCount} つ）
                </div>
              )}
              {filteredSkills.filter(s => !s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                const enhance = THEME_ENHANCEMENTS[skill.id];
                return (
                  <div key={skill.id} className={styles.skillRowMini}>
                    <div className={styles.skillRowTop}>
                      <div className={styles.skillTitleArea}>
                        <span className={styles.patientIcon}>{enhance?.patientAnimal.icon || '🐾'}</span>
                        <div>
                          <div className={styles.skillTitle}>{skill.title}</div>
                          {enhance && (
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                              患者: <strong>{enhance.patientAnimal.name}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>
                      👉 {skill.nextGoalHint}
                    </div>

                    <div className={styles.skillMetaRow}>
                      {enhance && (
                        <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                          <span>記憶メーター:</span>
                          <div className={styles.memoryBar}>
                            <div
                              className={styles.memoryBarFill}
                              style={{
                                width: `${enhance.memoryRetention}%`,
                                background: enhance.memoryRetention > 70 ? '#10b981' : enhance.memoryRetention > 50 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <strong>{enhance.memoryRetention}%</strong>
                        </div>
                      )}

                      <button
                        className={styles.quickFlashBtn}
                        onClick={() => {
                          sound.playPop();
                          setFlashCardSkillId(skill.id);
                        }}
                        title="30秒で重要ポイントを復習する"
                      >
                        ⚡ 30秒暗記カード
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 達成済みテーマ */}
              {filteredSkills.filter(s => s.isMastered).length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', marginTop: '12px' }}>
                  ✅ マスター達成済みのテーマ（{masteredCount} つ）
                </div>
              )}
              {filteredSkills.filter(s => s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                const enhance = THEME_ENHANCEMENTS[skill.id];
                return (
                  <div key={skill.id} className={`${styles.skillRowMini} ${styles.skillRowMiniMastered}`}>
                    <div className={styles.skillRowTop}>
                      <div className={styles.skillTitleArea}>
                        <span className={styles.patientIcon}>{enhance?.patientAnimal.icon || '🐾'}</span>
                        <div>
                          <div className={styles.skillTitle}>{skill.title}</div>
                          {enhance && (
                            <div style={{ fontSize: '11px', color: '#166534' }}>
                              患者: <strong>{enhance.patientAnimal.name}（全快！）</strong>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>
                      🎉 {skill.nextGoalHint}
                    </div>

                    <div className={styles.skillMetaRow}>
                      {enhance && (
                        <div className={styles.memoryBarWrap} title="忘却曲線に基づく記憶定着ゲージ">
                          <span>記憶メーター:</span>
                          <div className={styles.memoryBar}>
                            <div
                              className={styles.memoryBarFill}
                              style={{ width: `${enhance.memoryRetention}%`, background: '#10b981' }}
                            />
                          </div>
                          <strong>{enhance.memoryRetention}%</strong>
                        </div>
                      )}

                      <button
                        className={styles.quickFlashBtn}
                        onClick={() => {
                          sound.playPop();
                          setFlashCardSkillId(skill.id);
                        }}
                      >
                        ⚡ 30秒暗記カード
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 🏆 合格ドクター認定試験（ホログラム調の報酬） */}
          <div className={styles.card} data-testid="card-final-challenge">
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>
              🏆 合格ドクター認定試験
            </h3>
            <div className={styles.challengeStatus} style={{ marginTop: '4px' }}>
              <span className={styles.lockBadge}>
                🔑 カギのかけら {masteredCount} / 9 集まったよ！（オープンまで：あと {remainingCount} テーマ）
              </span>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-subtle)' }}>
                左のカルテにある全9テーマを<strong>【⭐Lv.4 マスター】</strong>にすると、本番形式の認定試験（過去問）に挑戦できるよ！
              </p>

              {/* 過去問テストに挑む魅力的なクリア報酬（ホログラムシマー） */}
              <div className={styles.rewardCard}>
                <div className={styles.rewardTitle}>
                  <span>🎖️ 満点クリアの豪華報酬！</span>
                </div>
                <ul className={styles.rewardList}>
                  <li>👑 <strong>「合格ドクター認定証（ライセンス）」</strong>授与＆画像保存！</li>
                  <li>⭐ <strong>「金のマスター獣医師バッジ」</strong>をGET！</li>
                  <li>🐾 <strong>全動物たちからの特別感謝メッセージ</strong>をアンロック！</li>
                </ul>
              </div>
            </div>

            <button
              className={styles.challengeBtn}
              onClick={() => {
                sound.playPop();
                navigate('/final-challenge');
              }}
              data-testid="final-challenge-link-btn"
            >
              認定試験の案内・過去問を見る
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setShowCertificateModal(true);
              }}
              style={{
                marginTop: '4px',
                background: 'none',
                border: 'none',
                color: '#b45309',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: '800',
                alignSelf: 'center',
              }}
              data-testid="preview-cert-btn"
            >
              🎖️ 満点クリア認定証を見る（プレビュー）
            </button>
          </div>
        </div>
      </main>

      {/* 30秒フラッシュ暗記カードモーダル */}
      {flashCardSkillId && (
        <QuickFlashCardModal
          initialSkillId={flashCardSkillId}
          onClose={() => setFlashCardSkillId(null)}
        />
      )}

      {/* 合格ドクター認定証モーダル（満点報酬 / デバッグ確認） */}
      {showCertificateModal && (
        <DoctorCertificateModal onClose={() => setShowCertificateModal(false)} />
      )}

      {/* 動物スタンプ帳モーダル（シール手帳コレクション風） */}
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
                    集めた動物たちをクリックすると、鳴き声や豆知識が飛び出すよ！
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
                return (
                  <div
                    key={stamp.id}
                    onClick={() => {
                      if (isEarned) {
                        sound.playAnimalHappy();
                        fireConfetti({ count: 20 });
                      } else {
                        sound.playPop();
                      }
                    }}
                    style={{
                      border: isEarned ? '2px solid #93c5fd' : '1px dashed #cbd5e1',
                      background: isEarned ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : '#f8fafc',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      opacity: isEarned ? 1 : 0.65,
                      cursor: 'pointer',
                      boxShadow: isEarned ? '0 4px 12px rgba(37, 99, 235, 0.08)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '32px' }}>{isEarned ? stamp.icon : '🔒'}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text)' }}>
                          {stamp.name}
                        </div>
                        <div style={{ fontSize: '11px', color: isEarned ? '#2563eb' : '#94a3b8', fontWeight: '700' }}>
                          {isEarned ? `回復: ${stamp.patientTitle}` : '学習を続けて助けよう！'}
                        </div>
                      </div>
                    </div>
                    {isEarned && (
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '11px',
                          color: '#475569',
                          background: '#ffffff',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          lineHeight: '1.45',
                        }}
                      >
                        {stamp.vetFact}
                      </div>
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
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#2563eb' }}>{item.lv}</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
