import React, { useEffect, useMemo } from 'react';
import {
  getPointsSummary,
  getDailyPointsMap,
  VET_RANKS,
  POINTS_SOURCES,
  type PointsSource,
} from '../utils/points-manager';
import { getJstDateString } from '../utils/progress-analytics';
import { sound } from '../utils/sound-effects';
import styles from './PointsNotebookModal.module.css';

interface PointsNotebookModalProps {
  onClose: () => void;
}

export const PointsNotebookModal: React.FC<PointsNotebookModalProps> = ({ onClose }) => {
  const summary = useMemo(() => getPointsSummary(), []);
  const dailyMap = useMemo(() => getDailyPointsMap(), []);
  const todayJst = useMemo(() => getJstDateString(new Date()), []);

  // 直近7日間の日付リスト（JST基準）
  const recentDays = useMemo(() => {
    const list: { dateStr: string; label: string; isToday: boolean; points: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = getJstDateString(d);
      const parts = dateStr.split('-');
      const label = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
      list.push({
        dateStr,
        label,
        isToday: dateStr === todayJst,
        points: dailyMap[dateStr] || 0,
      });
    }
    return list;
  }, [dailyMap, todayJst]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playPop();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClose = () => {
    sound.playPop();
    onClose();
  };

  const sourcesList: PointsSource[] = ['daily_exam', 'prescription', 'case_study', 'vet_challenge'];

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleClose}
      data-testid="points-notebook-modal"
      role="dialog"
      aria-modal="true"
      aria-label="どうぶつ元気のもと手帳"
    >
      <div
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
        data-testid="points-notebook-content"
      >
        {/* ヘッダー */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.headerIcon}>🐾</span>
            <div>
              <h2 className={styles.modalTitle}>どうぶつ元気のもと手帳 ＆ 獣医師カルテ日誌</h2>
              <p className={styles.modalSubTitle}>
                日々の診察・処方・症例スタディ・試験のすべてが、動物たちを救う力になります！
              </p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="閉じる"
            title="閉じる"
            data-testid="close-points-notebook-btn"
          >
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className={styles.modalBody}>
          {/* 今日の獲得 ＆ 累計サマリーカード */}
          <div className={styles.pointsOverviewCard}>
            <div className={`${styles.pointStatBox} ${styles.statBoxToday}`} data-testid="today-points-box">
              <div className={styles.statBoxLabel}>
                <span>🐾 きょうの元気のもと</span>
                {summary.todayPoints >= 8 ? (
                  <span className={styles.todayGoalBadge}>🎯 目標達成！</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>目指せ8こ以上</span>
                )}
              </div>
              <div className={styles.statBoxValue} style={{ color: '#059669' }}>
                +{summary.todayPoints} <span className={styles.statUnit}>こ</span>
              </div>
              <div className={styles.statBoxSub}>
                {summary.todayPoints > 0
                  ? `今日 ${summary.todayPoints} 個の元気のもとを届けたよ！`
                  : '学習を進めて動物たちに元気を届けよう！'}
              </div>
            </div>

            <div className={`${styles.pointStatBox} ${styles.statBoxTotal}`} data-testid="total-points-box">
              <div className={styles.statBoxLabel}>
                <span>🏆 いままでの合計</span>
              </div>
              <div className={styles.statBoxValue} style={{ color: '#2563eb' }}>
                {summary.totalPoints} <span className={styles.statUnit}>こ</span>
              </div>
              <div className={styles.statBoxSub}>
                全医療活動でコツコツ積み重ねた証
              </div>
            </div>
          </div>

          {/* 現在のランク ＆ ストーリー紹介カード */}
          <div className={styles.currentRankCard} data-testid="current-rank-card">
            <div className={styles.rankHeader}>
              <div className={styles.rankBadgeIcon}>{summary.currentRank.badge}</div>
              <div className={styles.rankInfo}>
                <span className={styles.rankChapterTag}>{summary.currentRank.storyChapter}</span>
                <div className={styles.rankTitle}>{summary.currentRank.title}</div>
                <div className={styles.rankDesc}>{summary.currentRank.description}</div>
              </div>
            </div>

            {/* ストーリー抜粋 */}
            <div className={styles.rankStoryBox} data-testid="rank-story-excerpt">
              📖 <strong>獣医師ストーリー:</strong> {summary.currentRank.storyExcerpt}
            </div>

            <div className={styles.rankProgressArea}>
              <div className={styles.progressLabelRow}>
                {summary.nextRank ? (
                  <>
                    <span>
                      次の目標：<strong>{summary.nextRank.title}</strong>
                    </span>
                    <span>
                      あと <strong>{summary.pointsToNextRank} こ</strong>
                    </span>
                  </>
                ) : (
                  <span>🏆 最高峰「名医ゴールド獣医師」到達！</span>
                )}
              </div>
              <div className={styles.progressBarBg} aria-label="ランクアップ進捗バー">
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${summary.rankProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4大医療活動の歩み（カルテ日誌） */}
          <div data-testid="story-sources-section">
            <h3 className={styles.sectionTitle}>
              <span>🩺</span>
              <span>4大医療活動の歩み（元気のもとの内訳）</span>
            </h3>
            <div className={styles.sourcesGrid}>
              {sourcesList.map(srcKey => {
                const srcDetail = POINTS_SOURCES[srcKey];
                const count = summary.bySource[srcKey] || 0;
                return (
                  <div key={srcKey} className={styles.sourceCard} data-testid={`source-card-${srcKey}`}>
                    <div className={styles.sourceLeft}>
                      <span className={styles.sourceIcon}>{srcDetail.icon}</span>
                      <div>
                        <div className={styles.sourceTitle}>{srcDetail.title}</div>
                        <div className={styles.sourceDesc}>{srcDetail.shortDesc}</div>
                      </div>
                    </div>
                    <div className={styles.sourcePoints}>
                      {count}
                      <span className={styles.sourceUnit}>こ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 獣医師ランク一覧（成長ロードマップ） */}
          <div>
            <h3 className={styles.sectionTitle}>
              <span>🗺️</span>
              <span>獣医師ランク ＆ ストーリー一覧</span>
            </h3>
            <div className={styles.ranksList}>
              {VET_RANKS.map(rank => {
                const isCurrent = rank.rankLevel === summary.currentRank.rankLevel;
                const isCleared = rank.rankLevel < summary.currentRank.rankLevel;
                const isLocked = rank.rankLevel > summary.currentRank.rankLevel;

                return (
                  <div
                    key={rank.rankLevel}
                    className={`${styles.rankItem} ${isCurrent ? styles.rankItemCurrent : ''} ${isLocked ? styles.rankItemLocked : ''}`}
                    data-testid={`rank-item-${rank.rankLevel}`}
                  >
                    <div className={styles.rankItemLeft}>
                      <span className={styles.rankItemBadge}>{rank.badge}</span>
                      <div>
                        <div className={styles.rankItemTitle}>
                          {rank.title}
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', fontWeight: 'normal' }}>
                            ({rank.minPoints} こ〜)
                          </span>
                        </div>
                        <div className={styles.rankItemDesc}>{rank.storyChapter}</div>
                      </div>
                    </div>
                    <div className={styles.rankItemRight}>
                      {isCurrent && <span className={styles.rankStatusBadgeCurrent}>いまここ！</span>}
                      {isCleared && <span className={styles.rankStatusBadgeCleared}>読了 ✓</span>}
                      {isLocked && (
                        <span className={styles.rankStatusBadgeLocked}>
                          あと {Math.max(0, rank.minPoints - summary.totalPoints)} こ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 直近7日間の元気お届け記録 */}
          <div>
            <h3 className={styles.sectionTitle}>
              <span>📅</span>
              <span>直近7日間の元気お届け記録</span>
            </h3>
            <div className={styles.historyRow}>
              {recentDays.map(d => (
                <div
                  key={d.dateStr}
                  className={`${styles.historyDayBox} ${d.isToday ? styles.historyDayBoxToday : ''}`}
                  title={`${d.dateStr}: ${d.points} 個獲得`}
                >
                  <span className={styles.historyDayLabel}>
                    {d.label}
                    {d.isToday && ' (今日)'}
                  </span>
                  <span
                    className={styles.historyDayPoints}
                    style={{ color: d.points > 0 ? '#059669' : '#94a3b8' }}
                  >
                    {d.points > 0 ? `+${d.points}` : '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className={styles.modalFooter}>
          <button
            className={styles.footerCloseBtn}
            onClick={handleClose}
            data-testid="modal-bottom-close-btn"
          >
            日誌をとじる 🐾
          </button>
        </div>
      </div>
    </div>
  );
};
