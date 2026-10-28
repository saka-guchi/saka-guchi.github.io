import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionRenderer } from '../../src/components/formats/QuestionRenderer';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';

describe('QuestionRenderer Component Tests (10 Formats)', () => {
  // 1. Recall Card
  it('renders and handles recall card correctly', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'recall_card')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-recall-card')).toBeInTheDocument();
    const revealBtn = screen.getByTestId('recall-reveal-btn');
    fireEvent.click(revealBtn);

    const correctBtn = screen.getByTestId('recall-correct-btn');
    fireEvent.click(correctBtn);
    expect(handleAnswer).toHaveBeenCalledWith('correct', true);
  });

  // 2. Delayed Choice / Multiple Choice / Why Choice
  it('renders multiple choice and detects correct answer', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'multiple_choice')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('choice-list')).toBeInTheDocument();
    const targetBtn = screen.getByTestId(`choice-btn-${q.correctAnswer}`);
    fireEvent.click(targetBtn);
    expect(handleAnswer).toHaveBeenCalledWith(q.correctAnswer, true);
  });

  // 5. Next Step
  it('renders next step options and triggers selection', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'next_step')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-next-step')).toBeInTheDocument();
    const targetBtn = screen.getByTestId(`nextstep-btn-${q.correctAnswer}`);
    fireEvent.click(targetBtn);
    expect(handleAnswer).toHaveBeenCalledWith(q.correctAnswer, true);
  });

  // 6. Ordering
  it('renders ordering items and allows submission', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'ordering')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-ordering')).toBeInTheDocument();
    const submitBtn = screen.getByTestId('order-submit-btn');
    fireEvent.click(submitBtn);
    expect(handleAnswer).toHaveBeenCalled();
  });

  // 7. Diagram Touch
  it('renders diagram touch, prevents answer/label leakage before submission, and handles tap selection', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'diagram_touch')!;
    const handleAnswer = vi.fn();
    const { rerender } = render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    const container = screen.getByTestId('diagram-touch-container');
    expect(container).toBeInTheDocument();

    // 未タップ時の案内が表示されている
    expect(screen.getByTestId('diagram-hint-banner')).toHaveTextContent('図の場所をタップしよう');

    // どの部位の名称も回答選択前にAnswerArea内に漏洩していないこと
    q.data?.regions?.forEach((r: any) => {
      const banner = screen.getByTestId('diagram-hint-banner');
      expect(banner).not.toHaveTextContent(`「${r.name}」`);
    });

    // 接眼レンズ（region-eyepiece: 不正解部位）をタップ
    const eyepiece = container.querySelector('[data-region-id="region-eyepiece"]');
    expect(eyepiece).not.toBeNull();
    fireEvent.click(eyepiece!);

    // 選択中バナーが表示されるが、部位名称（接眼レンズ等）は絶対に漏洩しない
    const selectedBanner = screen.getByTestId('diagram-selected-banner');
    expect(selectedBanner).toHaveTextContent('📍 図の場所を選択中');
    expect(selectedBanner).toHaveTextContent('青色に光っている場所を選んでいます');
    q.data?.regions?.forEach((r: any) => {
      expect(selectedBanner).not.toHaveTextContent(`「${r.name}」`);
    });

    // 調節ねじ（region-focus-knob: 正解部位）をタップし直す
    const focusKnob = container.querySelector('[data-region-id="region-focus-knob"]');
    expect(focusKnob).not.toBeNull();
    fireEvent.click(focusKnob!);

    // 再度確認: 正解部位をタップしても「調節ねじ」などのネタバレ名称は表示されない
    expect(selectedBanner).not.toHaveTextContent('「調節ねじ」');

    // 決定ボタンが表示され、クリックで正解判定される
    const submitBtn = screen.getByTestId('diagram-submit-btn');
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    expect(handleAnswer).toHaveBeenCalledWith('region-focus-knob', true);

    // 回答後のレンダリング（正解時）
    rerender(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={true} userAnswer="region-focus-knob" />);
    expect(screen.getByText(/✓ 正解！「調節ねじ」を正しく選択できました/)).toBeInTheDocument();

    // 回答後のレンダリング（不正解時）
    rerender(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={true} userAnswer="region-eyepiece" />);
    expect(screen.getByText(/✕ あなたが選んだのは「接眼レンズ」です/)).toBeInTheDocument();
    expect(screen.getByText(/正解の「調節ねじ」は、図の緑色に光っている部分です。/)).toBeInTheDocument();
  });

  // 8. Matching
  it('renders matching pairs, handles bidirectional pairing and submits', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'matching')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-matching')).toBeInTheDocument();

    // 1. 左をタップして右をタップ（岩手県 -> 盛岡市）
    fireEvent.click(screen.getByTestId('match-left-a'));
    fireEvent.click(screen.getByTestId('match-right-1'));

    // 2. 右をタップして左をタップ（松山市 -> 愛媛県: 逆方向タップも可能）
    fireEvent.click(screen.getByTestId('match-right-2'));
    fireEvent.click(screen.getByTestId('match-left-b'));

    // 3. 最後のペア（石川県 -> 金沢市）
    fireEvent.click(screen.getByTestId('match-left-c'));
    fireEvent.click(screen.getByTestId('match-right-3'));

    // 4. すべてペアになると「この組み合わせで決定」ボタンが活性化
    const submitBtn = screen.getByTestId('matching-submit-btn');
    expect(submitBtn).toBeEnabled();
    expect(submitBtn).toHaveTextContent('この組み合わせで決定');

    fireEvent.click(submitBtn);
    expect(handleAnswer).toHaveBeenCalledWith({ a: '1', b: '2', c: '3' }, true);
  });

  // 9. Numeric Answer
  it('inputs digits via keypad and submits', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'numeric_answer')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-numeric')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('key-4'));
    fireEvent.click(screen.getByTestId('key-0'));
    fireEvent.click(screen.getByTestId('key-0'));

    const display = screen.getByTestId('numeric-display');
    expect(display).toHaveTextContent('400');

    fireEvent.click(screen.getByTestId('numeric-submit-btn'));
    expect(handleAnswer).toHaveBeenCalledWith('400', true);
  });

  // 10. Self Check
  it('handles self check selection', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'self_check')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    expect(screen.getByTestId('format-self-check')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('self-check-correct'));
    expect(handleAnswer).toHaveBeenCalledWith('correct', true);
  });
});

