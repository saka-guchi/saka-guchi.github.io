import React, { useState, useEffect } from 'react';
import { fireConfetti } from '../utils/confetti';
import { sound } from '../utils/sound-effects';
import styles from './DoctorCertificateModal.module.css';

interface DoctorCertificateModalProps {
  onClose: () => void;
  examTitle?: string;
  isPerfectScore?: boolean;
  hasMasterBadge?: boolean;
}

export const DoctorCertificateModal: React.FC<DoctorCertificateModalProps> = ({
  onClose,
  examTitle = '2024年度 理科 過去問マスター',
  isPerfectScore = true,
  hasMasterBadge = false,
}) => {
  const [userName, setUserName] = useState('みならいドクター');
  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    sound.playChime();
    fireConfetti({ count: 60 });
  }, []);

  const handlePrint = () => {
    sound.playPop();
    window.print();
  };

  // Canvas による認定証画像の自動生成とダウンロード（静的で完結）
  const handleDownloadImage = () => {
    sound.playStamp();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景（賞状の金色・クリーム色グラデーション）
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#fffdfa');
    grad.addColorStop(0.5, '#fffbeb');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // 金色の二重枠
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 740);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 1104, 704);

    // リボン上部
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 22px "Zen Maru Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ 過去問 100点満点クリア認定 ★', 600, 95);

    // メインタイトル
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 44px "Zen Maru Gothic", sans-serif';
    ctx.fillText('合格ドクター認定証', 600, 160);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 22px "Zen Maru Gothic", sans-serif';
    ctx.fillText('【 みならい獣医師・マスターライセンス 】', 600, 205);

    // 宛名
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 32px "Zen Maru Gothic", sans-serif';
    ctx.fillText(`${userName} どの`, 600, 280);

    // 本文
    ctx.fillStyle = '#334155';
    ctx.font = '500 20px "Zen Maru Gothic", sans-serif';
    ctx.fillText('あなたは「みならい獣医さんの中学受験カルテ」において、', 600, 340);
    ctx.fillText(`本番認定試験（${examTitle}）にて`, 600, 375);
    ctx.fillText(isPerfectScore ? '見事に【100点満点】を達成されました。' : '見事に合格基準を達成されました。', 600, 410);
    if (hasMasterBadge) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 22px "Zen Maru Gothic", sans-serif';
      ctx.fillText('★ Stage 1 & 2 完全制覇！金のマスター獣医師バッジ獲得 ★', 600, 450);
      ctx.fillStyle = '#334155';
      ctx.font = '500 20px "Zen Maru Gothic", sans-serif';
    } else {
      ctx.fillText('動物たちの生命と自然の仕組みを深く理解した努力を讃え、ここに証します。', 600, 450);
    }

    // 授与バッジ表示
    ctx.font = 'bold 24px "Zen Maru Gothic", sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('👑 合格ドクターライセンス 授与', 600, 520);
    if (hasMasterBadge) {
      ctx.fillStyle = '#d97706';
      ctx.fillText('⭐ 金のマスター獣医師バッジ（Stage 1 & 2 完全制覇！）授与', 600, 560);
    }

    // 日付・番号
    ctx.font = 'bold 18px "Zen Maru Gothic", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('認定番号：VET-2026-YASUDA-100', 80, 710);
    ctx.textAlign = 'right';
    ctx.fillText(`認定日：${todayStr}`, 1120, 710);

    // ダウンロード
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `合格ドクター認定証_${userName}.png`;
    a.click();
    fireConfetti({ count: 50 });
  };

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="doctor-certificate-modal">
      <div className={styles.certificateWrapper} onClick={e => e.stopPropagation()}>
        <div className={styles.ribbonTop}>★ 過去問 100点満点クリア認定 ★</div>

        <h1 className={styles.certTitle}>合格ドクター認定証</h1>
        <div className={styles.certSubtitle}>
          【 みならい獣医師・マスターライセンス 】
        </div>

        <div className={styles.recipientBox}>
          <span style={{ fontSize: '16px', color: '#78350f' }}>氏名：</span>
          <input
            className={styles.recipientName}
            value={userName}
            onChange={e => setUserName(e.target.value)}
            title="クリックして名前を変更できます"
          />
          <span style={{ fontSize: '16px', color: '#78350f' }}>どの</span>
        </div>

        <div className={styles.certBody}>
          あなたは「みならい獣医さんの中学受験カルテ」において、
          出題される全9テーマの知識を完全に習得し、
          本番認定試験（{examTitle}）において
          {isPerfectScore ? '見事に【100点満点】を達成' : '見事に合格基準を達成'}されました。
          <br />
          動物たちの生命と自然の仕組みを深く理解したその努力を讃え、
          ここに<strong>「合格ドクター（マスター獣医師）」</strong>の称号を授与し、証します。
        </div>

        {/* 授与バッジ */}
        <div className={styles.badgeRow}>
          <div className={styles.goldBadge}>
            <span className={styles.goldBadgeIcon}>👑</span>
            <span className={styles.goldBadgeText}>合格ドクターライセンス</span>
          </div>
          {hasMasterBadge ? (
            <div className={styles.goldBadge} data-testid="master-vet-badge-earned">
              <span className={styles.goldBadgeIcon}>⭐</span>
              <span className={styles.goldBadgeText}>金のマスター獣医師バッジ（Stage 1&2 制覇！）</span>
            </div>
          ) : (
            <div
              className={styles.goldBadge}
              style={{ opacity: 0.7, background: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' }}
              title="Stage 1 と Stage 2（同等未見問題）の両方をクリアするとアンロックされます"
              data-testid="master-vet-badge-locked"
            >
              <span className={styles.goldBadgeIcon}>🔒</span>
              <span className={styles.goldBadgeText} style={{ color: '#4b5563' }}>
                金のマスター獣医師バッジ（Stage 1 & 2 両方クリアでアンロック！）
              </span>
            </div>
          )}
        </div>

        <div className={styles.certFooter}>
          <div>
            認定番号：<strong>VET-2026-YASUDA-100</strong>
          </div>
          <div>
            認定日：<strong>{todayStr}</strong>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.printBtn}
            onClick={handleDownloadImage}
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            title="賞状を画像（PNG）として保存しておうちの人に見せよう！"
          >
            📸 画像（PNG）で保存
          </button>
          <button className={styles.printBtn} onClick={handlePrint}>
            🖨️ 印刷する
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
};
