import React from 'react';
import type { Subject } from '../../types';
import type { ChallengeSection } from '../../data/final-challenge-data';
import type { PageContent } from '../../data/final-challenge-pages';
import { ENABLE_TEXT_VIEW } from '../../utils/final-challenge-storage';
import { sound } from '../../utils/sound-effects';
import styles from '../../pages/FinalChallengePage.module.css';

export interface ExamProblemViewerProps {
  stage?: 1 | 2;
  currentYear: number;
  currentSubject: Subject;
  currentSubjectLabel: string;
  currentPage: number;
  currentTotalPages: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  pageLayout: 'single' | 'spread';
  onPageLayoutChange: (layout: 'single' | 'spread') => void;
  scanZoom: number;
  onScanZoomChange: React.Dispatch<React.SetStateAction<number>>;
  viewMode: 'text' | 'image';
  onViewModeChange?: (mode: 'text' | 'image') => void;
  pageImageData: string | null;
  nextPageImageData: string | null;
  currentPageContent?: PageContent;
  currentSections: ChallengeSection[];
  className?: string;
}

export const ExamProblemViewer: React.FC<ExamProblemViewerProps> = ({
  stage = 1,
  currentYear,
  currentSubject,
  currentSubjectLabel,
  currentPage,
  currentTotalPages,
  onPageChange,
  pageLayout,
  onPageLayoutChange,
  scanZoom,
  onScanZoomChange,
  viewMode: rawViewMode,
  onViewModeChange,
  pageImageData,
  nextPageImageData,
  currentPageContent,
  currentSections,
  className,
}) => {
  const viewMode: 'text' | 'image' = ENABLE_TEXT_VIEW ? rawViewMode : 'image';

  return (
    <section
      className={`${styles.pdfArea} ${className || ''}`.trim()}
      data-testid="challenge-pdf-area"
    >
      <div className={styles.pdfControls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span data-testid="page-indicator">
            ページ: {pageLayout === 'spread' && nextPageImageData ? `${currentPage}-${currentPage + 1}` : currentPage} / {currentTotalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(p => Math.max(1, pageLayout === 'spread' ? p - 2 : p - 1))}
            disabled={currentPage <= 1}
            data-testid="prev-page-btn"
            title={pageLayout === 'spread' ? '前の見開きへ' : '前のページへ'}
          >
            ◀ 前の{pageLayout === 'spread' ? '見開き' : 'ページ'}
          </button>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(p => Math.min(currentTotalPages, pageLayout === 'spread' ? p + 2 : p + 1))}
            disabled={pageLayout === 'spread' ? currentPage >= currentTotalPages || currentPage + 1 >= currentTotalPages : currentPage >= currentTotalPages}
            data-testid="next-page-btn"
            title={pageLayout === 'spread' ? '次の見開きへ' : '次のページへ'}
          >
            次の{pageLayout === 'spread' ? '見開き' : 'ページ'} ▶
          </button>
        </div>

        {/* 単ページ / 見開き（2ページ）切り替えボタン */}
        {stage === 1 && viewMode === 'image' && pageImageData && (
          <div style={{ display: 'flex', gap: '2px', background: 'var(--surface-subtle)', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              className={`${styles.pageBtn} ${pageLayout === 'single' ? styles.activeTab : ''}`}
              onClick={() => {
                sound.playPop();
                onPageLayoutChange('single');
              }}
              data-testid="layout-single-btn"
              title="1ページ単独表示"
              style={{ fontSize: '11px', padding: '3px 8px', background: pageLayout === 'single' ? '#DBEAFE' : 'transparent' }}
            >
              📄 1ページ
            </button>
            <button
              type="button"
              className={`${styles.pageBtn} ${pageLayout === 'spread' ? styles.activeTab : ''}`}
              onClick={() => {
                sound.playPop();
                onPageLayoutChange('spread');
              }}
              data-testid="layout-spread-btn"
              title="左右見開き（2ページ並び）で表示"
              style={{ fontSize: '11px', padding: '3px 8px', background: pageLayout === 'spread' ? '#DBEAFE' : 'transparent' }}
            >
              📖 見開き
            </button>
          </div>
        )}

        {/* 原本スキャン時のズーム操作（初期はウィンドウに収まる全体表示Fit、必要な時に拡大） */}
        {stage === 1 && viewMode === 'image' && pageImageData && (
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onScanZoomChange(z => Math.max(100, z - 20))}
              disabled={scanZoom <= 100}
              title="縮小"
            >
              🔍 -
            </button>
            <span style={{ fontSize: '13px', minWidth: '42px', textAlign: 'center' }}>
              {scanZoom === 100 ? '全体' : `${scanZoom}%`}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onScanZoomChange(z => Math.min(200, z + 20))}
              disabled={scanZoom >= 200}
              title="拡大"
            >
              🔍 +
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onScanZoomChange(100)}
              style={{ fontSize: '12px' }}
              title="ウィンドウに収まる全体サイズに戻す"
            >
              全体表示
            </button>
          </div>
        )}

        {ENABLE_TEXT_VIEW && stage === 1 && pageImageData && (
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button
              type="button"
              className={`${styles.pageBtn} ${viewMode === 'text' ? styles.activeTab : ''}`}
              onClick={() => onViewModeChange?.('text')}
              style={{ fontSize: '12px', background: viewMode === 'text' ? '#DBEAFE' : undefined }}
            >
              📐 テキスト・図表
            </button>
            <button
              type="button"
              className={`${styles.pageBtn} ${viewMode === 'image' ? styles.activeTab : ''}`}
              onClick={() => onViewModeChange?.('image')}
              style={{ fontSize: '12px', background: viewMode === 'image' ? '#DBEAFE' : undefined }}
            >
              📸 原本スキャン
            </button>
          </div>
        )}

        {stage === 2 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--primary)',
                background: 'var(--primary-weak)',
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              ✨ 同等未見問題モード（オリジナル出題）
            </span>
          </div>
        )}
      </div>

      <div className={styles.pageWrapper}>
        {stage === 1 ? (
          viewMode === 'image' && pageImageData ? (
            pageLayout === 'spread' ? (() => {
              // 国語は縦書き冊子・右開き（右から左へめくる）のため、左にP(n+1)・右にP(n)を配置
              // 理科・算数・社会は横書き冊子・左開きのため、左にP(n)・右にP(n+1)を配置
              const isRtlBook = currentSubject === 'kokugo';
              const leftPageNum = isRtlBook ? (nextPageImageData ? currentPage + 1 : null) : currentPage;
              const leftPageData = isRtlBook ? nextPageImageData : pageImageData;
              const rightPageNum = isRtlBook ? currentPage : (nextPageImageData ? currentPage + 1 : null);
              const rightPageData = isRtlBook ? pageImageData : nextPageImageData;

              return (
                /* 左右見開き（2ページ並び）表示（ウィンドウ内に美しくフィット） */
                <div
                  className={styles.scanSpreadContainer}
                  style={{
                    alignItems: scanZoom > 100 ? 'flex-start' : 'center',
                  }}
                  data-testid="scan-spread-container"
                >
                  {/* 左ページ */}
                  {leftPageData && leftPageNum !== null && (
                    <div className={styles.spreadPageCol}>
                      <span className={styles.spreadPageLabel}>p.{leftPageNum}</span>
                      <img
                        src={leftPageData}
                        alt={`問題用紙 p.${leftPageNum}`}
                        className={styles.spreadPageImage}
                        style={{
                          transform: scanZoom > 100 ? `scale(${scanZoom / 100})` : undefined,
                          transformOrigin: 'top center',
                          maxWidth: scanZoom > 100 ? 'none' : '100%',
                          maxHeight: scanZoom > 100 ? 'none' : 'calc(100% - 22px)',
                        }}
                        data-testid="exam-page-image-left"
                      />
                    </div>
                  )}

                  {/* 右ページ */}
                  {rightPageData && rightPageNum !== null && (
                    <div className={styles.spreadPageCol}>
                      <span className={styles.spreadPageLabel}>p.{rightPageNum}</span>
                      <img
                        src={rightPageData}
                        alt={`問題用紙 p.${rightPageNum}`}
                        className={styles.spreadPageImage}
                        style={{
                          transform: scanZoom > 100 ? `scale(${scanZoom / 100})` : undefined,
                          transformOrigin: 'top center',
                          maxWidth: scanZoom > 100 ? 'none' : '100%',
                          maxHeight: scanZoom > 100 ? 'none' : 'calc(100% - 22px)',
                        }}
                        data-testid="exam-page-image-right"
                      />
                    </div>
                  )}
                </div>
              );
            })() : (
              /* 単一ページ表示（初期状態はウィンドウ内に収まる全体表示Fit、スクロールバーなし） */
              <div
                className={styles.scanImageContainer}
                style={{
                  alignItems: scanZoom > 100 ? 'flex-start' : 'center',
                }}
              >
                <img
                  src={pageImageData}
                  alt={`問題用紙 p.${currentPage}`}
                  className={styles.pageImage}
                  style={{
                    transform: scanZoom > 100 ? `scale(${scanZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    maxWidth: scanZoom > 100 ? 'none' : '100%',
                    maxHeight: scanZoom > 100 ? 'none' : '100%',
                    width: scanZoom > 100 ? `${scanZoom}%` : 'auto',
                  }}
                  data-testid="exam-page-image"
                />
              </div>
            )
          ) : (
            /* テキスト・図表・設問表示（ズーム影響を受けず常に標準サイズで快適に閲覧可能） */
            <div className={styles.samplePdfMock}>
              <div
                style={{
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  minHeight: '520px',
                }}
              >
                <h3
                  style={{
                    borderBottom: `2px solid ${currentSubject === 'kokugo' ? '#e11d48' : 'var(--primary)'}`,
                    paddingBottom: '8px',
                    color: 'var(--text)',
                  }}
                >
                  {currentPageContent?.title || `問題用紙 (p.${currentPage})`}
                </h3>
                {currentPageContent?.subTitle && (
                  <p style={{ color: 'var(--text-subtle)', marginTop: '4px' }}>
                    {currentPageContent.subTitle}
                  </p>
                )}

                {currentPageContent?.sections.map((sec, sIdx) => (
                  <div key={sIdx} style={{ marginTop: '18px' }}>
                    {sec.sectionTitle && (
                      <h4 style={{ color: currentSubject === 'kokugo' ? '#be123c' : 'var(--primary)', marginBottom: '6px' }}>
                        {sec.sectionTitle}
                      </h4>
                    )}
                    {currentSubject === 'kokugo' && (sec.bodyText.includes('<mark') || sec.bodyText.includes('<u') || sec.bodyText.includes('<span')) ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: sec.bodyText }}
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.8',
                          color: 'var(--text)',
                          letterSpacing: '0.04em',
                        }}
                      />
                    ) : (
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text)' }}>
                        {sec.bodyText}
                      </p>
                    )}

                    {sec.figures && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          flexWrap: 'wrap',
                          margin: '16px 0',
                          justifyContent: 'center',
                        }}
                        data-testid="page-figures-container"
                      >
                        {sec.figures.map(fig => (
                          <div
                            key={fig.id}
                            style={{
                              border: '1.5px solid var(--border)',
                              borderRadius: '12px',
                              padding: '14px',
                              background: 'var(--surface-subtle)',
                              maxWidth: '340px',
                              width: '100%',
                              textAlign: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            }}
                            data-testid={`exam-figure-${fig.id}`}
                          >
                            <div
                              dangerouslySetInnerHTML={{ __html: fig.svg }}
                              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                            />
                            <div
                              style={{
                                marginTop: '8px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: 'var(--text)',
                              }}
                            >
                              {fig.caption}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sec.questions && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {sec.questions.map(q => {
                          const choicesToDisplay = (q.choices && q.choices.length > 0)
                            ? q.choices
                            : currentSections
                                .flatMap(s => s.slots)
                                .find(slot => slot.pageNumber === currentPage && (slot.label.includes(q.qNum) || slot.questionNumber === q.qNum.replace(/[^0-9]/g, '')))?.options;

                          return (
                            <div
                              key={q.qNum}
                              style={{
                                padding: '14px 16px',
                                background: 'var(--surface-subtle)',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--primary)',
                              }}
                              data-testid={`question-card-${q.qNum}`}
                            >
                              <strong style={{ fontSize: '15px', color: 'var(--text)' }}>【{q.qNum}】</strong>
                              <p style={{ whiteSpace: 'pre-wrap', marginTop: '6px', lineHeight: '1.7', fontSize: '15px' }}>{q.prompt}</p>

                              {choicesToDisplay && choicesToDisplay.length > 0 && (
                                <div
                                  style={{
                                    marginTop: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                  }}
                                  data-testid={`question-choices-${q.qNum}`}
                                >
                                  {choicesToDisplay.map((choiceText, cIdx) => (
                                    <div
                                      key={cIdx}
                                      style={{
                                        padding: '10px 14px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        color: 'var(--text)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                      }}
                                    >
                                      {choiceText}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Stage 2 (同等未見問題) の表示 */
          <div className={styles.samplePdfMock}>
            <div
              style={{
                padding: '24px',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                minHeight: '520px',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: 'var(--primary-weak)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}
              >
                Stage 2：同等未見問題（人による確認済み）
              </div>
              <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
                {currentPage === 1 && `Stage 2 ${currentSubjectLabel} 試験表紙`}
                {currentPage > 1 && (currentPageContent?.title || `問題用紙 (p.${currentPage})`)}
              </h3>

              {currentPage === 1 && (
                <div style={{ marginTop: '20px', lineHeight: '2' }}>
                  <p>
                    本テストは、{currentYear}年度過去問（{currentSubjectLabel}）と<strong>Skill構成・難易度・問われ方が同等</strong>で、題材や数値を変更した<strong>同等未見問題</strong>です。
                  </p>
                  <p>
                    右側の解答用紙にすべての答えを記入してください。80点以上で合格、満点を達成すると「Master (M6)」に認定されます。
                  </p>
                </div>
              )}

              {currentPage > 1 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {currentSections.flatMap(s => s.slots)
                    .filter(slot => slot.pageNumber === currentPage)
                    .map(slot => {
                      const activeOptions = slot.stage2Options || slot.options;
                      return (
                        <div
                          key={slot.id}
                          style={{
                            padding: '14px',
                            background: 'var(--surface-subtle)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--primary)',
                          }}
                          data-testid={`stage2-card-${slot.id}`}
                        >
                          <strong style={{ color: 'var(--primary)' }}>【大問{slot.section} {slot.label}】</strong>
                          <p style={{ marginTop: '6px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {slot.stage2Prompt || '同等難易度で更新した未見問題です。'}
                          </p>
                          {activeOptions && activeOptions.length > 0 && (
                            <div
                              style={{
                                marginTop: '10px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '8px',
                              }}
                              data-testid={`stage2-options-${slot.id}`}
                            >
                              {activeOptions.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  style={{
                                    padding: '8px 12px',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    lineHeight: '1.4',
                                    color: 'var(--text)',
                                  }}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

