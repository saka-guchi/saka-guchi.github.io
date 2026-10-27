import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type StoredPack } from '../db';
import {
  FINAL_CHALLENGE_SECTIONS,
  TOTAL_PAGES,
} from '../data/final-challenge-data';
import { STAGE1_PAGE_CONTENTS } from '../data/final-challenge-pages';
import { DoctorCertificateModal } from '../components/DoctorCertificateModal';
import styles from './FinalChallengePage.module.css';

export const FinalChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<1 | 2>(1);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60); // 30分
  const [currentPage, setCurrentPage] = useState(1); // p.1 (表紙) から開始
  const [zoom, setZoom] = useState(100);
  const [storedPack, setStoredPack] = useState<StoredPack | null>(null);

  // 回答状態: slotId -> 入力値
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // 記述問題の自己採点用状態: slotId -> [要素インデックスの正誤]
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [rubricChecks, setRubricChecks] = useState<Record<string, Record<number, boolean>>>({});
  const [showCertModal, setShowCertModal] = useState(false);
  const [lastExamResult, setLastExamResult] = useState<{ score: number; passed: boolean } | null>(null);

  // パック読み込み
  useEffect(() => {
    db.contentPacks.toArray().then(packs => {
      if (packs.length > 0) {
        setStoredPack(packs[0]);
      }
    });
  }, []);

  // タイマー
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleInputChange = (slotId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [slotId]: val }));
  };

  // 提出・採点
  const handleSubmitExam = () => {
    setShowScoringModal(true);
  };

  const handleFinalizeScore = async () => {
    // 採点計算
    let correctCount = 0;
    const allSlots = FINAL_CHALLENGE_SECTIONS.flatMap(s => s.slots);
    const questionScores: Record<string, { isCorrect: boolean; userSelfScored?: boolean }> = {};

    for (const slot of allSlots) {
      if (slot.answerType === 'open') {
        // 記述: すべての自己採点要素が「書けた」なら正解
        const checks = rubricChecks[slot.id] || {};
        const totalRubrics = slot.rubricItems?.length || 1;
        const passedRubrics = Object.values(checks).filter(Boolean).length;
        const isOk = passedRubrics === totalRubrics;
        if (isOk) correctCount++;
        questionScores[slot.id] = { isCorrect: isOk, userSelfScored: true };
      } else {
        // 語句・選択・数値: 一致判定
        const userAns = (answers[slot.id] || '').trim();
        const expected = (stage === 1 ? slot.correctAnswer : slot.stage2CorrectAnswer || slot.correctAnswer).trim();
        const isOk = userAns.toLowerCase() === expected.toLowerCase();
        if (isOk) correctCount++;
        questionScores[slot.id] = { isCorrect: isOk, userSelfScored: false };
      }
    }

    const totalQuestions = allSlots.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;

    await db.finalChallengeResults.add({
      examId: storedPack?.examId || 'yasuda-2024',
      stage,
      timestamp: Date.now(),
      score,
      totalScore: 100,
      passed,
      questionScores,
    });

    setShowScoringModal(false);
    setLastExamResult({ score, passed });

    if (passed) {
      // 合格・満点時は合格ドクター認定証を堂々授与！
      setShowCertModal(true);
    } else {
      alert(
        `【採点完了】\n得点: ${score} 点 (${correctCount} / ${totalQuestions} 問正解)\n判定: 不合格（もう一度復習して挑戦しましょう！）`
      );
      navigate('/');
    }
  };

  // 現在ページの画像（インポート済みの場合）
  const pageImageKey = `images/pages/rika/mondai_p00${currentPage}.webp`;
  const pageImageAltKey = `images/pages/rika/mondai_p00${currentPage}.png`;
  const pageImageData =
    storedPack?.images?.[pageImageKey] || storedPack?.images?.[pageImageAltKey];

  const currentPageContent = STAGE1_PAGE_CONTENTS[currentPage];

  return (
    <div className={styles.container} data-testid="final-challenge-page">
      <header className={styles.header}>
        <button
          className={styles.iconBtn}
          onClick={() => navigate('/')}
          aria-label="戻る"
          data-testid="challenge-back-btn"
        >
          ←
        </button>

        <div className={styles.timerBadge} data-testid="challenge-timer">
          ⏱ 残り時間: {formatTime(timeLeftSeconds)}
        </div>

        <div className={styles.stageTabs}>
          <button
            className={`${styles.stageTab} ${stage === 1 ? styles.activeTab : ''}`}
            onClick={() => setStage(1)}
            data-testid="stage-1-tab"
          >
            Stage 1（元過去問）
          </button>
          <button
            className={`${styles.stageTab} ${stage === 2 ? styles.activeTab : ''}`}
            onClick={() => setStage(2)}
            data-testid="stage-2-tab"
          >
            Stage 2（同等未見問題）
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* 左: 問題ページビューア */}
        <section className={styles.pdfArea} data-testid="challenge-pdf-area">
          <div className={styles.pdfControls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span data-testid="page-indicator">
                ページ: {currentPage} / {TOTAL_PAGES}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                data-testid="prev-page-btn"
              >
                ◀ 前のページ
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(TOTAL_PAGES, p + 1))}
                disabled={currentPage >= TOTAL_PAGES}
                data-testid="next-page-btn"
              >
                次のページ ▶
              </button>
            </div>

            {/* ズーム操作 */}
            <div className={styles.zoomControls}>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(z => Math.max(70, z - 15))}
                title="縮小"
              >
                🔍 -
              </button>
              <span style={{ fontSize: '13px', minWidth: '42px', textAlign: 'center' }}>
                {zoom}%
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(z => Math.min(180, z + 15))}
                title="拡大"
              >
                🔍 +
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setZoom(100)}
                style={{ fontSize: '12px' }}
              >
                100%
              </button>
            </div>
          </div>

          <div className={styles.pageWrapper}>
            {stage === 1 ? (
              pageImageData ? (
                /* 画像がある場合は実ページ画像を表示（第13章仕様: 元のページ画像をそのまま表示し、拡大できる） */
                <img
                  src={pageImageData}
                  alt={`問題用紙 p.${currentPage}`}
                  className={styles.pageImage}
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                  data-testid="exam-page-image"
                />
              ) : (
                /* 画像未インポート時の完全テキスト・図表・設問表示 */
                <div
                  className={styles.samplePdfMock}
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      marginBottom: '12px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid var(--primary-weak)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--primary)',
                    }}
                  >
                    <span>
                      📐 <strong>図表付き問題用紙モード</strong>（原本スキャンの代わりに鮮明な図表を表示しています）
                    </span>
                    <button
                      onClick={() => navigate('/settings')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                      }}
                    >
                      教材パックインポート
                    </button>
                  </div>
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
                        borderBottom: '2px solid var(--primary)',
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
                          <h4 style={{ color: 'var(--primary)', marginBottom: '6px' }}>
                            {sec.sectionTitle}
                          </h4>
                        )}
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text)' }}>
                          {sec.bodyText}
                        </p>

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
                            {sec.questions.map(q => (
                              <div
                                key={q.qNum}
                                style={{
                                  padding: '12px 14px',
                                  background: 'var(--surface-subtle)',
                                  borderRadius: '6px',
                                  borderLeft: '4px solid var(--primary)',
                                }}
                              >
                                <strong>【{q.qNum}】</strong>
                                <p style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{q.prompt}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* Stage 2 (同等未見問題) の表示 */
              <div
                className={styles.samplePdfMock}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
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
                    Stage 2：同等未見問題セット（人による確認済み）
                  </div>
                  <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
                    {currentPage === 1 && 'Stage 2 試験表紙'}
                    {currentPage === 2 && '大問【1】 エンドウの根と茎・葉脈の観察（同等未見問題）'}
                    {currentPage === 3 && '大問【2】 気体の発生と性質（同等未見問題・前半）'}
                    {currentPage === 4 && '大問【2】 炭素循環と環境変化（同等未見問題・後半）'}
                    {currentPage === 5 && '大問【3】 浮力の測定実験（同等未見問題・前半）'}
                    {currentPage === 6 && '大問【3】 ガリレオ温度計の仕組み（同等未見問題・後半）'}
                    {currentPage >= 7 && '見直しページ'}
                  </h3>

                  {currentPage === 1 && (
                    <div style={{ marginTop: '20px', lineHeight: '2' }}>
                      <p>
                        本テストは、2024年度過去問と<strong>Skill構成・難易度・問われ方が同等</strong>で、題材や数値を変更した<strong>未見問題セット</strong>です。
                      </p>
                      <p>
                        右側の解答用紙にすべての答えを記入してください。満点を達成すると「Master (M6)」に認定されます。
                      </p>
                    </div>
                  )}

                  {currentPage >= 2 && currentPage <= 6 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {FINAL_CHALLENGE_SECTIONS.flatMap(s => s.slots)
                        .filter(slot => slot.pageNumber === currentPage)
                        .map(slot => (
                          <div
                            key={slot.id}
                            style={{
                              padding: '14px',
                              background: 'var(--surface-subtle)',
                              borderRadius: '8px',
                              borderLeft: '4px solid var(--primary)',
                            }}
                          >
                            <strong style={{ color: 'var(--primary)' }}>【{slot.label}】</strong>
                            <p style={{ marginTop: '6px', lineHeight: '1.7' }}>
                              {slot.stage2Prompt || '同等難易度で更新した未見問題です。'}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 右: 解答用紙（設問番号順・大問ごとの構造化） */}
        <section className={styles.sheetArea} data-testid="challenge-answer-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ font: 'var(--font-heading)', margin: 0 }}>解答用紙</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>
              全 {FINAL_CHALLENGE_SECTIONS.flatMap(s => s.slots).length} 欄
            </span>
          </div>

          <div className={styles.slotList}>
            {FINAL_CHALLENGE_SECTIONS.map(sec => (
              <div key={sec.sectionNumber} className={styles.sectionGroup}>
                <div className={styles.sectionHeader}>{sec.title} ({sec.pageRange})</div>

                {/* 問1のような小問集合はスッキリ並べる */}
                {sec.sectionNumber === 1 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>問1</div>
                    <div className={styles.subSlotGrid}>
                      {sec.slots.filter(s => s.questionNumber === '1').map(slot => (
                        <div key={slot.id} className={styles.slotItem}>
                          <label style={{ fontWeight: 'bold' }}>[{slot.partNumber}]</label>
                          <input
                            type="text"
                            placeholder="語句を入力"
                            className={styles.textInput}
                            value={answers[slot.id] || ''}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* その他の設問 */}
                {sec.slots
                  .filter(s => !(sec.sectionNumber === 1 && s.questionNumber === '1'))
                  .map(slot => (
                    <div key={slot.id} className={styles.slotItem} style={{ marginBottom: '10px' }}>
                      <label style={{ fontWeight: 'bold' }}>{slot.label}:</label>

                      {slot.answerType === 'open' ? (
                        <textarea
                          placeholder="ノートや紙に記述後、提出時に自己採点要素を確認します"
                          className={styles.textArea}
                          value={answers[slot.id] || ''}
                          onChange={e => handleInputChange(slot.id, e.target.value)}
                          data-testid={`slot-${slot.id}`}
                        />
                      ) : slot.answerType === 'numeric' ? (
                        <input
                          type="number"
                          placeholder="数値を入力"
                          className={styles.textInput}
                          value={answers[slot.id] || ''}
                          onChange={e => handleInputChange(slot.id, e.target.value)}
                          data-testid={`slot-${slot.id}`}
                        />
                      ) : slot.options ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            placeholder="記号（例: ア、または ①、③）"
                            className={styles.textInput}
                            value={answers[slot.id] || ''}
                            onChange={e => handleInputChange(slot.id, e.target.value)}
                            data-testid={`slot-${slot.id}`}
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                            選択肢: {slot.options.join(' / ')}
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="語句を入力"
                          className={styles.textInput}
                          value={answers[slot.id] || ''}
                          onChange={e => handleInputChange(slot.id, e.target.value)}
                          data-testid={`slot-${slot.id}`}
                        />
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <button
            className={styles.submitExamBtn}
            onClick={handleSubmitExam}
            data-testid="submit-exam-btn"
          >
            解答を提出して採点する
          </button>
        </section>
      </main>

      {/* 提出後の記述問題自己採点モーダル */}
      {showScoringModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          data-testid="scoring-modal"
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <h2 style={{ font: 'var(--font-heading)', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
              記述問題の自己判定（第13章仕様）
            </h2>
            <p style={{ color: 'var(--text-subtle)', marginTop: '8px', fontSize: '14px' }}>
              紙やノートに書いた解答と模範解答を見比べ、要素ごとに「書けた／書けなかった」を選択してください。すべての要素を満たしている場合に正解となります。
            </p>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {FINAL_CHALLENGE_SECTIONS.flatMap(s => s.slots)
                .filter(s => s.answerType === 'open')
                .map(slot => (
                  <div
                    key={slot.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px',
                      background: 'var(--surface-subtle)',
                    }}
                  >
                    <strong>【{slot.label}】</strong>
                    <div style={{ marginTop: '6px', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>模範解答：</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        {slot.correctAnswer}
                      </span>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>採点基準（要素）：</div>
                      {slot.rubricItems?.map((rubric, rIdx) => (
                        <label
                          key={rIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!rubricChecks[slot.id]?.[rIdx]}
                            onChange={e => {
                              const checked = e.target.checked;
                              setRubricChecks(prev => ({
                                ...prev,
                                [slot.id]: {
                                  ...(prev[slot.id] || {}),
                                  [rIdx]: checked,
                                },
                              }));
                            }}
                          />
                          <span>{rubric}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className={styles.pageBtn}
                onClick={() => setShowScoringModal(false)}
              >
                解答に戻る
              </button>
              <button
                className={styles.submitExamBtn}
                style={{ marginTop: 0, padding: '0 24px' }}
                onClick={handleFinalizeScore}
                data-testid="finalize-score-btn"
              >
                採点を確定して結果を見る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 合格ドクター認定証授与モーダル */}
      {showCertModal && (
        <DoctorCertificateModal
          onClose={() => {
            setShowCertModal(false);
            navigate('/');
          }}
          examTitle={stage === 1 ? '2024年度 理科 過去問' : 'Stage 2 理科 同等未見問題'}
          isPerfectScore={lastExamResult?.score === 100}
        />
      )}
    </div>
  );
};
