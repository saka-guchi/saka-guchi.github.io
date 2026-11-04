import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuestionRenderer } from '../../src/components/formats/QuestionRenderer';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';

describe('自己判定（self_check）問題 模範解答展開＆採点フロー 結合テスト', () => {
  const selfCheckQ = SAMPLE_QUESTIONS.find(q => q.format === 'self_check')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態では模範解答と判定ボタンは非表示で、答え合わせ案内と展開ボタンが表示されること', () => {
    const handleAnswer = vi.fn();
    render(
      <QuestionRenderer
        question={selfCheckQ}
        onAnswer={handleAnswer}
        answered={false}
        userAnswer={null}
      />
    );

    // 案内カードと展開ボタン
    expect(screen.getByText(/ノートや紙に解く問題/)).toBeInTheDocument();
    expect(screen.getByTestId('self-check-reveal-btn')).toBeInTheDocument();

    // 模範解答カードと判定ボタンはまだ表示されない
    expect(screen.queryByTestId('self-check-answer-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('self-check-correct')).not.toBeInTheDocument();
    expect(screen.queryByTestId('self-check-calc-miss')).not.toBeInTheDocument();
    expect(screen.queryByTestId('self-check-partial')).not.toBeInTheDocument();
    expect(screen.queryByTestId('self-check-dont-know')).not.toBeInTheDocument();
  });

  it('答え合わせボタンを押すと模範解答・考え方が表示され、4段階の判定ボタンから選択できること', () => {
    const handleAnswer = vi.fn();
    render(
      <QuestionRenderer
        question={selfCheckQ}
        onAnswer={handleAnswer}
        answered={false}
        userAnswer={null}
      />
    );

    // 答え合わせを押す
    fireEvent.click(screen.getByTestId('self-check-reveal-btn'));

    // 模範解答カードが表示される
    const answerCard = screen.getByTestId('self-check-answer-card');
    expect(answerCard).toBeInTheDocument();
    expect(answerCard).toHaveTextContent(/96 cm2/);
    expect(answerCard).toHaveTextContent(/考え方/);

    // 4つの判定ボタンがすべて表示される
    expect(screen.getByTestId('self-check-correct')).toHaveTextContent(/正解した/);
    expect(screen.getByTestId('self-check-calc-miss')).toHaveTextContent(/解き方は合っていたが計算ミス/);
    expect(screen.getByTestId('self-check-partial')).toHaveTextContent(/途中まで分かった/);
    expect(screen.getByTestId('self-check-dont-know')).toHaveTextContent(/解き方が分からなかった/);

    // 「解き方は合っていたが計算ミス」を選択
    fireEvent.click(screen.getByTestId('self-check-calc-miss'));
    expect(handleAnswer).toHaveBeenCalledWith('method_correct_calc_miss', false);
  });

  it('StudyPage 内でもフッターボタンと連動して模範解答を開き、自己判定を完了できること', () => {
    const store = useAppStore.getState();
    store.currentSessionQuestions = [selfCheckQ];
    store.currentQuestionIndex = 0;
    store.sessionAnswers = [];

    render(
      <MemoryRouter>
        <StudyPage />
      </MemoryRouter>
    );

    // 初期状態のフッターボタンは「答え合わせ（模範解答を開く）」
    const footerRevealBtn = screen.getByTestId('self-check-reveal-btn');
    expect(footerRevealBtn).toHaveTextContent('答え合わせ（模範解答を開く）');

    // フッターボタンをクリック
    fireEvent.click(footerRevealBtn);

    // 模範解答が表示される
    expect(screen.getByTestId('self-check-answer-card')).toBeInTheDocument();

    // 正解を選択
    fireEvent.click(screen.getByTestId('self-check-correct'));

    // 解説パネルが開き、「次へ →」ボタンが表示される
    expect(screen.getByTestId('explanation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('next-question-btn')).toBeInTheDocument();
  });
});

