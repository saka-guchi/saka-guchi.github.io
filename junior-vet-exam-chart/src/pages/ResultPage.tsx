import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type SessionAnswerRecord } from '../store/appStore';
import { awardDailyStudyStamp, type AnimalStamp } from '../data/animal-stamps';
import { getFormatBadge } from '../components/formats/QuestionRenderer';
import { db } from '../db';
import { recordDailyStudyCompleted } from '../utils/progress-analytics';
import styles from './ResultPage.module.css';

// 教科ラベルのフォーマットヘルパー（小学生向け世界観の統一）
function getSubjectLabel(subject?: string): string {
  switch (subject) {
    case 'rika': return '🧪 理科';
    case 'sansu': return '📐 算数';
    case 'shakai': return '🗾 社会';
    default: return subject || '総合';
  }
}

// 回答値・正解値のフォーマットヘルパー
function formatAnswerDisplay(question: any, answer: any): string {
  if (answer === null || answer === undefined || answer === '') {
    return '（未回答）';
  }

  // 選択式 (delayed_choice, multiple_choice, why_choice, next_step)
  const choices = question.choices || question.data?.choices;
  if (choices && Array.isArray(choices)) {
    const choice = choices.find((c: any) => c.id === answer);
    if (choice) {
      const label = choice.label ? `${choice.label}. ` : '';
      return `${label}${choice.text}`;
    }
  }

  // 図表タップ (diagram_touch)
  if (question.format === 'diagram_touch' && question.data?.regions) {
    const region = question.data.regions.find((r: any) => r.id === answer);
    if (region) return region.name;
  }

  // 並べ替え (ordering)
  if (Array.isArray(answer) && question.data?.items) {
    const itemMap = new Map(question.data.items.map((i: any) => [i.id, i.text]));
    return answer.map((id, idx) => `${idx + 1}. ${itemMap.get(id) || id}`).join(' → ');
  }

  // 自己採点 (self_check)
  if (question.format === 'self_check') {
    switch (answer) {
      case 'correct': return '正解した';
      case 'method_correct_calc_miss': return '解き方は合っていたが計算ミス';
      case 'partial': return '途中まで分かった';
      case 'dont_know': return '解き方が分からなかった';
      default: return String(answer);
    }
  }

  // 組み合わせ (matching)
  if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
    const leftMap = new Map(question.data?.leftItems?.map((i: any) => [i.id, i.text]));
    const rightMap = new Map(question.data?.rightItems?.map((i: any) => [i.id, i.text]));
    return Object.entries(answer)
      .map(([l, r]) => `${leftMap.get(l) || l} 🔗 ${rightMap.get(r as string) || r}`)
      .join(' / ');
  }

  return String(answer);
}

