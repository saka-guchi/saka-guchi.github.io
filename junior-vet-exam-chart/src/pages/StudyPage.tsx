import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { QuestionPromptView, AnswerAreaView, ActionState } from '../components/formats/QuestionRenderer';
import styles from './StudyPage.module.css';

export const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings,
    currentSessionQuestions,
    currentIndex,
    recallPhase,
    hintLevel,
    currentAnswered,
    currentUserAnswer,
    currentIsCorrect,
    revealChoices,
    showHint,
    recordAnswer,
    nextQuestion,
  } = useAppStore();

  const currentQ = currentSessionQuestions[currentIndex];
  const onSubmitActionRef = useRef<(() => void) | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [diagramSelectedRegion, setDiagramSelectedRegion] = useState<string | null>(null);

  // 選択肢形式（Delayed Choice / Multiple Choice / Why Choice）のみ Recall First のカウントダウンを表示
  // next_step は算数のステップ解法のためカウントダウンなしで即座に手順選択を開始
  const isChoiceQuestion =
    currentQ?.format === 'delayed_choice' ||
    currentQ?.format === 'multiple_choice' ||
    currentQ?.format === 'why_choice';

  const delaySetting = settings.recallDelaySeconds;
  const isDelayDisabled = delaySetting === 0;

  const isRecallCountdownActive =
    !!currentQ &&
    isChoiceQuestion &&
    recallPhase &&
    !currentAnswered &&
    !isDelayDisabled;

  // カウントダウンタイマー
  const defaultWait = typeof delaySetting === 'number' && delaySetting > 0 ? delaySetting : 6;
  const [countdown, setCountdown] = useState(defaultWait);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!currentQ) return;
    setCountdown(defaultWait);
    setDetailedOpen(false);
    setDiagramSelectedRegion(null);
    setIsPaused(false);
  }, [currentQ?.id, defaultWait]);

  useEffect(() => {
    if (!isRecallCountdownActive || isPaused) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          revealChoices();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecallCountdownActive, isPaused, revealChoices]);

  if (!currentQ) {
    return (
      <div className={styles.emptyContainer}>
        <p>学習セッションがありません。</p>
        <button className={styles.mainBtn} onClick={() => navigate('/')}>ホームに戻る</button>
      </div>
    );
  }

  const handleAnswerSubmit = (answer: any, isCorrect: boolean) => {
    recordAnswer(answer, isCorrect, !recallPhase ? false : true);
  };

  const handleNext = () => {
    const hasMore = nextQuestion();
    if (!hasMore) {
      navigate('/result');
    }
  };

  const totalQuestions = currentSessionQuestions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className={styles.pageLayout} data-testid="study-page">
      {/* ヘッダー */}
      <header className={styles.header} data-testid="study-header">
        <button
          className={styles.iconBtn}
          onClick={() => navigate('/')}
          aria-label="戻る"
          data-testid="study-back-btn"
        >
          ←
        </button>

        <div className={styles.headerCenter}>
          <span className={styles.counterText} data-testid="study-progress-counter">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.categoryBadge}>{currentQ.category}</span>
          <button
            className={styles.iconBtn}
            onClick={() => setIsPaused(true)}
            aria-label="一時停止"
            data-testid="study-pause-btn"
          >
            ⏸
          </button>
        </div>
      </header>

      {/* メイン学習エリア */}
      <main className={styles.mainArea}>
        {/* 左: 問題エリア（第22章仕様: 問題文と図） */}
        <section className={styles.questionArea} data-testid="question-area">
          <div className={styles.skillHeader}>
            <span className={styles.skillBadge}>🩺 今日のカルテ項目: {currentQ.skillTitle}</span>
          </div>

          <QuestionPromptView
            key={`prompt-${currentQ.id}`}
            question={currentQ}
            selectedRegion={diagramSelectedRegion}
            onRegionSelect={setDiagramSelectedRegion}
            answered={currentAnswered}
          />
        </section>

        {/* 右: 回答エリア（第22章仕様: 選択肢・並べ替えカード・キーパッド・解説） */}
        <section className={styles.answerArea} data-testid="answer-area">
          {isRecallCountdownActive ? (
            /* 1. 思い出すフェーズ (Recall First: 選択式問題のみ) */
            <div className={styles.recallPanel} data-testid="recall-panel">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary-weak)',
                  color: 'var(--primary)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                📋 4択の選択問題
              </div>
              <div className={styles.recallPrompt}>まず頭の中で考えよう</div>
              <div className={styles.meterCircle} data-testid="recall-timer">
                {countdown}
              </div>
              <p className={styles.recallSubtext} style={{ textAlign: 'center', lineHeight: '1.6' }}>
                あと <strong>{countdown} 秒</strong> で選択肢が表示されます。<br />
                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  待たずにすぐ解きたい場合は、下のボタンを押してください。
                </span>
              </p>

              {hintLevel < 2 && (
                <button
                  className={styles.hintBtn}
                  onClick={showHint}
                  data-testid="show-hint-btn"
                >
                  💡 ヒントを見る ({hintLevel}/2)
                </button>
              )}

              {hintLevel > 0 && (
                <div className={styles.hintBox} data-testid="hint-box">
                  <div className={styles.hintLevelText}>ヒント {hintLevel}:</div>
                  <div>{currentQ.hints[hintLevel - 1]?.text}</div>
                </div>
              )}
            </div>
          ) : (
            /* 回答エリア本体：回答前も回答後も常に表示！ */
            <div className={styles.activeAnswerPanel}>
              {currentAnswered ? (
                /* 1. 回答後の結果ヘッダー（✓ 正解！ / ✕ 不正解） */
                <div
                  className={`${styles.resultBanner} ${currentIsCorrect ? styles.correctBanner : styles.wrongBanner}`}
                  data-testid="result-banner"
                  style={{ marginBottom: '16px' }}
                >
                  <span className={styles.resultIcon}>{currentIsCorrect ? '✓' : '✕'}</span>
                  <span className={styles.resultText}>{currentIsCorrect ? '正解！' : '不正解'}</span>
                </div>
              ) : (
                /* 回答前の形式見出し＆ヒント */
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                    }}
                  >
                    {(() => {
                      switch (currentQ.format) {
                        case 'recall_card':
                          return '答えを自己判定しよう（選択肢なし）';
                        case 'ordering':
                          return '正しい順に並べ替えよう';
                        case 'numeric_answer':
                          return '数字を入力しよう';
                        case 'matching':
                          return 'ペアを結びつけよう';
                        case 'diagram_touch':
                          return '図をタップしよう';
                        case 'self_check':
                          return '紙で解いた後の自己採点';
                        default:
                          return '選択肢から選ぼう';
                      }
                    })()}
                  </span>
                  {hintLevel < 2 && (
                    <button
                      className={styles.miniHintBtn}
                      onClick={showHint}
                      data-testid="show-hint-btn"
                    >
                      💡 ヒント ({hintLevel}/2)
                    </button>
                  )}
                </div>
              )}

              {hintLevel > 0 && !currentAnswered && (
                <div className={styles.hintBox} style={{ marginBottom: '14px' }} data-testid="hint-box">
                  <div className={styles.hintLevelText}>ヒント {hintLevel}:</div>
                  <div>{currentQ.hints[hintLevel - 1]?.text}</div>
                </div>
              )}

              {/* 2. 選択肢・入力・並べ替えコンポーネント（回答後も結果マーク付きで表示を維持） */}
              <AnswerAreaView
                key={`answer-${currentQ.id}`}
                question={currentQ}
                onAnswer={handleAnswerSubmit}
                answered={currentAnswered}
                userAnswer={currentUserAnswer}
                onSubmitActionRef={onSubmitActionRef}
                onActionStateChange={setActionState}
                selectedRegion={diagramSelectedRegion}
                onRegionSelect={setDiagramSelectedRegion}
              />

              {/* 3. 回答後は選択肢のすぐ下に解説パネルを展開 */}
              {currentAnswered && (
                <div className={styles.explanationPanel} data-testid="explanation-panel" style={{ marginTop: '20px' }}>
                  <div className={styles.explCard}>
                    <div className={styles.explSection}>
                      <div className={styles.explLabel}>覚えること</div>
                      <div className={styles.takeawayText}>{currentQ.explanation.keyTakeaway}</div>
                    </div>

                    <div className={styles.explSection}>
                      <div className={styles.explLabel}>考え方</div>
                      <div className={styles.reasoningText}>{currentQ.explanation.reasoning}</div>
                    </div>

                    <div className={styles.detailedToggle}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setDetailedOpen(!detailedOpen)}
                      >
                        {detailedOpen ? '▲ 詳しい解説を閉じる' : '▼ 詳しい解説を見る'}
                      </button>
                      {detailedOpen && (
                        <div className={styles.detailedContent}>
                          {currentQ.explanation.resultSummary}
                        </div>
                      )}
                    </div>
                  </div>

                  <button className={styles.reportBtn} data-testid="report-question-btn">
                    この問題はおかしい
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* 下部の操作エリア */}
      <footer className={styles.bottomBar} data-testid="bottom-control-bar">
        {isRecallCountdownActive ? (
          <>
            <button
              className={styles.subBtn}
              onClick={revealChoices}
              data-testid="recall-understood-btn"
            >
              分かった
            </button>
            <button
              className={styles.mainBtn}
              onClick={revealChoices}
              data-testid="reveal-choices-btn"
            >
              今すぐ選択肢を見る
            </button>
          </>
        ) : currentAnswered ? (
          <>
            <div style={{ width: '200px' }} />
            <button
              className={styles.mainBtn}
              onClick={handleNext}
              data-testid="next-question-btn"
            >
              次へ →
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.subBtn}
              onClick={() => navigate('/')}
              data-testid="study-quit-btn"
            >
              やめる
            </button>
            <button
              className={styles.mainBtn}
              onClick={() => {
                if (actionState?.ready && actionState.onAction) {
                  actionState.onAction();
                } else if (onSubmitActionRef.current) {
                  onSubmitActionRef.current();
                }
              }}
              style={{
                background: actionState?.ready ? 'var(--primary)' : 'var(--border)',
                color: actionState?.ready ? 'white' : 'var(--text-subtle)',
              }}
              disabled={!actionState?.ready}
              data-testid={
                currentQ?.format === 'ordering'
                  ? 'order-submit-btn'
                  : currentQ?.format === 'recall_card'
                  ? 'recall-reveal-btn'
                  : currentQ?.format === 'matching'
                  ? 'matching-submit-btn'
                  : currentQ?.format === 'numeric_answer'
                  ? 'numeric-submit-btn'
                  : currentQ?.format === 'diagram_touch'
                  ? 'diagram-submit-btn'
                  : 'study-submit-action-btn'
              }
            >
              {actionState
                ? actionState.label
                : currentQ?.format === 'diagram_touch'
                ? '図の場所をタップしてください'
                : '選択肢を選んでください'}
            </button>
          </>
        )}
      </footer>

      {/* 一時停止モーダル */}
      {isPaused && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          data-testid="study-pause-modal"
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '48px', lineHeight: 1 }}>☕</div>
            <h2 style={{ font: 'var(--font-heading)', margin: 0, color: 'var(--text)' }}>
              一時停止中
            </h2>
            <p style={{ font: 'var(--font-body)', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.6' }}>
              タイマーと学習を停止しています。<br />
              一息ついて、準備ができたら再開しましょう！
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' }}>
              <button
                className={styles.mainBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setIsPaused(false)}
                data-testid="study-resume-btn"
              >
                学習を再開する ▶
              </button>
              <button
                className={styles.subBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/')}
                data-testid="study-pause-quit-btn"
              >
                中断してホームに戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
