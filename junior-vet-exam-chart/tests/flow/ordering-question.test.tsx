import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';
import { MemoryRouter } from 'react-router-dom';

describe('Ordering Question UI Verification', () => {
  it('correctly displays ordering cards in the answer area when choices are revealed', () => {
    const orderingQ = SAMPLE_QUESTIONS.find(q => q.format === 'ordering')!;
    expect(orderingQ).toBeDefined();

    // 該当の並べ替え問題だけをセッションに設定
    useAppStore.setState({
      currentSessionQuestions: [orderingQ],
      currentIndex: 0,
      recallPhase: false, // 選択肢表示状態
      currentAnswered: false,
    });

    render(
      <MemoryRouter>
        <StudyPage />
      </MemoryRouter>
    );

    // 左側の問題エリアに問題文が表示されていること
    expect(screen.getByTestId('question-area')).toHaveTextContent('【歴史・並べ替え】');

    // 右側の回答エリアに並べ替えカード（大化の改新、平安京への遷都など）が表示されていること
    const orderItemsContainer = screen.getByTestId('order-items-list');
    expect(orderItemsContainer).toBeInTheDocument();
    expect(orderItemsContainer).toHaveTextContent('大化の改新');
    expect(orderItemsContainer).toHaveTextContent('平安京への遷都');
    expect(orderItemsContainer).toHaveTextContent('鎌倉幕府の成立');
    expect(orderItemsContainer).toHaveTextContent('大政奉還');

    // 「この順番で決定」ボタンが存在すること
    expect(screen.getByTestId('order-submit-btn')).toBeInTheDocument();
  });
});