// 間違えた問題振り返りカード
const MistakeReviewCard: React.FC<{ record: SessionAnswerRecord; index: number }> = ({ record, index }) => {
  const q = record.question;
  const badge = getFormatBadge(q.format);
  const formattedUserAnswer = formatAnswerDisplay(q, record.userAnswer);
  const formattedCorrectAnswer = formatAnswerDisplay(q, q.correctAnswer);

  const keyTakeaway = q.explanation?.keyTakeaway;
  const reasoning = q.explanation?.reasoning;
  const isReasoningDuplicate = !reasoning || reasoning === keyTakeaway;

  return (
    <div className={styles.mistakeCard} data-testid={`mistake-card-${index}`}>
      <div className={styles.mistakeCardHeader}>
        <span className={styles.badgeSubject}>{getSubjectLabel(q.subject)}</span>
        <span className={styles.badgeSkill}>🩺 {q.skillTitle}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
          {badge.icon} {badge.label}
        </span>
      </div>

      <div className={styles.mistakePrompt}>{q.prompt}</div>

      <div className={styles.answerComparisonGrid}>
        <div className={styles.userAnswerBox}>
          <div className={styles.answerBoxLabel}>✕ あなたの答え</div>
          <div className={styles.answerBoxValue}>{formattedUserAnswer}</div>
        </div>
        <div className={styles.correctAnswerBox}>
          <div className={styles.answerBoxLabel}>✓ 正解</div>
          <div className={styles.answerBoxValue}>{formattedCorrectAnswer}</div>
        </div>
      </div>

      {q.explanation && (
        <div className={styles.explanationBox}>
          <div className={styles.explanationLabel}>💡 考え方・覚えること</div>
          {keyTakeaway && (
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{keyTakeaway}</div>
          )}
          {!isReasoningDuplicate && (
            <div style={{ color: 'var(--text-subtle)', lineHeight: '1.5' }}>{reasoning}</div>
          )}

          {q.hints && q.hints.length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>
                ヒント: {q.hints.map(h => h.text).join(' / ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentSessionQuestions, correctCount, directRecallCount, sessionResults, resetSession } = useAppStore();
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
    const effectiveResults = sessionResults.length > 0
      ? sessionResults
      : currentSessionQuestions.map((q, idx) => ({
          question: q,
          userAnswer: null,
          isCorrect: idx < correctCount,
          directRecall: idx < directRecallCount,
        }));

    // 1. 日次セッション (dailySessions) の保存
    db.dailySessions.put({
      date: todayJst,
      completed: true,
      questionIds: currentSessionQuestions.map(q => q.id),
      results: effectiveResults.map(r => ({
        questionId: r.question.id,
        isCorrect: r.isCorrect,
        directRecall: r.directRecall,
      })),
    }).catch(() => {});

    // 2. 解答試行履歴 (attempts) の保存
    if (effectiveResults.length > 0) {
      const attemptsToAdd = effectiveResults.map((r, idx) => ({
        questionId: r.question.id,
        skillIds: r.question.skillId ? [r.question.skillId] : [],
        timestamp: Date.now() - (effectiveResults.length - idx) * 15000,
        response: 'choice',
        isCorrect: r.isCorrect,
        responseTimeMs: 15000,
        recallDelayMs: 0,
        choicesRevealed: true,
        hintCount: 0,
        masteryBefore: 0,
        masteryAfter: 0,
      }));
      db.attempts.bulkAdd(attemptsToAdd).catch(() => {});
    }

    // 3. 今日の学習完了を記録し連続学習日数（ストリーク）を更新
    recordDailyStudyCompleted().catch(() => {});
  }, []);

  const total = currentSessionQuestions.length || 10;
  const choiceCorrectCount = Math.max(0, correctCount - directRecallCount);
  const mistakeCount = Math.max(0, total - correctCount);

  // 間違えた問題の抽出
  const mistakeResults = sessionResults.length > 0
    ? sessionResults.filter(r => !r.isCorrect)
    : [];

  const handleGoHome = () => {
    resetSession();
    navigate('/');
  };

  return (
    <div className={styles.container} data-testid="result-page">
      {/* 画面共通ヘッダー（左上にホームへ戻るボタンを常時配置） */}
      <header className={styles.header} data-testid="result-header">
        <button
          className={styles.iconBtn}
          onClick={handleGoHome}
          aria-label="ホームへ戻る"
          title="ホームへ戻る"
          data-testid="result-top-back-btn"
        >
          ←
        </button>
        <h1 className={styles.headerTitle}>本日の学習カルテ</h1>
        <div style={{ width: '48px' }} />
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.badgeSuccess}>🎉 本日の学習完了！</div>
          <h2 className={styles.title}>よくがんばりました！</h2>
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

        {/* まちがえた問題の振り返りセクション */}
        {mistakeResults.length > 0 ? (
          <div className={styles.mistakeReviewSection} data-testid="mistake-review-section">
            <div className={styles.mistakeSectionHeader}>
              <div className={styles.mistakeSectionTitle}>
                <span>📝 まちがえた問題の振り返り</span>
                <span className={styles.mistakeCountBadge}>{mistakeResults.length} 問</span>
              </div>
              <p className={styles.mistakeSectionSubtext}>
                自分の答えと正解・「考え方」を確認して、次は正解できるようにしよう！
              </p>
            </div>

            <div className={styles.mistakeList}>
              {mistakeResults.map((result, idx) => (
                <MistakeReviewCard
                  key={result.question.id || idx}
                  record={result}
                  index={idx}
                />
              ))}
            </div>
          </div>
        ) : mistakeCount === 0 ? (
          <div className={styles.allCorrectBanner} data-testid="all-correct-banner">
            <span style={{ fontSize: '32px' }}>🌟</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--success)' }}>
                まちがえた問題はありません！全問パーフェクト！
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                すばらしい集中力です！この調子でゴールドマスター獣医師を目指そう！
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.homeBtn} onClick={handleGoHome} data-testid="result-home-btn">
            ホームへ戻る 🐾
          </button>
        </div>
      </div>
      </main>
    </div>
  );
};

