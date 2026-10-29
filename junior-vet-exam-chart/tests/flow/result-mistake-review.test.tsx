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

    // 教科バッジが英語（rika）ではなく日本語（🧪 理科）になっていること
    expect(mistakeCard).toHaveTextContent('🧪 理科');

    // 「出題ヒント」ではなく「ヒント」に表記統一されていること
    expect(mistakeCard).toHaveTextContent('ヒント:');
    expect(mistakeCard).not.toHaveTextContent('出題ヒント:');

    // 「詳しい解説」アコーディオンが削除されていること
    expect(screen.queryByText('▼ 詳しい解説を見る')).not.toBeInTheDocument();
    expect(screen.queryByText('▲ 詳しい解説を閉じる')).not.toBeInTheDocument();

    // 正解した問題（q2）は間違えた問題セクションに出てこない
    expect(screen.queryByText(q2.prompt)).not.toBeInTheDocument();
  });

  it('prevents duplicate reasoning text when keyTakeaway and reasoning are identical', () => {
    const qDuplicateReasoning = {
      ...SAMPLE_QUESTIONS[0],
      choices: [
        { id: 'a', label: 'ア', text: '正解の選択肢テキスト' },
        { id: 'b', label: 'イ', text: '不正解の選択肢テキスト' },
      ],
      correctAnswer: 'a',
      explanation: {
        keyTakeaway: '金星の表面温度が高い理由',
        reasoning: '金星の表面温度が高い理由', // 同一文字列
      },
    };

    useAppStore.setState({
      currentSessionQuestions: [qDuplicateReasoning as any],
      sessionResults: [
        {
          question: qDuplicateReasoning as any,
          userAnswer: 'b',
          isCorrect: false,
          directRecall: false,
        },
      ],
      correctCount: 0,
      directRecallCount: 0,
    });

    render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    const mistakeCard = screen.getByTestId('mistake-card-0');
    // 選択肢テキストがラベル付きで表示されていること
    expect(mistakeCard).toHaveTextContent('イ. 不正解の選択肢テキスト');
    expect(mistakeCard).toHaveTextContent('ア. 正解の選択肢テキスト');

    // 「金星の表面温度が高い理由」が1回だけ出現すること（重複描画されない）
    const matches = screen.getAllByText('金星の表面温度が高い理由');
    expect(matches.length).toBe(1);
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

  it('provides hybrid navigation layout: top-left back button AND bottom CTA button', () => {
    const q1 = SAMPLE_QUESTIONS[0];
    useAppStore.setState({
      currentSessionQuestions: [q1],
      sessionResults: [],
      correctCount: 1,
      directRecallCount: 1,
    });

    render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    // 1. 共通ヘッダーと画面左上の戻るボタンが配置されていること（グローバルナビゲーション原則）
    const header = screen.getByTestId('result-header');
    expect(header).toBeInTheDocument();

    const topBackBtn = screen.getByTestId('result-top-back-btn');
    expect(topBackBtn).toBeInTheDocument();
    expect(topBackBtn).toHaveAttribute('aria-label', 'ホームへ戻る');
    expect(topBackBtn).toHaveTextContent('←');

    // 2. 最下部にもメインのホームへ戻るボタンが維持されていること（ハイブリッド配置）
    const bottomHomeBtn = screen.getByTestId('result-home-btn');
    expect(bottomHomeBtn).toBeInTheDocument();
    expect(bottomHomeBtn).toHaveTextContent('ホームへ戻る 🐾');

    // 3. 左上のボタンをクリックするとセッションがリセットされること
    fireEvent.click(topBackBtn);
    expect(useAppStore.getState().currentSessionQuestions.length).toBe(0);
  });
});
