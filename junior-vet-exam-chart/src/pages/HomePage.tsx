import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ANIMAL_STAMPS, getEarnedStampIds } from '../data/animal-stamps';
import { getMasteryLevelInfo } from '../utils/mastery-helper';
import { RIKA_EXAM_SKILLS } from '../data/rika-skills';
import { DoctorCertificateModal } from '../components/DoctorCertificateModal';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startDailySession, startSampleSession } = useAppStore();
  const [earnedStampIds, setEarnedStampIds] = useState<string[]>([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showLevelHelpModal, setShowLevelHelpModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    setEarnedStampIds(getEarnedStampIds());
  }, []);

  const nextStamp = ANIMAL_STAMPS.find(s => !earnedStampIds.includes(s.id)) || ANIMAL_STAMPS[0];
  const masteredCount = RIKA_EXAM_SKILLS.filter(s => s.isMastered).length;
  const remainingCount = RIKA_EXAM_SKILLS.length - masteredCount;

  const handleStartToday = () => {
    startDailySession();
    navigate('/study');
  };

  const handleStartSample = () => {
    startSampleSession();
    navigate('/study');
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
          <div className={styles.progressLabel}>
            <span>合格カルテ完成度</span>
            <strong>35%</strong>
          </div>
          <div className={styles.progressBarBg} aria-label="攻略度進捗バー">
            <div className={styles.progressBarFill} style={{ width: '35%' }} />
          </div>
          <button
            className={styles.menuBtn}
            onClick={() => navigate('/settings')}
            aria-label="設定と教材の読み込み"
            data-testid="header-menu-btn"
          >
            ⋯
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={styles.mainContent}>
        {/* ゾーン1: 今日の学習カード（メニュー＋スタートボタンを一体化） */}
        <section className={styles.todayCard} data-testid="today-study-card">
          <div className={styles.todayCardContent} data-testid="card-breakdown">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.badgeToday}>🩺 今日のカルテ学習</span>
            </div>
            <h2 className={styles.todayHeading} style={{ margin: '2px 0' }}>
              今日のオススメ 10問をといて、動物を元気にしよう！
            </h2>
            <p className={styles.todaySubText} style={{ margin: 0 }}>
              忘れないように毎日少しずつ解くのが記憶のコツ！「もっとやりたい！」ときは何回でも遊べるよ。
            </p>

            {/* 今日の10問内訳メニュー（ボタンのすぐ横に配置） */}
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
                style={{ fontSize: '13px' }}
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

        {/* ゾーン2: 元気にした動物スタンプ帳（日々の報酬） */}
        <section className={styles.stampSection}>
          <div className={styles.stampLeft}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text)' }}>
                🐾 元気にした動物スタンプ帳（{earnedStampIds.length} / {ANIMAL_STAMPS.length} 匹）
              </div>
              <div style={{ fontSize: '13px', color: '#059669', marginTop: '2px', fontWeight: 'bold' }}>
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
                    title={isEarned ? `${stamp.name}: 回復！` : `${stamp.name}: 待っているよ`}
                  >
                    {isEarned ? stamp.icon : '❓'}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            className={styles.stampBookBtn}
            onClick={() => setShowStampModal(true)}
            data-testid="open-stamp-book-btn"
          >
            📖 スタンプ帳をひらく
          </button>
        </section>

        {/* ゾーン3: 下段2カラム（全9テーマのカルテ進度 と 獣医師認定試験） */}
        <div className={styles.bottomCardsGrid}>
          {/* 左カラム: 🩺 全9テーマのカルテ進度（全テーマを一覧表示） */}
          <div className={styles.card} data-testid="card-weakness">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                🩺 全9テーマのカルテ進度
              </h3>
              <button
                className={styles.helpLinkBtn}
                onClick={() => setShowLevelHelpModal(true)}
                title="Lvについて知る"
              >
                ❓ Lvってなに？
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', margin: '4px 0 8px 0' }}>
              マスター達成（⭐Lv.4以上）：<strong>{masteredCount} / {RIKA_EXAM_SKILLS.length} テーマ</strong>（すべてLv.4にすると認定試験オープン！）
            </div>

            {/* 全9テーマを直接スクロール・一覧表示 */}
            <div className={styles.allSkillsContainer}>
              {/* 未達成テーマ（あと6つ） */}
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginTop: '2px' }}>
                ✏️ レベルアップをめざすテーマ（あと {remainingCount} つ）
              </div>
              {RIKA_EXAM_SKILLS.filter(s => !s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                return (
                  <div key={skill.id} className={styles.skillRowMini}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{skill.title}</span>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#0369a1' }}>
                      👉 {skill.nextGoalHint}
                    </div>
                  </div>
                );
              })}

              {/* 達成済みテーマ（3つ） */}
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginTop: '8px' }}>
                ✅ マスター達成済みのテーマ（{masteredCount} つ）
              </div>
              {RIKA_EXAM_SKILLS.filter(s => s.isMastered).map(skill => {
                const info = getMasteryLevelInfo(skill.stage);
                return (
                  <div key={skill.id} className={`${styles.skillRowMini} ${styles.skillRowMiniMastered}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{skill.title}</span>
                      <span
                        className={styles.levelBadge}
                        style={{ color: info.badgeColor, background: info.badgeBg }}
                      >
                        {info.shortLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#166534' }}>
                      🎉 {skill.nextGoalHint}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 🏆 合格ドクター認定試験（最終チャレンジ・過去問テスト） */}
          <div className={styles.card} data-testid="card-final-challenge">
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>
              🏆 合格ドクター認定試験
            </h3>
            <div className={styles.challengeStatus} style={{ marginTop: '6px' }}>
              <span className={styles.lockBadge}>
                🔒 まだ挑戦できません（オープンまで：あと {remainingCount} テーマ）
              </span>
              <p style={{ marginTop: '8px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-subtle)' }}>
                左のカルテにある全9テーマを<strong>【⭐Lv.4 マスター】</strong>にすると、本番形式の認定試験（過去問）に挑戦できるよ！
              </p>

              {/* 過去問テストに挑む魅力的なクリア報酬 */}
              <div className={styles.rewardCard}>
                <div className={styles.rewardTitle}>
                  <span>🎖️ 満点クリアの豪華報酬！</span>
                </div>
                <ul className={styles.rewardList}>
                  <li>👑 <strong>「合格ドクター認定証（ライセンス）」</strong>を授与！（お名前・日付入り）</li>
                  <li>⭐ <strong>「金のマスター獣医師バッジ」</strong>をGET！</li>
                  <li>🐾 <strong>全動物たちからの特別感謝メッセージ</strong>をアンロック！</li>
                </ul>
              </div>
            </div>

            <button
              className={styles.challengeBtn}
              onClick={() => navigate('/final-challenge')}
              data-testid="final-challenge-link-btn"
            >
              認定試験の案内・過去問を見る
            </button>
            <button
              onClick={() => setShowCertificateModal(true)}
              style={{
                marginTop: '8px',
                background: 'none',
                border: 'none',
                color: '#b45309',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 'bold',
                alignSelf: 'center',
              }}
              data-testid="preview-cert-btn"
            >
              🎖️ 満点クリア認定証を見る（プレビュー）
            </button>
          </div>
        </div>
      </main>

      {/* 合格ドクター認定証モーダル（満点報酬 / デバッグ確認） */}
      {showCertificateModal && (
        <DoctorCertificateModal onClose={() => setShowCertificateModal(false)} />
      )}

      {/* 動物スタンプ帳モーダル */}
      {showStampModal && (
        <div className={styles.modalOverlay} onClick={() => setShowStampModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                🐾 みならい獣医さんの動物スタンプ帳
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowStampModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: 0 }}>
              今日のオススメ10問をクリアするごとに、治療できた動物たちがスタンプ帳にあつまります！
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {ANIMAL_STAMPS.map(stamp => {
                const isEarned = earnedStampIds.includes(stamp.id);
                return (
                  <div
                    key={stamp.id}
                    style={{
                      border: isEarned ? '2px solid #93c5fd' : '1px dashed #cbd5e1',
                      background: isEarned ? '#eff6ff' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      opacity: isEarned ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '28px' }}>{isEarned ? stamp.icon : '🔒'}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{stamp.name}</div>
                        <div style={{ fontSize: '11px', color: isEarned ? '#2563eb' : '#94a3b8' }}>
                          {isEarned ? `回復: ${stamp.patientTitle}` : '学習を続けて助けよう！'}
                        </div>
                      </div>
                    </div>
                    {isEarned && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#475569', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
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
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                💡 知識のレベル（Lv）ってなに？
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowLevelHelpModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: 0 }}>
              過去問を丸暗記するのではなく、「どれくらいしっかり自分の頭に入っているか」を7段階のレベルで表しています。
            </p>
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
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>{item.lv}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text)' }}>{item.name}</span>
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

