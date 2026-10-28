import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResultPage } from '../../src/pages/ResultPage';
import { useAppStore, type SessionAnswerRecord } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';
import { BrowserRouter } from 'react-router-dom';

describe('ResultPage Mistake Review Feature', () => {
  beforeEach(() => {
    useAppStore.getState().resetSession();
  });

  it('renders mistake review section with user answer, correct answer and reasoning when there are mistakes', () => {
    const q1 = SAMPLE_QUESTIONS[0]; // multiple choice
    const q2 = SAMPLE_QUESTIONS[1]; // recall card

    const mockRecords: SessionAnswerRecord[] = [
      {
        question: q1,
        userAnswer: 'wrong-choice',
        isCorrect: false,
        directRecall: false,
      },
      {
        question: q2,
        userAnswer: 'correct',
        isCorrect: true,
        directRecall: true,
      },
    ];

    useAppStore.setState({
      currentSessionQuestions: [q1, q2],
      sessionResults: mockRecords,
      correctCount: 1,
      directRecallCount: 1,
    });

    render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    // 間違えた問題振り返りセクションが存在する
    const mistakeSection = screen.getByTestId('mistake-review-section');
    expect(mistakeSection).toBeInTheDocument();
    expect(mistakeSection).toHaveTextContent('📝 まちがえた問題の振り返り');
    expect(mistakeSection).toHaveTextContent('1 問');

    // 間違えた問題（q1）のカードが表示されている
    const mistakeCard = screen.getByTestId('mistake-card-0');
    expect(mistakeCard).toBeInTheDocument();
    expect(mistakeCard).toHaveTextContent(q1.prompt);
    expect(mistakeCard).toHaveTextContent('✕ あなたの答え');
    expect(mistakeCard).toHaveTextContent('✓ 正解');
    expect(mistakeCard).toHaveTextContent('💡 考え方・覚えること');
    expect(mistakeCard).toHaveTextContent(q1.explanation.keyTakeaway);

    // 正解した問題（q2）は間違えた問題セクションに出てこない
    expect(screen.queryByText(q2.prompt)).not.toBeInTheDocument();
  });

  it('renders all-correct perfect banner when there are no mistakes', () => {
    const q1 = SAMPLE_QUESTIONS[0];

    const mockRecords: SessionAnswerRecord[] = [
      {
        question: q1,
        userAnswer: q1.correctAnswer,
        isCorrect: true,
        directRecall: true,
      },
    ];

    useAppStore.setState({
      currentSessionQuestions: [q1],
      sessionResults: mockRecords,
      correctCount: 1,
      directRecallCount: 1,
    });

    render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    // 全問パーフェクトバナーが表示される
    expect(screen.getByTestId('all-correct-banner')).toBeInTheDocument();
    expect(screen.getByText('まちがえた問題はありません！全問パーフェクト！')).toBeInTheDocument();
    expect(screen.queryByTestId('mistake-review-section')).not.toBeInTheDocument();
  });
});
