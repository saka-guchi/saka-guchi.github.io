import React, { useState, useEffect } from 'react';
import { THEME_ENHANCEMENTS, ThemeEnhancement } from '../data/vet-curriculum-enhancement';
import { getMemoryRetention, boostMemoryRetention } from '../utils/memory-retention';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import styles from './QuickFlashCardModal.module.css';

interface QuickFlashCardModalProps {
  initialSkillId?: string;
  onClose: () => void;
  onRetentionUpdated?: () => void;
  onStartFocusSession?: (skillId: string) => void;
}

export const QuickFlashCardModal: React.FC<QuickFlashCardModalProps> = ({
  initialSkillId,
  onClose,
  onRetentionUpdated,
  onStartFocusSession,
}) => {
  const keys = Object.keys(THEME_ENHANCEMENTS);
  const initialIndex = initialSkillId ? Math.max(0, keys.indexOf(initialSkillId)) : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  const currentKey = keys[currentIndex];
  const item: ThemeEnhancement = THEME_ENHANCEMENTS[currentKey] || THEME_ENHANCEMENTS[keys[0]];

  // 記憶メーター値（ローカルストレージと同期）
  const [retention, setRetention] = useState<number>(() => getMemoryRetention(item.skillId));

  useEffect(() => {
    setRetention(getMemoryRetention(item.skillId));
    setBoostMessage(null);
  }, [item.skillId]);

  const handleFlip = () => {
    sound.playPop();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < keys.length - 1) {
      sound.playPop();
      setIsFlipped(false);
      setBoostMessage(null);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playPop();
      setIsFlipped(false);
      setBoostMessage(null);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 「🎉 思い出せた！（定着チェック）」ボタン押下時
  const handleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playChime();
    fireConfetti();

    // 記憶メーターを +20% 上昇して永続保存！
    const nextVal = boostMemoryRetention(item.skillId, 20);
    setRetention(nextVal);
    setBoostMessage(`🔥 記憶メーター +20% UP！（現在 ${nextVal}%）`);
    onRetentionUpdated?.();

    // 1秒後に次のカードへ進む
    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} data-testid="flashcard-modal">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text)' }}>
                サクッと暗記カード
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                カードをタップして裏返す（{currentIndex + 1} / {keys.length} テーマ）
              </div>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* 患者動物バー */}
        <div className={styles.patientBar}>
          <span style={{ fontSize: '22px' }}>{item.patientAnimal.icon}</span>
          <div>
            <strong>{item.patientAnimal.name}</strong>（{item.patientAnimal.role}）
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{item.patientAnimal.symptom}</div>
          </div>
        </div>

        {/* 3Dカード反転コンテナ */}
        <div className={styles.cardPerspective} onClick={handleFlip}>
          <div className={`${styles.cardInner} ${isFlipped ? styles.cardFlipped : ''}`}>
            {/* 表面（問題） */}
            <div className={`${styles.cardFace} ${styles.cardFront}`}>
              <div className={styles.tagRow}>
                <span
                  className={styles.fieldBadge}
                  style={{ color: item.fieldColor, background: item.fieldBg }}
                  data-testid="flashcard-subject-badge"
                >
                  {item.subjectLabel}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  記憶定着メーター: <strong data-testid="flashcard-retention-val">{retention}%</strong>
                </span>
              </div>

              <div style={{ padding: '16px 0' }}>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px' }}>
                  【問題】頭の中でパッと思い出せるかな？
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text)', lineHeight: '1.5' }}>
                  {item.flashCard.question}
                </div>
              </div>

              <div className={styles.flipHint}>
                👆 タップして【答えと獣医ポイント】を見る
              </div>
            </div>

            {/* 裏面（解答 & 暗記コツ） */}
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
              <div>
                <div style={{ fontSize: '13px', color: '#db2777', fontWeight: 'bold', marginBottom: '4px' }}>
                  ✨ ズバリ解答！
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text)', lineHeight: '1.5' }}>
                  {item.flashCard.answer}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.85)', padding: '10px 12px', borderRadius: '10px', textAlign: 'left', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                  💡 {item.flashCard.tip}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                  🎯 <strong>入試の急所:</strong> {item.flashCard.examPoint}
                </div>
              </div>

              {boostMessage && (
                <div
                  style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    animation: 'pulse 1s infinite',
                  }}
                  data-testid="boost-success-message"
                >
                  {boostMessage}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={handleMastered}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    data-testid="flashcard-remembered-btn"
                  >
                    🎉 思い出せた！（記憶メーターUP）
                  </button>

                  {onStartFocusSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playChime();
                        onStartFocusSession(item.skillId);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 3px 8px rgba(219, 39, 119, 0.35)',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                      data-testid="flashcard-start-focus-btn"
                    >
                      🎯 今すぐLvアップ問題に挑戦！ ❯
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 下部ナビゲーション */}
        <div className={styles.actionRow}>
          <button
            className={styles.navBtn}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← 前のテーマ
          </button>
          <button
            className={styles.navBtn}
            onClick={handleNext}
            disabled={currentIndex === keys.length - 1}
          >
            次のテーマ →
          </button>
        </div>
      </div>
    </div>
  );
};
