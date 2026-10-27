import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';
import { MemoryRouter } from 'react-router-dom';

describe('Recall Card Question UI Verification', () => {
  it('correctly displays recall card in the answer area without choices confusion', () => {
    const recallQ = SAMPLE_QUESTIONS.find(q => q.format === 'recall_card')!;
    expect(recallQ).toBeDefined();

    // 想起カード問題をセッションに設定
    useAppStore.setState({
      currentSessionQuestions: [recallQ],
      currentIndex: 0,
      recallPhase: false,
      currentAnswered: false,
    });

    render(
      <MemoryRouter>
        <StudyPage />
      </MemoryRouter>
    );

    // 左側の問題エリアに問題文が表示されていること
    expect(screen.getByTestId('question-area')).toHaveTextContent('【植物】葉の葉脈において');

    // 右側の回答エリアにヘッダー「答えを自己判定しよう」が表示されていること
    expect(screen.getByTestId('answer-area')).toHaveTextContent('答えを自己判定しよう');

    // 「答えを確認する」ボタンが存在すること
    const revealBtn = screen.getByTestId('recall-reveal-btn');
    expect(revealBtn).toBeInTheDocument();

    // 「答えを確認する」を押すと、模範解答と自己判定ボタン（正解・惜しかった・思い出せなかった）が表示されること
    fireEvent.click(revealBtn);
    expect(screen.getByText('模範解答：')).toBeInTheDocument();
    expect(screen.getByText('道管')).toBeInTheDocument();
    expect(screen.getByTestId('recall-correct-btn')).toBeInTheDocument();
    expect(screen.getByTestId('recall-almost-btn')).toBeInTheDocument();
    expect(screen.getByTestId('recall-wrong-btn')).toBeInTheDocument();
  });
});

