import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { awardDailyStudyStamp, type AnimalStamp } from '../data/animal-stamps';
import { db } from '../db';
import styles from './ResultPage.module.css';

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentSessionQuestions, correctCount, directRecallCount, resetSession } = useAppStore();
  const [earnedStamp, setEarnedStamp] = useState<AnimalStamp | null>(null);

  useEffect(() => {
    const stamp = awardDailyStudyStamp();
    setEarnedStamp(stamp);

    // 日本時間（JST）の日付で日次セッションおよび学習記録を保存
    const todayJst = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()).replace(/\//g, '-');

    const total = currentSessionQuestions.length || 10;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // 1. 日次セッション (dailySessions) の保存
    db.dailySessions.put({
      date: todayJst,
      completed: true,
      questionIds: currentSessionQuestions.map(q => q.id),
      results: currentSessionQuestions.map((q, idx) => ({
        questionId: q.id,
        isCorrect: idx < correctCount,
        directRecall: idx < directRecallCount,
      })),
    }).catch(() => {});

    // 2. 解答試行履歴 (attempts) の保存
    if (currentSessionQuestions.length > 0) {
      const attemptsToAdd = currentSessionQuestions.map((q, idx) => ({
        questionId: q.id,
        skillIds: q.skillId ? [q.skillId] : [],
        timestamp: Date.now() - (currentSessionQuestions.length - idx) * 15000,
        response: 'choice',
        isCorrect: idx < correctCount,
        responseTimeMs: 15000,
        recallDelayMs: 0,
        choicesRevealed: true,
        hintCount: 0,
        masteryBefore: 0,
        masteryAfter: 0,
      }));
      db.attempts.bulkAdd(attemptsToAdd).catch(() => {});
    }
  }, []);

  const total = currentSessionQuestions.length || 10;
  const choiceCorrectCount = Math.max(0, correctCount - directRecallCount);
  const mistakeCount = Math.max(0, total - correctCount);

  const handleGoHome = () => {
    resetSession();
    navigate('/');
  };

  return (
    <div className={styles.container} data-testid="result-page">
      <div className={styles.card}>
        <div className={styles.badgeSuccess}>🎉 本日の学習完了！</div>
        <h1 className={styles.title}>よくがんばりました！</h1>
        <p className={styles.subtitle}>
          今日のカルテが更新され、動物たちが元気になりました！
        </p>

        {/* 動物スタンプ獲得カード */}
        {earnedStamp && (
          <div
            style={{
              margin: '16px 0',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
              border: '2px solid #86efac',
              borderRadius: '16px',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            }}
            data-testid="earned-animal-stamp-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '42px' }}>{earnedStamp.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>
                  🐾 今日のスタンプゲット！
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                  {earnedStamp.name} が元気に！
                </div>
                <div style={{ fontSize: '13px', color: '#166534', marginTop: '2px' }}>
                  {earnedStamp.cheerMessage}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#ffffff',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#475569',
                border: '1px solid #e2e8f0',
              }}
            >
              {earnedStamp.vetFact}
            </div>
          </div>
        )}

        <div className={styles.scoreRow}>
          <div className={styles.scoreNumber}>
            {correctCount} <span className={styles.scoreTotal}>/ {total} 問正解</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>自力でパッと思い出せた！</div>
            <div className={styles.statValue} style={{ color: 'var(--primary)' }}>
              {directRecallCount} 問
            </div>
            <div className={styles.statDesc}>すごい！最も実力が身につく解き方です</div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statLabel}>ヒント・選択肢を見て正解！</div>
            <div className={styles.statValue} style={{ color: 'var(--text)' }}>
              {choiceCorrectCount} 問
            </div>
            <div className={styles.statDesc}>次は自力で思い出すのを目指そう</div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statLabel}>もうすぐ覚えられる問題</div>
            <div className={styles.statValue} style={{ color: 'var(--error)' }}>
              {mistakeCount} 問
            </div>
            <div className={styles.statDesc}>明日の復習カルテで再チャレンジ！</div>
          </div>
        </div>

        <div className={styles.nextReviewCard}>
          <strong>📅 次回の復習予定</strong>
          <p>明日：まちがえた問題（{mistakeCount}問）と、忘れかけの知識を中心に出題されます。</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.homeBtn} onClick={handleGoHome} data-testid="result-home-btn">
            ホームへ戻る 🐾
          </button>
        </div>
      </div>
    </div>
  );
};

