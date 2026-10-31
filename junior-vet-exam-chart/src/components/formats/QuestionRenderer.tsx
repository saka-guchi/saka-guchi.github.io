import React, { useState, useEffect, useRef } from 'react';
import type { SampleQuestion } from '../../data/sample-data';
import { getQuestionSource } from '../../utils/source-helper';
import styles from './Formats.module.css';

// --- 左側: 問題エリア（問題文、図表など） ---
export function getFormatBadge(format: string) {
  switch (format) {
    case 'recall_card':
      return {
        label: '一問一答（選択肢なし）',
        className: styles.formatBadgeNoChoice,
        icon: '🚫',
      };
    case 'delayed_choice':
    case 'multiple_choice':
    case 'why_choice':
      return {
        label: '選択問題（4択）',
        className: styles.formatBadgeChoice,
        icon: '📋',
      };
    case 'next_step':
      return {
        label: '手順選択（ステップ）',
        className: styles.formatBadgeChoice,
        icon: '🪜',
      };
    case 'ordering':
      return {
        label: '並べ替え問題',
        className: styles.formatBadgeInteractive,
        icon: '↕',
      };
    case 'matching':
      return {
        label: '組み合わせ問題',
        className: styles.formatBadgeInteractive,
        icon: '🔗',
      };
    case 'numeric_answer':
      return {
        label: '数字入力問題',
        className: styles.formatBadgeInteractive,
        icon: '🔢',
      };
    case 'diagram_touch':
      return {
        label: '図表タップ問題',
        className: styles.formatBadgeInteractive,
        icon: '👆',
      };
    case 'self_check':
      return {
        label: '紙で解く自己採点',
        className: styles.formatBadgeNoChoice,
        icon: '📝',
      };
    default:
      return {
        label: '問題',
        className: styles.formatBadgeChoice,
        icon: '❓',
      };
  }
}

interface QuestionPromptViewProps {
  question: SampleQuestion;
  selectedRegion?: string | null;
  onRegionSelect?: (regionId: string) => void;
  answered?: boolean;
}

export const QuestionPromptView: React.FC<QuestionPromptViewProps> = ({
  question,
  selectedRegion,
  onRegionSelect,
  answered,
}) => {
  const badgeInfo = getFormatBadge(question.format);
  const sourceText = getQuestionSource(question);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG 内のタップ可能要素にイベントリスナーを登録
  useEffect(() => {
    if (question.format !== 'diagram_touch' || !containerRef.current) return;
    const container = containerRef.current;
    const clickableElements = container.querySelectorAll<SVGElement>('[data-region-id]');

    const handleClick = (e: Event) => {
      if (answered) return;
      const target = e.currentTarget as SVGElement;
      const regionId = target.getAttribute('data-region-id');
      if (regionId && onRegionSelect) {
        onRegionSelect(regionId);
      }
    };

    clickableElements.forEach(el => {
      el.style.cursor = answered ? 'default' : 'pointer';
      el.addEventListener('click', handleClick);
    });

    return () => {
      clickableElements.forEach(el => {
        el.removeEventListener('click', handleClick);
      });
    };
  }, [question.format, question.data?.imageSvg, onRegionSelect, answered]);

  // 選択中・回答後のハイライトスタイル適用
  useEffect(() => {
    if (question.format !== 'diagram_touch' || !containerRef.current) return;
    const container = containerRef.current;
    const clickableElements = container.querySelectorAll<SVGElement>('[data-region-id]');

    clickableElements.forEach(el => {
      const regionId = el.getAttribute('data-region-id');
      const isSelected = regionId === selectedRegion;
      const isCorrectRegion = regionId === question.correctAnswer;

      if (answered) {
        if (isCorrectRegion) {
          el.style.filter = 'drop-shadow(0 0 10px #16a34a)';
          el.style.opacity = '1';
        } else if (isSelected && !isCorrectRegion) {
          el.style.filter = 'drop-shadow(0 0 10px #dc2626)';
          el.style.opacity = '1';
        } else {
          el.style.filter = 'none';
          el.style.opacity = '0.4';
        }
      } else {
        if (isSelected) {
          el.style.filter = 'drop-shadow(0 0 10px #2563eb)';
          el.style.opacity = '1';
        } else {
          el.style.filter = 'none';
          el.style.opacity = '1';
        }
      }
    });
  }, [question.format, selectedRegion, answered, question.correctAnswer]);

  return (
    <div className={styles.promptCard} data-testid="question-prompt-card">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span
          className={styles.sourceTag}
          data-testid="question-source-tag"
          title={`この問題の出題元: ${sourceText}`}
        >
          🏫 {sourceText}
        </span>
        <span className={styles.categoryTag}>{question.category}</span>
        <span
          className={`${styles.formatBadge} ${badgeInfo.className}`}
          data-testid="question-format-badge"
        >
          {badgeInfo.icon} {badgeInfo.label}
        </span>
      </div>
      <div className={styles.promptText}>{question.prompt}</div>

      {/* 図表やSVGがある場合は問題エリアに表示 */}
      {question.format === 'diagram_touch' && question.data?.imageSvg && (
        <div
          ref={containerRef}
          style={{ width: '100%', height: '300px', marginTop: '16px' }}
          dangerouslySetInnerHTML={{ __html: question.data.imageSvg }}
          data-testid="diagram-touch-container"
        />
      )}
    </div>
  );
};

