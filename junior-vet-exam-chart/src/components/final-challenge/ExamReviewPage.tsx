import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT,
  type ExamYear,
  type ChallengeSection,
  type ChallengeSlot,
} from '../../data/final-challenge-data';
import {
  STAGE1_PAGE_CONTENTS,
  STAGE1_PAGE_CONTENTS_BY_SUBJECT,
  STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT,
  type PageContent,
} from '../../data/final-challenge-pages';
import type { Subject } from '../../types';
import {
  getMikeFeedback,
  formatRubricItem,
  selectNextStepRecommendation,
  formatReviewSectionHeading,
  formatReviewSlotLabel,
} from '../../utils/exam-review-helper';
import { APP_TERMS } from '../../constants/terms';
import { sound } from '../../utils/sound-effects';
import { ExamProblemViewer } from './ExamProblemViewer';
import { getExamScanImageUrl, getExamScanPageCount } from '../../utils/exam-scan-helper';
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
  // 左側問題表示用の連携props（親から渡されない単体テスト時も内部状態で安全に動作）
  currentPage?: number;
  totalPages?: number;
  onPageChange?: React.Dispatch<React.SetStateAction<number>>;
  pageLayout?: 'single' | 'spread';
  onPageLayoutChange?: (layout: 'single' | 'spread') => void;
  scanZoom?: number;
  onScanZoomChange?: React.Dispatch<React.SetStateAction<number>>;
  viewMode?: 'text' | 'image';
  onViewModeChange?: (mode: 'text' | 'image') => void;
  getPageImageUrl?: (pageNumber: number) => string | null;
  pageContents?: Record<number, PageContent>;
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
  currentPage: controlledPage,
  totalPages: controlledTotalPages,
  onPageChange: controlledOnPageChange,
  pageLayout: controlledPageLayout,
  onPageLayoutChange: controlledOnPageLayoutChange,
  scanZoom: controlledScanZoom,
  onScanZoomChange: controlledOnScanZoomChange,
  viewMode: controlledViewMode,
  onViewModeChange: controlledOnViewModeChange,
  getPageImageUrl: controlledGetPageImageUrl,
  pageContents: controlledPageContents,
}) => {
  const [filterNeedsWorkOnly, setFilterNeedsWorkOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 左側ビューアのフォールバック状態（単体レンダリング時にも動作保証）
  const [internalPage, setInternalPage] = useState(1);
  const [internalLayout, setInternalLayout] = useState<'single' | 'spread'>('single');
  const [internalZoom, setInternalZoom] = useState(100);
  const [internalViewMode, setInternalViewMode] = useState<'text' | 'image'>('image');

  // 左側原本ビューアの表示種別（問題原本 vs 模範解答原本）
  const [scanType, setScanType] = useState<'mondai' | 'kaito'>('mondai');

  const activePage = controlledPage ?? internalPage;
  const setActivePage = controlledOnPageChange ?? setInternalPage;
  const activeLayout = controlledPageLayout ?? internalLayout;
  const setActiveLayout = controlledOnPageLayoutChange ?? setInternalLayout;
  const activeZoom = controlledScanZoom ?? internalZoom;
  const setActiveZoom = controlledOnScanZoomChange ?? setInternalZoom;
  const activeViewMode = controlledViewMode ?? internalViewMode;
  const setActiveViewMode = controlledOnViewModeChange ?? setInternalViewMode;

  const handleScanTypeChange = (newType: 'mondai' | 'kaito') => {
    setScanType(newType);
    setActivePage(1);
  };

  const activeTotalPages = useMemo(() => {
    if (scanType === 'kaito') {
      return getExamScanPageCount('kaito', year, subject);
    }
    if (controlledTotalPages && controlledTotalPages > 0) return controlledTotalPages;
    const subData = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[year]?.[subject];
    return subData?.totalPages || 7;
  }, [scanType, year, subject, controlledTotalPages]);

  const resolvePageImageUrl = (pageNumber: number): string | null => {
    if (scanType === 'kaito') {
      return getExamScanImageUrl('kaito', year, subject, pageNumber);
    }
    if (controlledGetPageImageUrl) return controlledGetPageImageUrl(pageNumber);
    return getExamScanImageUrl('mondai', year, subject, pageNumber);
  };

  const activePageContents = useMemo(() => {
    if (controlledPageContents) return controlledPageContents;
    return (
      STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[year]?.[subject] ||
      STAGE1_PAGE_CONTENTS_BY_SUBJECT[subject] ||
      STAGE1_PAGE_CONTENTS
    );
  }, [controlledPageContents, year, subject]);

  // 767px以下（スマホ・狭幅）の判定と原本折りたたみ状態（初期は閉じる）
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 767 : false
  );
  const [isMobileProblemOpen, setIsMobileProblemOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 全スロット一覧
  const allSlots = useMemo<ChallengeSlot[]>(() => {
    return sections.flatMap((s) => s.slots);
  }, [sections]);

  // 記述スロット
  const openSlots = useMemo<ChallengeSlot[]>(() => {
    return allSlots.filter((s) => s.answerType === 'open');
  }, [allSlots]);

  // 各スロットの判定計算（点数計算ロジックは変更しない）
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
        try {
          window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
        } catch {
          /* jsdom */
        }
      }
    }
    prevFinalizedRef.current = isFinalized;
  }, [isFinalized]);

  // 設問ヘッダータップ時に左の問題ページを移動する
  const handleJumpToSlotPage = (pageNumber: number) => {
    sound.playPop();
    const targetPage = Math.max(1, Math.min(activeTotalPages, pageNumber || 1));
    setActivePage(targetPage);
  };

  const pageImageData = resolvePageImageUrl(activePage);
  const nextPageImageData = activePage < activeTotalPages ? resolvePageImageUrl(activePage + 1) : null;
  const currentPageContent = activePageContents[activePage];

  const problemViewerElement = (
    <ExamProblemViewer
      stage={1}
      currentYear={year}
      currentSubject={subject}
      currentSubjectLabel={subjectLabel}
      currentPage={activePage}
      currentTotalPages={activeTotalPages}
      onPageChange={setActivePage}
      pageLayout={activeLayout}
      onPageLayoutChange={setActiveLayout}
      scanZoom={activeZoom}
      onScanZoomChange={setActiveZoom}
      viewMode={activeViewMode}
      onViewModeChange={setActiveViewMode}
      pageImageData={pageImageData}
      nextPageImageData={nextPageImageData}
      currentPageContent={currentPageContent}
      currentSections={sections}
      className={styles.problemViewerPane}
      isReviewMode={true}
      scanType={scanType}
      onScanTypeChange={handleScanTypeChange}
    />
  );

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
            /* 状態A: 判定中（点数は出さず、残り記述チェック案内と枠・背景つき進捗バーのみ） */
            <div>
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

        {/* 3. 状態Bかつ「もう少し」が1問以上あるときのみ: 「つぎの一歩」カード */}
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

        {/* 4. 本体: 2カラム（タブレット768px以上は左:原本 / 右:答え合わせ、767px以下は上:答え合わせ / 下:折りたたみ原本） */}
        <div
          className={isNarrowScreen ? styles.reviewStackedBody : styles.reviewTwoColBody}
          data-testid="review-two-column-body"
        >
          {/* 左カラム: 原本スキャン表示（768px以上のみ左側に常時表示） */}
          {!isNarrowScreen && (
            <div className={styles.leftProblemCol} data-testid="review-left-problem-col">
              {problemViewerElement}
            </div>
          )}

          {/* 右カラム: 答え合わせ（採点用の新規部品） */}
          <section
            className={styles.rightReviewCol}
            aria-label="問題の見直し一覧"
            data-testid="review-answer-column"
          >
            <div className={styles.rightColHeaderBar}>
              <h2 className={styles.rightColTitle}>答え合わせ</h2>
              {/* 状態Bのみ: 「もう少しの問題だけ見る」トグルを右カラム上部に配置 */}
              {isFinalized && (
                <label className={styles.filterToggleLabel}>
                  <input
                    type="checkbox"
                    id="filter-needs-work-toggle"
                    name="filterNeedsWorkOnly"
                    className={styles.filterToggleCheckbox}
                    checked={filterNeedsWorkOnly}
                    onChange={(e) => setFilterNeedsWorkOnly(e.target.checked)}
                    data-testid="filter-needs-work-toggle"
                  />
                  <span>もう少しの問題だけ見る</span>
                </label>
              )}
            </div>

            <div className={styles.reviewList}>
              {sections.map((sec) => {
                // フィルタ適用
                const visibleSlots = sec.slots.filter((slot: ChallengeSlot) => {
                  if (!filterNeedsWorkOnly) return true;
                  return !slotJudgments[slot.id]?.isCorrect;
                });

                if (visibleSlots.length === 0) return null;

                const sectionHeading = formatReviewSectionHeading(sec.sectionNumber, sec.title);
                const sectionLead = sec.leadText ? sec.leadText.trim() : '';

                return (
                  <div key={sec.sectionNumber} className={styles.sectionGroup}>
                    <div
                      className={styles.sectionHeader}
                      data-testid={`review-section-header-${sec.sectionNumber}`}
                    >
                      <div className={styles.sectionTitleText}>{sectionHeading}</div>
                      {sectionLead && (
                        <div
                          className={styles.sectionNoticeText}
                          data-testid={`review-section-notice-${sec.sectionNumber}`}
                        >
                          {sectionLead}
                        </div>
                      )}
                    </div>

                    <div className={styles.itemsContainer}>
                      {visibleSlots.map((slot: ChallengeSlot) => {
                        const judgment = slotJudgments[slot.id];
                        const userAns = (answers[slot.id] || '').trim();
                        const isOpen = slot.answerType === 'open';
                        const shortLabel = formatReviewSlotLabel(slot.label);

                        if (isOpen) {
                          // 記述問題（A案: 1段目ヘッダー＋判定バッジ、2段目あなたの答え・せいかいを上下100%幅で統一、3段目ルーブリック）
                          return (
                            <div
                              key={slot.id}
                              className={styles.reviewRowOpen}
                              data-testid={`review-slot-${slot.id}`}
                            >
                              {/* 1段目: 設問ヘッダー（左）＋ 判定バッジ（右） */}
                              <div className={styles.slotHeaderRow}>
                                <div className={styles.colQuestionName}>
                                  <button
                                    type="button"
                                    className={styles.questionJumpBtn}
                                    onClick={() => handleJumpToSlotPage(slot.pageNumber)}
                                    data-testid={`jump-page-btn-${slot.id}`}
                                    title={`問題用紙 p.${slot.pageNumber} を見る`}
                                  >
                                    <span className={styles.questionShortLabel}>{shortLabel}</span>
                                    <span className={styles.pageJumpLink}>p.{slot.pageNumber}を見る</span>
                                  </button>
                                </div>

                                <div className={styles.colJudgment}>
                                  {judgment?.isEvaluated ? (
                                    judgment.isCorrect ? (
                                      <span className={styles.badgeCorrect}>✓ せいかい</span>
                                    ) : (
                                      <span className={styles.badgeNeedsWork}>✎ もう少し</span>
                                    )
                                  ) : (
                                    <span
                                      className={styles.badgePending}
                                      data-testid={`status-pending-${slot.id}`}
                                    >
                                      まだ
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 2段目: あなたの答え（上）と せいかい（下）を同じ横幅100%・統一サイズで上下配置 */}
                              <div className={styles.answerStack}>
                                <div
                                  className={`${styles.readOnlyAnswerCell} ${styles.readOnlyAnswerCellOpen}`}
                                >
                                  <span className={styles.cellCaption}>あなたの答え</span>
                                  <div className={styles.colAnswer}>
                                    {userAns ? (
                                      userAns
                                    ) : (
                                      <span className={styles.emptyAnswer}>(未入力)</span>
                                    )}
                                  </div>
                                </div>

                                <div
                                  className={`${styles.readOnlyAnswerCell} ${styles.readOnlyAnswerCellCorrect} ${styles.readOnlyAnswerCellOpen}`}
                                >
                                  <span className={styles.cellCaption}>せいかい</span>
                                  <div className={styles.colCorrect}>{slot.correctAnswer}</div>
                                </div>
                              </div>

                              {/* 3段目: ルーブリックチェックボックス */}
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

                        // 選択肢・数値・語句問題（A案: 1段目ヘッダー＋判定バッジ、2段目あなたの答え・せいかいを1行スリムボックスで上下100%幅統一）
                        return (
                          <div
                            key={slot.id}
                            className={styles.reviewRow}
                            data-testid={`review-slot-${slot.id}`}
                          >
                            {/* 1段目: 設問ヘッダー（左）＋ 判定バッジ（右） */}
                            <div className={styles.slotHeaderRow}>
                              <div className={styles.colQuestionName}>
                                <button
                                  type="button"
                                  className={styles.questionJumpBtn}
                                  onClick={() => handleJumpToSlotPage(slot.pageNumber)}
                                  data-testid={`jump-page-btn-${slot.id}`}
                                  title={`問題用紙 p.${slot.pageNumber} を見る`}
                                >
                                  <span className={styles.questionShortLabel}>{shortLabel}</span>
                                  <span className={styles.pageJumpLink}>p.{slot.pageNumber}を見る</span>
                                </button>
                              </div>

                              <div className={styles.colJudgment}>
                                {judgment?.isCorrect ? (
                                  <span className={styles.badgeCorrect}>✓ せいかい</span>
                                ) : !judgment?.isAnswered ? (
                                  <span
                                    className={styles.badgeUnanswered}
                                    data-testid={`status-unanswered-${slot.id}`}
                                  >
                                    — かいていない
                                  </span>
                                ) : (
                                  <span className={styles.badgeNeedsWork}>✎ もう少し</span>
                                )}
                              </div>
                            </div>

                            {/* 2段目: あなたの答え（上）と せいかい（下）を同じ横幅100%・同サイズのスリムボックスで上下配置 */}
                            <div className={styles.answerStack}>
                              <div
                                className={`${styles.readOnlyAnswerCell} ${styles.readOnlyAnswerCellCompact}`}
                              >
                                <span className={styles.cellCaption}>あなたの答え</span>
                                <div className={styles.colAnswer}>
                                  {userAns ? (
                                    userAns
                                  ) : (
                                    <span className={styles.emptyAnswer}>(未入力)</span>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`${styles.readOnlyAnswerCell} ${styles.readOnlyAnswerCellCorrect} ${styles.readOnlyAnswerCellCompact}`}
                              >
                                <span className={styles.cellCaption}>せいかい</span>
                                <div className={styles.colCorrect}>{slot.correctAnswer}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 767px以下（スマホ）: 下部に原本を折りたたみ配置（初期は閉じる） */}
          {isNarrowScreen && (
            <div
              className={styles.mobileProblemAccordion}
              data-testid="mobile-problem-collapsible"
            >
              <button
                type="button"
                className={styles.mobileProblemToggleBtn}
                aria-expanded={isMobileProblemOpen}
                onClick={() => setIsMobileProblemOpen((prev) => !prev)}
                data-testid="mobile-problem-toggle"
              >
                {isMobileProblemOpen
                  ? '▲ 問題用紙をとじる'
                  : `▼ 問題用紙を見る (p.${activePage})`}
              </button>
              {isMobileProblemOpen && (
                <div
                  className={styles.mobileProblemBody}
                  data-testid="mobile-problem-content"
                >
                  {problemViewerElement}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 5. 下部固定バー */}
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
