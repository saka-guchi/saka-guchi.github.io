import React, { useState, useMemo } from 'react';
import styles from './ReferenceBookQuizModal.module.css';
import { REFERENCE_BOOKS, HISTORY_80_FIGURES, HistoryFigureData } from '../data/extra-history-80';
import { getRefBookProgress, saveRefBookAnswer, recordRefBookSessionClear } from '../utils/reference-book-store';
import { sound } from '../utils/sound-effects';

interface Props {
  bookId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export const ReferenceBookQuizModal: React.FC<Props> = ({ bookId, onClose, onUpdate }) => {
  const bookInfo = useMemo(() => {
    return REFERENCE_BOOKS.find(b => b.id === bookId) || REFERENCE_BOOKS[0];
  }, [bookId]);

  // セッション用に10問シャッフル抽出
  const sessionQuestions = useMemo(() => {
    const list = [...HISTORY_80_FIGURES];
    // シャッフル
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 10);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showKeywordHint, setShowKeywordHint] = useState(true);

  const currentFigure: HistoryFigureData = sessionQuestions[currentIndex];
  const progress = getRefBookProgress(bookId);

  const handleSelectChoice = (choice: string) => {
    if (isAnswered) return;
    setSelectedAnswer(choice);
    setIsAnswered(true);

    const isCorrect = choice === currentFigure.question.correctAnswer;
    if (isCorrect) {
      sound.playChime();
      setCorrectCount(c => c + 1);
    } else {
      sound.playStamp();
    }

    saveRefBookAnswer(bookId, currentFigure.id, isCorrect);
    if (onUpdate) onUpdate();
  };

  const handleNext = () => {
    sound.playPop();
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // 終了
      recordRefBookSessionClear(bookId);
      if (onUpdate) onUpdate();
      sound.playFanfare();
      setIsFinished(true);
    }
  };

  const progressPercent = Math.round(((currentIndex + (isAnswered ? 1 : 0)) / sessionQuestions.length) * 100);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>{bookInfo.badgeText}</span>
            <span className={styles.subjectBadge}>{bookInfo.subjectLabel}</span>
            <h3 className={styles.modalTitle}>{bookInfo.shortTitle}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        {!isFinished ? (
          <div className={styles.body}>
            {/* プログレスバー */}
            <div className={styles.progressContainer}>
              <div className={styles.progressLabel}>
                <span>
                  問 {currentIndex + 1} / {sessionQuestions.length}
                </span>
                <span className={styles.scoreLive}>正解数: {correctCount} 問</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 問題カード */}
            <div className={styles.questionCard}>
              <div className={styles.questionMeta}>
                <span className={styles.periodBadge}>🏛️ {currentFigure.period}</span>
                {currentFigure.rank && (
                  <span className={styles.rankBadge}>入試でる順 #{currentFigure.rank}</span>
                )}
                <span className={styles.schoolBadge}>🏫 {currentFigure.question.school}</span>
              </div>

              {/* 即答キーワード（ヒント枠） */}
              <div className={styles.keywordBox}>
                <div className={styles.keywordHeader}>
                  <span className={styles.keywordIcon}>⚡</span>
                  <span className={styles.keywordTitle}>即答キーワード</span>
                  <button
                    type="button"
                    className={styles.hintToggleBtn}
                    onClick={() => setShowKeywordHint(!showKeywordHint)}
                  >
                    {showKeywordHint ? 'かくす 👁️' : 'みる 💡'}
                  </button>
                </div>
                {showKeywordHint ? (
                  <div className={styles.keywordsList}>
                    {currentFigure.keywords.map((kw, i) => (
                      <span key={i} className={styles.keywordPill}>
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.keywordMasked}>ヒントをタップすると表示されるよ！</div>
                )}
              </div>

              {/* 問題文 */}
              <div className={styles.promptText}>
                {currentFigure.question.prompt}
              </div>

              {/* 選択肢ボタン */}
              <div className={styles.choicesGrid}>
                {currentFigure.question.choices.map((choice, i) => {
                  let choiceClass = styles.choiceBtn;
                  if (isAnswered) {
                    if (choice === currentFigure.question.correctAnswer) {
                      choiceClass += ` ${styles.choiceCorrect}`;
                    } else if (choice === selectedAnswer) {
                      choiceClass += ` ${styles.choiceIncorrect}`;
                    } else {
                      choiceClass += ` ${styles.choiceDimmed}`;
                    }
                  } else if (selectedAnswer === choice) {
                    choiceClass += ` ${styles.choiceSelected}`;
                  }

                  return (
                    <button
                      key={i}
                      className={choiceClass}
                      onClick={() => handleSelectChoice(choice)}
                      disabled={isAnswered}
                    >
                      <span className={styles.choiceLetter}>{['ア', 'イ', 'ウ', 'エ'][i] || '・'}</span>
                      <span className={styles.choiceText}>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {/* 解答確定後のフィードバック */}
              {isAnswered && (
                <div
                  className={`${styles.feedbackCard} ${
                    selectedAnswer === currentFigure.question.correctAnswer
                      ? styles.feedbackCorrect
                      : styles.feedbackIncorrect
                  }`}
                >
                  <div className={styles.feedbackTitle}>
                    {selectedAnswer === currentFigure.question.correctAnswer ? (
                      <span>🎉 大正解！ さすが歴史マスター！</span>
                    ) : (
                      <span>😢 おしい！ 正解は【{currentFigure.question.correctAnswer}】だよ</span>
                    )}
                  </div>
                  <div className={styles.explanationText}>
                    <strong>📖 重要ポイント解説:</strong> {currentFigure.question.explanation}
                  </div>
                  <div className={styles.feedbackNextRow}>
                    <button className={styles.nextQuestionBtn} onClick={handleNext}>
                      {currentIndex + 1 < sessionQuestions.length ? 'つぎの問題へ進む ❯' : '特訓結果を見る！ 🏆'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* リザルト画面 */
          <div className={styles.resultContainer}>
            <div className={styles.resultBadge}>🎉 番外特訓クエスト 達成！</div>
            <h2 className={styles.resultScore}>
              10問中 <span className={styles.scoreHighlight}>{correctCount}</span> 問 正解！
            </h2>
            <div className={styles.resultMessage}>
              {correctCount === 10
                ? '🌟 パーフェクト！歴史人物の即答力はカンペキです！'
                : correctCount >= 7
                ? '✨ すばらしい！重要人物の特徴をしっかりつかめているね！'
                : '🌱 ナイスチャレンジ！何度もくり返して即答キーワードを覚えよう！'}
            </div>

            <div className={styles.statsCard}>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>📕 この参考書のマスター状況:</span>
                <span className={styles.statsValue}>
                  {progress.masteredIds.length} / {bookInfo.availableQuestionsCount} 人 達成
                </span>
              </div>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>🏆 特訓クリア回数:</span>
                <span className={styles.statsValue}>{progress.clearedSessionsCount} 回</span>
              </div>
            </div>

            <div className={styles.resultActions}>
              <button
                className={styles.retryBtn}
                onClick={() => {
                  sound.playPop();
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                  setIsAnswered(false);
                  setCorrectCount(0);
                  setIsFinished(false);
                }}
              >
                🔄 もう1回特訓する（別の10問）
              </button>
              <button className={styles.finishBtn} onClick={onClose}>
                🏠 ホームに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
