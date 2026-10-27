import React, { useState } from 'react';
import { ANIMAL_STAMPS } from '../data/animal-stamps';
import styles from './DoctorCertificateModal.module.css';

interface DoctorCertificateModalProps {
  onClose: () => void;
  examTitle?: string;
  isPerfectScore?: boolean;
}

export const DoctorCertificateModal: React.FC<DoctorCertificateModalProps> = ({
  onClose,
  examTitle = '2024年度 理科 過去問マスター',
  isPerfectScore = true,
}) => {
  const [userName, setUserName] = useState('みならいドクター');
  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
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
            <span className={styles.goldBadgeText}>金のマスター獣医師バッジ</span>
          </div>
          <div className={styles.goldBadge}>
            <span className={styles.goldBadgeIcon}>🎖️</span>
            <span className={styles.goldBadgeText}>過去問満点メダル</span>
          </div>
        </div>

        {/* 動物たちからの感謝パレード */}
        <div className={styles.animalsCheerBox}>
          <div className={styles.animalsCheerHeader}>
            <span>🐾 元気になった動物たちからのメッセージ</span>
          </div>
          <div className={styles.animalsIconRow}>
            {ANIMAL_STAMPS.map(stamp => (
              <span key={stamp.id} title={stamp.name}>
                {stamp.icon}
              </span>
            ))}
          </div>
          <div className={styles.animalsCheerText}>
            「私たちの病気やケガを治してくれて本当にありがとう！
            <br />
            きみはもう立派な動物のお医者さんだよ！これからもたくさんの動物を救ってね！」
          </div>
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
          <button className={styles.printBtn} onClick={handlePrint}>
            🖨️ 認定証を印刷 / 保存
          </button>
          <button className={styles.closeBtn} onClick={onClose} data-testid="cert-close-btn">
            とじる
          </button>
        </div>
      </div>
    </div>
  );
};