// --- 右側: 回答エリア（選択肢、並べ替えカード、キーパッドなど） ---
export interface ActionState {
  label: string;
  ready: boolean;
  onAction: () => void;
}

interface AnswerAreaViewProps {
  question: SampleQuestion;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  answered: boolean;
  userAnswer: any;
  onSubmitActionRef?: React.MutableRefObject<(() => void) | null>;
  onActionStateChange?: (state: ActionState | null) => void;
  selectedRegion?: string | null;
  onRegionSelect?: (regionId: string) => void;
}

export const AnswerAreaView: React.FC<AnswerAreaViewProps> = ({
  question,
  onAnswer,
  answered,
  userAnswer,
  onSubmitActionRef,
  onActionStateChange,
  selectedRegion,
  onRegionSelect,
}) => {
  const isStandalone = !onSubmitActionRef && !onActionStateChange;

  // 1. Recall Card
  const [recallRevealed, setRecallRevealed] = useState(false);

  // 6. Ordering
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // 7. Diagram Touch
  const [internalSelectedRegion, setInternalSelectedRegion] = useState<string | null>(null);
  const activeRegion = selectedRegion !== undefined ? selectedRegion : internalSelectedRegion;

  // 8. Matching
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  // 9. Numeric
  const [numericInput, setNumericInput] = useState('');

  // 問題が変わるたびに状態を初期化
  useEffect(() => {
    setRecallRevealed(false);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches({});
    setNumericInput('');
    setInternalSelectedRegion(null);

    if (question.format === 'ordering') {
      // 初期並び順（シャッフルまたは定義順）
      setOrderItems([...(question.data?.items || [])]);
    }
  }, [question.id, question.format]);

  // 選択肢系共通ハンドラ
  const handleChoiceSelect = (choiceId: string) => {
    if (answered) return;
    const isCorrect = choiceId === question.correctAnswer;
    onAnswer(choiceId, isCorrect);
  };

  // Ordering 確定
  const submitOrder = () => {
    if (answered) return;
    const orderIds = orderItems.map(i => i.id);
    const isCorrect = JSON.stringify(orderIds) === JSON.stringify(question.correctAnswer);
    onAnswer(orderIds, isCorrect);
  };

  // Numeric 確定
  const submitNumeric = () => {
    if (answered || !numericInput) return;
    const isCorrect = numericInput.trim() === String(question.correctAnswer).trim();
    onAnswer(numericInput, isCorrect);
  };

  // Diagram Touch 確定
  const submitDiagramTouch = () => {
    if (answered || !activeRegion) return;
    const isCorrect = activeRegion === question.correctAnswer;
    onAnswer(activeRegion, isCorrect);
  };

  // Matching 確定
  const isAllMatched =
    (question.data?.leftItems?.length || 0) > 0 &&
    Object.keys(matches).length === (question.data?.leftItems?.length || 0);

  const submitMatching = () => {
    if (answered || !isAllMatched) return;
    const isCorrect = Object.entries(question.correctAnswer).every(
      ([k, v]) => matches[k] === v
    );
    onAnswer(matches, isCorrect);
  };

  // 外側の「決定」ボタンから呼べるようにref登録および状態通知
  useEffect(() => {
    if (answered) {
      if (onSubmitActionRef) onSubmitActionRef.current = null;
      if (onActionStateChange) onActionStateChange(null);
      return;
    }

    if (question.format === 'ordering') {
      if (onSubmitActionRef) onSubmitActionRef.current = submitOrder;
      if (onActionStateChange) {
        onActionStateChange({
          label: 'この順番で決定',
          ready: true,
          onAction: submitOrder,
        });
      }
    } else if (question.format === 'numeric_answer') {
      const isReady = numericInput.trim().length > 0;
      if (onSubmitActionRef) onSubmitActionRef.current = isReady ? submitNumeric : null;
      if (onActionStateChange) {
        onActionStateChange({
          label: '入力完了',
          ready: isReady,
          onAction: submitNumeric,
        });
      }
    } else if (question.format === 'recall_card') {
      if (!recallRevealed) {
        const reveal = () => setRecallRevealed(true);
        if (onSubmitActionRef) onSubmitActionRef.current = reveal;
        if (onActionStateChange) {
          onActionStateChange({
            label: '答えを確認する',
            ready: true,
            onAction: reveal,
          });
        }
      } else {
        if (onSubmitActionRef) onSubmitActionRef.current = null;
        if (onActionStateChange) onActionStateChange(null);
      }
    } else if (question.format === 'matching') {
      const totalPairs = question.data?.leftItems?.length || 0;
      const matchedCount = Object.keys(matches).length;
      if (onSubmitActionRef) onSubmitActionRef.current = isAllMatched ? submitMatching : null;
      if (onActionStateChange) {
        onActionStateChange({
          label: isAllMatched
            ? 'この組み合わせで決定'
            : `ペアを結びつけてください (${matchedCount}/${totalPairs})`,
          ready: isAllMatched,
          onAction: submitMatching,
        });
      }
    } else if (question.format === 'diagram_touch') {
      const isReady = Boolean(activeRegion);
      if (onSubmitActionRef) onSubmitActionRef.current = isReady ? submitDiagramTouch : null;
      if (onActionStateChange) {
        onActionStateChange({
          label: isReady ? 'この場所で決定' : '図の場所をタップしてください',
          ready: isReady,
          onAction: submitDiagramTouch,
        });
      }
    } else {
      if (onSubmitActionRef) onSubmitActionRef.current = null;
      if (onActionStateChange) onActionStateChange(null);
    }
  }, [
    question.format,
    question.id,
    answered,
    recallRevealed,
    numericInput,
    matches,
    isAllMatched,
    orderItems,
    activeRegion,
  ]);

  // 1. Recall Card
  if (question.format === 'recall_card') {
    return (
      <div className={styles.formatContainer} data-testid="format-recall-card">
        {!recallRevealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#fffbeb',
                border: '2px dashed #f59e0b',
                borderRadius: '12px',
                color: '#92400e',
                fontSize: '13px',
                lineHeight: '1.6',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🚫 この問題は【選択肢がありません】
              </div>
              <div>
                選択肢を待つ必要はありません。頭の中で答えを思い浮かべたら、下の<strong>「答えを確認する」</strong>を押してください。（分からない場合もそのまま押して答えを確認できます）
              </div>
            </div>

            {isStandalone && (
              <button
                className={styles.choiceBtn}
                style={{
                  justifyContent: 'center',
                  width: '100%',
                  fontWeight: 'bold',
                  background: 'var(--primary-weak)',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                }}
                onClick={() => setRecallRevealed(true)}
                data-testid="recall-reveal-btn"
              >
                答えを確認する
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--primary-weak)', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>模範解答：</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>
                {question.correctAnswer}
              </div>
            </div>

            {!answered && (
              <div className={styles.selfCheckGrid}>
                <div style={{ fontSize: '13px', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                  自分の答えと比べて自己判定してください：
                </div>
                <button
                  className={styles.selfCheckBtn}
                  onClick={() => onAnswer('correct', true)}
                  data-testid="recall-correct-btn"
                >
                  正解した（思い出せた）
                </button>
                <button
                  className={styles.selfCheckBtn}
                  onClick={() => onAnswer('almost', false)}
                  data-testid="recall-almost-btn"
                >
                  惜しかった / 少し違った
                </button>
                <button
                  className={styles.selfCheckBtn}
                  onClick={() => onAnswer('wrong', false)}
                  data-testid="recall-wrong-btn"
                >
                  思い出せなかった
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. Delayed Choice / 3. Multiple Choice / 4. Why Choice
  if (
    question.format === 'delayed_choice' ||
    question.format === 'multiple_choice' ||
    question.format === 'why_choice'
  ) {
    return (
      <div className={styles.formatContainer} data-testid={`format-${question.format}`}>
        <div className={styles.choiceList} data-testid="choice-list">
          {question.choices?.map(choice => {
            let extraClass = '';
            let statusBadge = null;
            if (answered) {
              if (choice.isCorrect) {
                extraClass = styles.correct;
                statusBadge = <span className={styles.correctBadge}>✓ 正解</span>;
              } else if (choice.id === userAnswer) {
                extraClass = styles.wrong;
                statusBadge = <span className={styles.wrongBadge}>✕ あなたの解答</span>;
              }
            } else if (choice.id === userAnswer) {
              extraClass = styles.selected;
            }
            return (
              <button
                key={choice.id}
                className={`${styles.choiceBtn} ${extraClass}`}
                onClick={() => handleChoiceSelect(choice.id)}
                disabled={answered}
                data-testid={`choice-btn-${choice.id}`}
              >
                <span className={styles.choiceLabel}>{choice.label}</span>
                <span style={{ flex: 1 }}>{choice.text}</span>
                {statusBadge}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. Next Step
  if (question.format === 'next_step') {
    const stages = question.data?.stages || [];
    const currentIdx = question.data?.currentStageIndex || 0;
    return (
      <div className={styles.formatContainer} data-testid="format-next-step">
        <div className={styles.stepTracker}>
          {stages.map((st: any, idx: number) => (
            <div key={idx} className={styles.stepDot}>
              <div
                className={`${styles.dotCircle} ${
                  idx === currentIdx ? styles.active : idx < currentIdx ? styles.completed : ''
                }`}
              />
              <span>{st.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
          <strong>段階: {stages[currentIdx]?.label}</strong>
          <p style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>{stages[currentIdx]?.description}</p>
        </div>

        <div className={styles.choiceList} data-testid="choice-list">
          {question.data?.choices?.map((ch: any) => {
            let extra = '';
            let statusBadge = null;
            if (answered) {
              if (ch.isCorrect) {
                extra = styles.correct;
                statusBadge = <span className={styles.correctBadge}>✓ 正解</span>;
              } else if (ch.id === userAnswer) {
                extra = styles.wrong;
                statusBadge = <span className={styles.wrongBadge}>✕ あなたの解答</span>;
              }
            }
            return (
              <button
                key={ch.id}
                className={`${styles.choiceBtn} ${extra}`}
                onClick={() => handleChoiceSelect(ch.id)}
                disabled={answered}
                data-testid={`nextstep-btn-${ch.id}`}
              >
                <span style={{ flex: 1 }}>{ch.text}</span>
                {statusBadge}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 6. Ordering (並べ替え)
  if (question.format === 'ordering') {
    const moveItem = (index: number, direction: 'up' | 'down') => {
      if (answered) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= orderItems.length) return;
      const newItems = [...orderItems];
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      setOrderItems(newItems);
    };

    return (
      <div className={styles.formatContainer} data-testid="format-ordering">
        <div style={{ fontSize: '14px', color: 'var(--text-subtle)', marginBottom: '8px' }}>
          {answered
            ? '並べ替えの結果：'
            : '▲▼ボタンで年代順（古い順）に並べ替えてください：'}
        </div>
        <div data-testid="order-items-list">
          {orderItems.map((item, idx) => {
            const isCorrectPosition = question.correctAnswer?.[idx] === item.id;
            return (
              <div
                key={item.id}
                className={`${styles.orderItem} ${
                  answered ? (isCorrectPosition ? styles.correctOrderItem : styles.wrongOrderItem) : ''
                }`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span className={styles.choiceLabel}>{idx + 1}</span>
                  <span>{item.text}</span>
                </div>
                {!answered ? (
                  <div className={styles.orderControls}>
                    <button
                      type="button"
                      className={styles.orderBtn}
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0 || answered}
                      aria-label="上へ"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={styles.orderBtn}
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === orderItems.length - 1 || answered}
                      aria-label="下へ"
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isCorrectPosition ? 'var(--success)' : 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isCorrectPosition ? '✓ 正解の位置' : '✕'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isStandalone && !answered && (
          <button
            className={styles.choiceBtn}
            style={{ justifyContent: 'center', background: 'var(--primary)', color: 'white', marginTop: '12px' }}
            onClick={submitOrder}
            data-testid="order-submit-btn"
          >
            この順番で決定
          </button>
        )}
      </div>
    );
  }

  // 7. Diagram Touch
  if (question.format === 'diagram_touch') {
    const correctRegionName = question.data?.regions?.find((r: any) => r.id === question.correctAnswer)?.name || question.correctAnswer;
    const userRegionName = question.data?.regions?.find((r: any) => r.id === userAnswer)?.name || userAnswer;
    const isCorrect = userAnswer === question.correctAnswer;

    return (
      <div className={styles.formatContainer} data-testid="format-diagram-touch">
        {!answered ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeRegion ? (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--primary-weak)',
                  borderRadius: '12px',
                  border: '1.5px solid var(--primary)',
                }}
                data-testid="diagram-selected-banner"
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '4px' }}>
                  📍 図の場所を選択中
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  青色に光っている場所を選んでいます
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.5' }}>
                  この場所で決定する場合は、下の<strong>「この場所で決定」</strong>を押してください。（図の別の場所をタップして選び直すこともできます）
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface-subtle)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
                data-testid="diagram-hint-banner"
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '6px' }}>
                  👆 図の場所をタップしよう
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.6' }}>
                  問題文で指示された場所を探して、図の該当部分を直接タップしてください。
                </p>
              </div>
            )}

            {isStandalone && activeRegion && (
              <button
                className={styles.choiceBtn}
                style={{ justifyContent: 'center', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}
                onClick={submitDiagramTouch}
                data-testid="diagram-submit-btn"
              >
                この場所で決定
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: isCorrect ? 'var(--success-weak)' : 'var(--error-weak)',
              border: `1.5px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px', color: isCorrect ? 'var(--success)' : 'var(--error)', marginBottom: '6px' }}>
              {isCorrect ? `✓ 正解！「${correctRegionName}」を正しく選択できました` : `✕ あなたが選んだのは「${userRegionName || '未選択'}」です`}
            </div>
            {!isCorrect && (
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
                正解の「{correctRegionName}」は、図の緑色に光っている部分です。
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 8. Matching
  if (question.format === 'matching') {
    const PAIR_COLORS = [
      { bg: 'var(--primary-weak)', border: 'var(--primary)', badge: 'var(--primary)' },
      { bg: 'var(--success-weak)', border: 'var(--success)', badge: 'var(--success)' },
      { bg: '#fff7ed', border: '#f97316', badge: '#ea580c' },
      { bg: '#faf5ff', border: '#a855f7', badge: '#9333ea' },
      { bg: '#fdf2f8', border: '#ec4899', badge: '#db2777' },
    ];

    const handleLeftClick = (id: string) => {
      if (answered) return;
      if (selectedRight) {
        // 右側が既に選ばれている場合 -> ペアを結びつける
        const newMatches = { ...matches };
        Object.keys(newMatches).forEach(k => {
          if (newMatches[k] === selectedRight) delete newMatches[k];
        });
        newMatches[id] = selectedRight;
        setMatches(newMatches);
        setSelectedRight(null);
        setSelectedLeft(null);
      } else {
        // 既にペアになっている場合は解除して選択
        if (matches[id]) {
          const newMatches = { ...matches };
          delete newMatches[id];
          setMatches(newMatches);
        }
        setSelectedLeft(prev => (prev === id ? null : id));
      }
    };

    const handleRightClick = (id: string) => {
      if (answered) return;
      if (selectedLeft) {
        // 左側が既に選ばれている場合 -> ペアを結びつける
        const newMatches = { ...matches };
        Object.keys(newMatches).forEach(k => {
          if (newMatches[k] === id) delete newMatches[k];
        });
        newMatches[selectedLeft] = id;
        setMatches(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        // 既にペアになっている場合は解除して選択
        const matchedLeftKey = Object.keys(matches).find(k => matches[k] === id);
        if (matchedLeftKey) {
          const newMatches = { ...matches };
          delete newMatches[matchedLeftKey];
          setMatches(newMatches);
        }
        setSelectedRight(prev => (prev === id ? null : id));
      }
    };

    const handleResetMatches = () => {
      if (answered) return;
      setMatches({});
      setSelectedLeft(null);
      setSelectedRight(null);
    };

    return (
      <div className={styles.formatContainer} data-testid="format-matching">
        {/* ガイダンス表示 */}
        <div className={styles.matchingInstruction}>
          <span>
            {selectedLeft
              ? `👉 「${question.data?.leftItems?.find((l: any) => l.id === selectedLeft)?.text}」のペアを右側から選んでください`
              : selectedRight
              ? `👉 「${question.data?.rightItems?.find((r: any) => r.id === selectedRight)?.text}」のペアを左側から選んでください`
              : isAllMatched
              ? '🎉 すべてのペアを結びつけました！「決定」を押してください'
              : '👉 左右の言葉をタップして、正しいペアを結びつけてください'}
          </span>
          {Object.keys(matches).length > 0 && !answered && (
            <button
              type="button"
              onClick={handleResetMatches}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-subtle)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              やり直す
            </button>
          )}
        </div>

        <div className={styles.matchingColumns}>
          {/* 左列 */}
          <div>
            {question.data?.leftItems?.map((item: any, idx: number) => {
              const isSelected = selectedLeft === item.id;
              const isMatched = !!matches[item.id];
              const pairColor = PAIR_COLORS[idx % PAIR_COLORS.length];

              let itemStyle: React.CSSProperties = {};
              if (isMatched && !isSelected) {
                itemStyle = {
                  borderColor: pairColor.border,
                  background: pairColor.bg,
                };
              }

              return (
                <div
                  key={item.id}
                  className={`${styles.matchingItem} ${isSelected ? styles.selected : ''} ${
                    isMatched ? styles.matched : ''
                  }`}
                  style={itemStyle}
                  onClick={() => handleLeftClick(item.id)}
                  data-testid={`match-left-${item.id}`}
                >
                  <span>{item.text}</span>
                  {isMatched && (
                    <span
                      className={styles.matchingBadge}
                      style={{ background: pairColor.badge }}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 右列 */}
          <div>
            {question.data?.rightItems?.map((item: any) => {
              const isSelected = selectedRight === item.id;
              const matchedLeftIdx = question.data?.leftItems?.findIndex(
                (l: any) => matches[l.id] === item.id
              );
              const isMatched = matchedLeftIdx !== -1 && matchedLeftIdx !== undefined;
              const pairColor = isMatched ? PAIR_COLORS[matchedLeftIdx % PAIR_COLORS.length] : null;

              let itemStyle: React.CSSProperties = {};
              if (isMatched && !isSelected && pairColor) {
                itemStyle = {
                  borderColor: pairColor.border,
                  background: pairColor.bg,
                };
              }

              return (
                <div
                  key={item.id}
                  className={`${styles.matchingItem} ${isSelected ? styles.selected : ''} ${
                    isMatched ? styles.matched : ''
                  }`}
                  style={itemStyle}
                  onClick={() => handleRightClick(item.id)}
                  data-testid={`match-right-${item.id}`}
                >
                  <span>{item.text}</span>
                  {isMatched && pairColor && (
                    <span
                      className={styles.matchingBadge}
                      style={{ background: pairColor.badge }}
                    >
                      {matchedLeftIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 確定ボタン: 単体テスト時(isStandalone)のみ内部表示し、StudyPageでは下部操作エリアの主ボタンを使用 */}
        {isStandalone && !answered && (
          <button
            className={styles.choiceBtn}
            style={{
              justifyContent: 'center',
              background: isAllMatched ? 'var(--primary)' : 'var(--border)',
              color: isAllMatched ? 'white' : 'var(--text-subtle)',
              marginTop: '12px',
              fontWeight: 'bold',
            }}
            onClick={submitMatching}
            disabled={!isAllMatched}
            data-testid="matching-submit-btn"
          >
            {isAllMatched
              ? 'この組み合わせで決定'
              : `ペアを結びつけてください (${Object.keys(matches).length}/${question.data?.leftItems?.length})`}
          </button>
        )}
      </div>
    );
  }

  // 9. Numeric Answer
  if (question.format === 'numeric_answer') {
    const handleKey = (key: string) => {
      if (answered) return;
      if (key === 'C') {
        setNumericInput('');
      } else if (key === 'BS') {
        setNumericInput(prev => prev.slice(0, -1));
      } else {
        setNumericInput(prev => prev + key);
      }
    };

    return (
      <div className={styles.formatContainer} data-testid="format-numeric">
        <div className={styles.numericDisplay} data-testid="numeric-display">
          {numericInput || '0'}
        </div>

        <div className={styles.keypadGrid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BS'].map(k => (
            <button
              key={k}
              type="button"
              className={styles.keypadBtn}
              onClick={() => handleKey(k)}
              disabled={answered}
              data-testid={`key-${k}`}
            >
              {k === 'BS' ? '⌫' : k}
            </button>
          ))}
        </div>

        {isStandalone && !answered && (
          <button
            className={styles.choiceBtn}
            style={{ justifyContent: 'center', background: 'var(--primary)', color: 'white', marginTop: '12px' }}
            onClick={submitNumeric}
            data-testid="numeric-submit-btn"
          >
            入力完了
          </button>
        )}
      </div>
    );
  }

  // 10. Self Check
  if (question.format === 'self_check') {
    return (
      <div className={styles.formatContainer} data-testid="format-self-check">
        <div style={{ font: 'var(--font-heading)', marginBottom: '8px' }}>紙に解いた後の自己判定</div>
        {!answered ? (
          <div className={styles.selfCheckGrid}>
            <button
              className={styles.selfCheckBtn}
              onClick={() => onAnswer('correct', true)}
              data-testid="self-check-correct"
            >
              正解した
            </button>
            <button
              className={styles.selfCheckBtn}
              onClick={() => onAnswer('method_correct_calc_miss', false)}
              data-testid="self-check-calc-miss"
            >
              解き方は合っていたが計算ミス
            </button>
            <button
              className={styles.selfCheckBtn}
              onClick={() => onAnswer('partial', false)}
              data-testid="self-check-partial"
            >
              途中まで分かった
            </button>
            <button
              className={styles.selfCheckBtn}
              onClick={() => onAnswer('dont_know', false)}
              data-testid="self-check-dont-know"
            >
              解き方が分からなかった
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return <div>未対応の形式: {question.format}</div>;
};

// 互換用ラッパー
export const QuestionRenderer: React.FC<any> = (props) => {
  const [internalRegion, setInternalRegion] = useState<string | null>(null);
  const activeRegion = props.selectedRegion !== undefined ? props.selectedRegion : internalRegion;
  const handleSelect = props.onRegionSelect || setInternalRegion;

  return (
    <>
      <QuestionPromptView
        question={props.question}
        selectedRegion={activeRegion}
        onRegionSelect={handleSelect}
        answered={props.answered}
      />
      <AnswerAreaView
        {...props}
        selectedRegion={activeRegion}
        onRegionSelect={handleSelect}
      />
    </>
  );
};
