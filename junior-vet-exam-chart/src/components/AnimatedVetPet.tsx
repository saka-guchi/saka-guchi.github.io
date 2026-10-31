import React, { useState } from 'react';
import { sound } from '../utils/sound-effects';
import styles from './AnimatedVetPet.module.css';

interface AnimatedVetPetProps {
  size?: number;
  className?: string;
}

const CHEER_MESSAGES = [
  '今日もいっしょにがんばるにゃ！🐾',
  '合格めざして一歩ずつファイト！✨',
  'ナイス学習！動物たちも喜んでるにゃ🐱',
  '2027年サクラ咲くにゃ！🌸',
  'すごい集中力！かっこいいにゃ！🎯',
];

/**
 * ヘッダー用 動物（ナース猫のミケちゃん）SVGアニメーションコンポーネント
 * - ゆったりとした呼吸・お耳ピクピク・まばたき・おててふりふり・聴診器スイング
 * - クリック時にピョンと跳ねて可愛い応援メッセージとハートが出現
 */
export const AnimatedVetPet: React.FC<AnimatedVetPetProps> = ({
  size = 46,
  className = '',
}) => {
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    sound.playPop();
    const nextMsg = CHEER_MESSAGES[clickCount % CHEER_MESSAGES.length];
    setBubbleText(nextMsg);
    setShowHeart(true);
    setClickCount(prev => prev + 1);

    setTimeout(() => {
      setShowHeart(false);
    }, 1200);

    setTimeout(() => {
      setBubbleText(null);
    }, 2200);
  };

  return (
    <div
      className={`${styles.petContainer} ${className}`}
      onClick={handleClick}
      title="ナース猫のミケちゃん（クリックしてみてね！）🐾"
      aria-label="ナース猫のミケちゃん アニメーション"
      data-testid="header-vet-pet"
      style={{ width: size, height: size }}
    >
      <svg
        className={styles.petSvg}
        viewBox="0 0 54 54"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className={styles.bodyGroup}>
          {/* 左耳（三毛オレンジ） */}
          <g className={styles.leftEar}>
            <polygon
              points="14,24 8,8 24,16"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* 耳の内側（ピンク） */}
            <polygon points="14,21 10,11 21,16" fill="#FDBA74" opacity="0.9" />
          </g>

          {/* 右耳（焦げ茶ブチ） */}
          <g className={styles.rightEar}>
            <polygon
              points="40,24 46,8 30,16"
              fill="#78350F"
              stroke="#451A03"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* 耳の内側（ピンク） */}
            <polygon points="39,21 44,11 32,16" fill="#F472B6" opacity="0.8" />
          </g>

          {/* 頭・顔（ふっくら白ベース） */}
          <ellipse
            cx="27"
            cy="27"
            rx="18"
            ry="16"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* 三毛猫のブチ模様（額の左上オレンジ） */}
          <path
            d="M 12 18 C 12 14 18 13 22 17 C 22 21 16 23 12 18 Z"
            fill="#FB923C"
            opacity="0.95"
          />

          {/* ほっぺ（ふんわりピンクチーク） */}
          <circle cx="16" cy="30" r="3.5" fill="#FDA4AF" opacity="0.7" />
          <circle cx="38" cy="30" r="3.5" fill="#FDA4AF" opacity="0.7" />

          {/* まばたきするキラキラ目 */}
          <g className={styles.eyes}>
            {/* 左目 */}
            <ellipse cx="20" cy="25" rx="2.4" ry="2.8" fill="#1E293B" />
            <circle cx="21" cy="24" r="0.8" fill="#FFFFFF" />

            {/* 右目 */}
            <ellipse cx="34" cy="25" rx="2.4" ry="2.8" fill="#1E293B" />
            <circle cx="35" cy="24" r="0.8" fill="#FFFFFF" />
          </g>

          {/* 鼻（小さなピンク三角） */}
          <polygon points="27,28.5 25.5,27 28.5,27" fill="#F43F5E" />

          {/* ネコ口（ω） */}
          <path
            d="M 24.5 30 Q 25.7 32 27 30 Q 28.3 32 29.5 30"
            stroke="#475569"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />

          {/* 獣医さんのナースキャップ / 医療クロス */}
          <g transform="translate(23.5, 9)">
            <rect x="0" y="0" width="7" height="4" rx="1.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="0.8" />
            <path d="M 3.5 1 L 3.5 3 M 2 2 L 5 2" stroke="#EF4444" strokeWidth="0.9" strokeLinecap="round" />
          </g>

          {/* 獣医さんの聴診器（首元） */}
          <path
            d="M 16 34 C 18 43, 36 43, 38 34"
            stroke="#2563EB"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* 聴診器のチェストピース */}
          <g className={styles.stethoscopePiece}>
            <line x1="27" y1="39" x2="27" y2="44" stroke="#2563EB" strokeWidth="1.4" />
            <circle cx="27" cy="45" r="2.6" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1" />
          </g>

          {/* ひょっこり振る前足（肉球付き） */}
          <g className={styles.paw}>
            <ellipse cx="14" cy="42" rx="4.5" ry="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            {/* 肉球 */}
            <circle cx="14" cy="42" r="1.5" fill="#F472B6" />
            <circle cx="12" cy="40.5" r="0.6" fill="#F472B6" />
            <circle cx="14" cy="39.8" r="0.6" fill="#F472B6" />
            <circle cx="16" cy="40.5" r="0.6" fill="#F472B6" />
          </g>
        </g>
      </svg>

      {/* クリック時のハートエフェクト */}
      {showHeart && <span className={styles.floatingHeart}>💖</span>}

      {/* 吹き出し */}
      {bubbleText && (
        <div className={styles.cheerBubble} role="status" aria-live="polite">
          {bubbleText}
        </div>
      )}
    </div>
  );
};

