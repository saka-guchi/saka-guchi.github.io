import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ExamYear, ChallengeSection, ChallengeSlot } from '../../data/final-challenge-data';
import type { Subject } from '../../types';
import {
  getMikeFeedback,
  formatRubricItem,
  selectNextStepRecommendation,
} from '../../utils/exam-review-helper';
import { APP_TERMS } from '../../constants/terms';
import styles from './ExamReviewPage.module.css';

export interface ExamReviewPageProps {
  year: ExamYear;
  subject: Subject;
  subjectLabel: string;
  sections: ChallengeSection[];
  answers: Record<string, string>;
  rubricChecks: Record<string, Record<number, boolean>>;
  markedZeroSlots: Record<string, boolean>;
  onRubricChange: (slotId: string, rubricIndex: number, checked: boolean) => void;
  onMarkZero: (slotId: string) => void;
  isFinalized: boolean;
  onFinalize: () => void;
  onGoHome: () => void;
  isTimeUpSubmitted?: boolean;
  isResumed?: boolean;
  onShowCertificate?: () => void;
  onStartSkillFocus?: (skillId: string) => void;
  onOpenSubjectCaseStudy?: (subject: Subject) => void;
}

export const ExamReviewPage: React.FC<ExamReviewPageProps> = ({
  year,
  subject,
  subjectLabel,
  sections,
  answers,
  rubricChecks,
  markedZeroSlots,
  onRubricChange,
  onMarkZero,
  isFinalized,
  onFinalize,
  onGoHome,
  isTimeUpSubmitted = false,
  isResumed = false,
  onShowCertificate,
  onStartSkillFocus,
  onOpenSubjectCaseStudy,
}) => {
  const [filterNeedsWorkOnly, setFilterNeedsWorkOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 全スロット一覧
  const allSlots = useMemo<ChallengeSlot[]>(() => {
    return sections.flatMap((s) => s.slots);
  }, [sections]);

  // 記述スロット
  const openSlots = useMemo<ChallengeSlot[]>(() => {
    return allSlots.filter((s) => s.answerType === 'open');
  }, [allSlots]);

  // 各スロットの判定計算
  const slotJudgments = useMemo(() => {
    const map: Record<
      string,
      {
        isAnswered: boolean;
        isEvaluated: boolean; // 判定済みか
        isCorrect: boolean;
      }
    > = {};

    for (const slot of allSlots) {
      if (slot.answerType === 'open') {
        const totalRubrics = slot.rubricItems?.length || 1;
        const checks = rubricChecks[slot.id] || {};
        const checkedCount = Object.values(checks).filter(Boolean).length;
        const isMarkedZero = !!markedZeroSlots[slot.id];
        const hasAnyCheck = Object.keys(checks).length > 0;

        // チェックを1つでも操作したか、どれも書けなかったを押した時点で判定済み
        const isEvaluated = hasAnyCheck || isMarkedZero;
        const isCorrect = !isMarkedZero && checkedCount === totalRubrics && totalRubrics > 0;

        map[slot.id] = {
          isAnswered: (answers[slot.id] || '').trim().length > 0,
          isEvaluated,
          isCorrect,
        };
      } else {
        const userAns = (answers[slot.id] || '').trim();
        const expected = (slot.correctAnswer || '').trim();
        const isCorrect = userAns.toLowerCase() === expected.toLowerCase();
        map[slot.id] = {
          isAnswered: userAns.length > 0,
          isEvaluated: true,
          isCorrect,
        };
      }
    }

    return map;
  }, [allSlots, answers, rubricChecks, markedZeroSlots]);

  // 判定済みの記述問題数と残り数
  const evaluatedOpenCount = useMemo(() => {
    return openSlots.filter((s) => slotJudgments[s.id]?.isEvaluated).length;
  }, [openSlots, slotJudgments]);

  const remainingOpenCount = openSlots.length - evaluatedOpenCount;
  const isAllOpenEvaluated = remainingOpenCount <= 0;

  // 正解数と点数の計算
  const correctCount = useMemo(() => {
    return allSlots.filter((s) => slotJudgments[s.id]?.isCorrect).length;
  }, [allSlots, slotJudgments]);

  const totalQuestions = allSlots.length;
  const currentScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // 結果用ミケちゃんフィードバック（確定時に固定）
  const mikeFeedback = useMemo(() => {
    return getMikeFeedback(currentScore);
  }, [currentScore]);

  // 状態B（結果）かつ「もう少し」が1問以上あるときの「つぎの一歩」提案（全問せいかいのときは null）
  const nextStepRecommendation = useMemo(() => {
    if (!isFinalized) return null;
    const needsWorkSlots = allSlots
      .filter((s) => !slotJudgments[s.id]?.isCorrect)
      .map((s) => ({ slotId: s.id, subject }));
    if (needsWorkSlots.length === 0) return null;
    return selectNextStepRecommendation(needsWorkSlots);
  }, [isFinalized, allSlots, slotJudgments, subject]);

  // 状態Bに切り替わったときにページ先頭へスムーズスクロール
  const prevFinalizedRef = useRef(isFinalized);
  useEffect(() => {
    if (!prevFinalizedRef.current && isFinalized) {
      const prefersReduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (typeof window.scrollTo === 'function') {
        try { window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); } catch { /* jsdom */ }
      }
    }
    prevFinalizedRef.current = isFinalized;
  }, [isFinalized]);

  // 開発者向け文言のクリーンアップ（「第13章仕様」「Stage 1」など）
  const cleanText = (text: string) => {
    return text.replace(/（?第\d+章仕様）?/g, '').replace(/（?Stage\s*\d+.*?）?/gi, '').trim();
  };

  return (
    <div className={styles.container} ref={containerRef} data-testid="exam-review-page">
      {/* 1. 固定ヘッダー */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.homeBtn}
          onClick={onGoHome}
          data-testid="review-header-home-btn"
        >
          <span aria-hidden="true">←</span> ホームにもどる
        </button>
        <h1 className={styles.examTitle}>
          {year}年度 {subjectLabel} の見直し
        </h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      {/* 上部通知バナー */}
      {isTimeUpSubmitted && (
        <div className={styles.noticeBanner} data-testid="timeup-notice-banner">
          時間になったので、出したよ
        </div>
      )}
      {!isFinalized && isResumed && !isTimeUpSubmitted && (
        <div className={styles.noticeBanner} data-testid="resumed-notice-banner">
          つづきから見直すよ。
        </div>
      )}

      <main className={styles.mainContent}>
        {/* 2. 点数エリア */}
        <section
          className={styles.scoreCard}
          aria-live="polite"
          data-testid={isFinalized ? 'review-result-area' : 'review-pending-area'}
        >
          {!isFinalized ? (
            /* 状態A: 判定中 */
            <div>
              <div className={styles.pendingScoreLabel}>いまの点数</div>
              <div className={styles.pendingScoreValue} data-testid="pending-score-display">
                {currentScore} 点
              </div>
              <div className={styles.pendingInstruction}>
                記述 あと{remainingOpenCount}問のチェックで、点数が決まるよ
              </div>
              <div
                className={styles.progressBarContainer}
                role="progressbar"
                aria-valuenow={evaluatedOpenCount}
                aria-valuemin={0}
                aria-valuemax={openSlots.length}
                aria-label="記述問題のチェック進捗"
              >
                <div
                  className={styles.progressBarFill}
                  style={{
                    width:
                      openSlots.length > 0
                        ? `${Math.round((evaluatedOpenCount / openSlots.length) * 100)}%`
                        : '100%',
                  }}
                />
              </div>
              <div className={styles.progressText}>
                チェックずみ: {evaluatedOpenCount} / {openSlots.length} 問
              </div>
            </div>
          ) : (
            /* 状態B: 結果 */
            <div>
              {mikeFeedback.badgeTitle && (
                <div className={styles.resultBadge} data-testid="result-badge-title">
                  {mikeFeedback.badgeTitle}
                </div>
              )}
              <div className={styles.resultScoreRow}>
                <span className={styles.resultScoreLarge} data-testid="final-score-display">
                  {currentScore}
                </span>
                <span className={styles.resultScoreUnit}>点</span>
              </div>
              <div className={styles.correctSummaryRow}>
                正解 {correctCount} / {totalQuestions}問
              </div>

              {/* ミケちゃんの一言 */}
              <div className={styles.mikeCard} data-testid="mike-feedback-card">
                <div className={styles.mikeAvatar} aria-hidden="true">
                  🐱
                </div>
                <div className={styles.mikeContent}>
                  <div className={styles.mikeName}>ミケちゃん</div>
                  <p className={styles.mikeMessage}>{mikeFeedback.message}</p>
                </div>
              </div>

              {/* 60点以上のときだけ副ボタン（自動では開かない） */}
              {currentScore >= 60 && onShowCertificate && (
                <button
                  type="button"
                  className={styles.certBtn}
                  onClick={onShowCertificate}
                  data-testid="view-certificate-btn"
                >
                  {APP_TERMS.VIEW_CERTIFICATE}
                </button>
              )}

              {/* 次のごほうびまでの目安 */}
              {mikeFeedback.nextRewardText && (
                <div className={styles.nextRewardNotice} data-testid="next-reward-notice">
                  {mikeFeedback.nextRewardText}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 状態Bかつ「もう少し」が1問以上あるときのみ: 「つぎの一歩」カード */}
        {isFinalized && nextStepRecommendation && (
          <section
            className={styles.nextStepCard}
            aria-labelledby="next-step-heading"
            data-testid="next-step-card"
          >
            <h3 id="next-step-heading" className={styles.nextStepHeading}>
              つぎの一歩
            </h3>
            <p className={styles.nextStepHeadline} data-testid="next-step-headline">
              {nextStepRecommendation.kind === 'skill' && (
                <span className={styles.nextStepIcon} aria-hidden="true">
                  {nextStepRecommendation.patientIcon}{' '}
                </span>
              )}
              <span>{nextStepRecommendation.headlineText}</span>
            </p>
            <div className={styles.nextStepSubtext} data-testid="next-step-subtext">
              {nextStepRecommendation.subText}
            </div>
            <button
              type="button"
              className={styles.nextStepBtn}
              onClick={() => {
                if (nextStepRecommendation.kind === 'skill') {
                  onStartSkillFocus?.(nextStepRecommendation.skillId);
                } else {
                  onOpenSubjectCaseStudy?.(nextStepRecommendation.subject);
                }
              }}
              data-testid="next-step-button"
            >
              {nextStepRecommendation.buttonText}
            </button>
          </section>
        )}

        {/* 状態Bのみ: 「もう少しの問題だけ見る」トグル */}
        {isFinalized && (
          <div className={styles.filterBar}>
            <label className={styles.filterToggleLabel}>
              <input
                type="checkbox"
                className={styles.filterToggleCheckbox}
                checked={filterNeedsWorkOnly}
                onChange={(e) => setFilterNeedsWorkOnly(e.target.checked)}
                data-testid="filter-needs-work-toggle"
              />
              <span>もう少しの問題だけ見る</span>
            </label>
          </div>
        )}

        {/* 3. 見直しリスト */}
        <section className={styles.reviewList} aria-label="問題の見直し一覧">
          {sections.map((sec) => {
            // フィルタ適用
            const visibleSlots = sec.slots.filter((slot: ChallengeSlot) => {
              if (!filterNeedsWorkOnly) return true;
              return !slotJudgments[slot.id]?.isCorrect;
            });

            if (visibleSlots.length === 0) return null;

            return (
              <div key={sec.sectionNumber} className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>
                  大問 {sec.sectionNumber}
                  {sec.title ? `: ${cleanText(sec.title)}` : ''}
                </div>
                <div className={styles.itemsContainer}>
                  {visibleSlots.map((slot: ChallengeSlot) => {
                    const judgment = slotJudgments[slot.id];
                    const userAns = (answers[slot.id] || '').trim();
                    const isOpen = slot.answerType === 'open';

                    if (isOpen) {
                      // 記述問題
                      return (
                        <div
                          key={slot.id}
                          className={styles.reviewRowOpen}
                          data-testid={`review-slot-${slot.id}`}
                        >
                          <div className={styles.openTopColumns}>
                            <div className={styles.colQuestionName}>
                              {cleanText(`大問${slot.section} ${slot.label}`)}
                            </div>
                            <div className={styles.colAnswer}>
                              <span className={styles.colLabelMobile}>あなたの答え: </span>
                              {userAns ? (
                                userAns
                              ) : (
                                <span className={styles.emptyAnswer}>(未入力)</span>
                              )}
                            </div>
                            <div className={styles.colCorrect}>
                              <span className={styles.colLabelMobile}>せいかい: </span>
                              {slot.correctAnswer}
                            </div>
                            <div className={styles.colJudgment}>
                              {judgment?.isEvaluated ? (
                                judgment.isCorrect ? (
                                  <span className={styles.badgeCorrect}>✓ せいかい</span>
                                ) : (
                                  <span className={styles.badgeNeedsWork}>✎ もう少し</span>
                                )
                              ) : (
                                <span className={styles.badgePending} data-testid={`status-pending-${slot.id}`}>
                                  まだ
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ルーブリックチェックボックス */}
                          <div className={styles.rubricBox}>
                            <div className={styles.rubricInstruction}>
                              書けていたらチェックしてね
                            </div>
                            <div className={styles.rubricList}>
                              {slot.rubricItems?.map((item: string, rIdx: number) => {
                                const isChecked = !!rubricChecks[slot.id]?.[rIdx];
                                const isMarkedZero = !!markedZeroSlots[slot.id];
                                const disabled = isFinalized;

                                return (
                                  <label
                                    key={rIdx}
                                    className={`${styles.rubricLabel} ${
                                      disabled ? styles.rubricLabelDisabled : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      id={`rubric-check-${slot.id}-${rIdx}`}
                                      name={`rubric_${slot.id}_${rIdx}`}
                                      className={styles.rubricCheckbox}
                                      checked={!isMarkedZero && isChecked}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        onRubricChange(slot.id, rIdx, e.target.checked);
                                      }}
                                      data-testid={`rubric-check-${slot.id}-${rIdx}`}
                                    />
                                    <span>{formatRubricItem(item)}</span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className={styles.rubricActions}>
                              <button
                                type="button"
                                className={`${styles.noneBtn} ${
                                  markedZeroSlots[slot.id] ? styles.noneBtnActive : ''
                                }`}
                                disabled={isFinalized}
                                onClick={() => onMarkZero(slot.id)}
                                data-testid={`mark-zero-btn-${slot.id}`}
                              >
                                {markedZeroSlots[slot.id]
                                  ? '✓ どれも書けなかった'
                                  : 'どれも書けなかった'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 選択・数値問題
                    return (
                      <div
                        key={slot.id}
                        className={styles.reviewRow}
                        data-testid={`review-slot-${slot.id}`}
                      >
                        <div className={styles.colQuestionName}>
                          {cleanText(`大問${slot.section} ${slot.label}`)}
                        </div>
                        <div className={styles.colAnswer}>
                          <span className={styles.colLabelMobile}>あなたの答え: </span>
                          {userAns ? (
                            userAns
                          ) : (
                            <span className={styles.emptyAnswer}>(未入力)</span>
                          )}
                        </div>
                        <div className={styles.colCorrect}>
                          <span className={styles.colLabelMobile}>せいかい: </span>
                          {slot.correctAnswer}
                        </div>
                        <div className={styles.colJudgment}>
                          {judgment?.isCorrect ? (
                            <span className={styles.badgeCorrect}>✓ せいかい</span>
                          ) : (
                            <span className={styles.badgeNeedsWork}>✎ もう少し</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* 4. 下部固定バー */}
      <footer className={styles.bottomBar}>
        {!isFinalized ? (
          /* 状態A */
          <div className={styles.bottomBarInner}>
            <div className={styles.remainingNotice} data-testid="remaining-notice">
              {remainingOpenCount > 0
                ? `記述 あと${remainingOpenCount}問チェックしてね`
                : 'すべての記述をチェックしたよ！'}
            </div>
            <button
              type="button"
              className={styles.finalizeBtn}
              disabled={!isAllOpenEvaluated}
              onClick={onFinalize}
              data-testid="finalize-review-btn"
            >
              採点を決める
            </button>
          </div>
        ) : (
          /* 状態B */
          <div className={`${styles.bottomBarInner} ${styles.bottomBarInnerSingle}`}>
            <button
              type="button"
              className={styles.homeActionBtn}
              onClick={onGoHome}
              data-testid="review-return-home-btn"
            >
              ホームにもどる
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
