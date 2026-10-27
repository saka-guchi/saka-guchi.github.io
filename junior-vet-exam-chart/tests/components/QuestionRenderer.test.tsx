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
  it('renders diagram touch container and handles tap selection', () => {
    const q = SAMPLE_QUESTIONS.find(x => x.format === 'diagram_touch')!;
    const handleAnswer = vi.fn();
    render(<QuestionRenderer question={q} onAnswer={handleAnswer} answered={false} userAnswer={null} />);

    const container = screen.getByTestId('diagram-touch-container');
    expect(container).toBeInTheDocument();

    // 調節ねじ（region-focus-knob）をタップ
    const focusKnob = container.querySelector('[data-region-id="region-focus-knob"]');
    expect(focusKnob).not.toBeNull();
    fireEvent.click(focusKnob!);

    // 決定ボタンが表示され、クリックで正解判定される
    const submitBtn = screen.getByTestId('diagram-submit-btn');
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    expect(handleAnswer).toHaveBeenCalledWith('region-focus-knob', true);
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

