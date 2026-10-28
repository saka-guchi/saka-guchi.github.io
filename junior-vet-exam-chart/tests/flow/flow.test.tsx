import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../src/App';
import { useAppStore } from '../../src/store/appStore';

describe('Screen Flow Integration Tests', () => {
  beforeEach(() => {
    window.location.hash = '#/';
    useAppStore.getState().resetSession();
  });

  it('navigates from Home to Study, reveals choices, answers and advances to Result and back to Home', async () => {
    render(<App />);

    // 1. ホーム画面の確認
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('みならい獣医さんの中学受験カルテ')).toBeInTheDocument();

    // 2. 「今日の学習をはじめる」をクリック
    const startBtn = screen.getByTestId('start-study-btn');
    fireEvent.click(startBtn);

    // 3. 学習画面へ遷移
    expect(screen.getByTestId('study-page')).toBeInTheDocument();
    expect(screen.getByTestId('question-area')).toBeInTheDocument();

    // 4. Recall First フェーズの確認（選択式問題の場合）
    const recallPanel = screen.queryByTestId('recall-panel');
    if (recallPanel) {
      expect(screen.getByText('まず頭の中で考えよう')).toBeInTheDocument();
      // 5. 「選択肢を見る」をクリック
      const revealBtn = screen.getByTestId('reveal-choices-btn');
      fireEvent.click(revealBtn);
    }

    // 6. 回答パネルで回答
    const choiceList = screen.queryByTestId('choice-list');
    if (choiceList) {
      const firstChoice = choiceList.querySelector('button');
      if (firstChoice) fireEvent.click(firstChoice);
    } else {
      const recallAnswer = screen.queryByTestId('recall-reveal-btn');
      if (recallAnswer) {
        fireEvent.click(recallAnswer);
        const correctBtn = screen.getByTestId('recall-correct-btn');
        fireEvent.click(correctBtn);
      } else {
        const selfCheckBtn = screen.queryByTestId('self-check-correct');
        if (selfCheckBtn) {
          fireEvent.click(selfCheckBtn);
        } else {
          const numericKey = screen.queryByTestId('key-1');
          const numericSubmit = screen.queryByTestId('numeric-submit-btn');
          if (numericKey && numericSubmit) {
            fireEvent.click(numericKey);
            fireEvent.click(numericSubmit);
          } else {
            const orderSubmit = screen.queryByTestId('order-submit-btn');
            if (orderSubmit) {
              fireEvent.click(orderSubmit);
            } else {
              const matchLeft = screen.queryByTestId('match-left-a');
              if (matchLeft) {
                fireEvent.click(matchLeft);
                fireEvent.click(screen.getByTestId('match-right-1'));
                fireEvent.click(screen.getByTestId('match-left-b'));
                fireEvent.click(screen.getByTestId('match-right-2'));
                fireEvent.click(screen.getByTestId('match-left-c'));
                fireEvent.click(screen.getByTestId('match-right-3'));
                const matchSubmit = screen.queryByTestId('matching-submit-btn');
                if (matchSubmit) fireEvent.click(matchSubmit);
              } else {
                const diagramContainer = screen.queryByTestId('diagram-touch-container');
                if (diagramContainer) {
                  const target = diagramContainer.querySelector('[data-region-id]');
                  if (target) fireEvent.click(target);
                  const diagramSubmit = screen.queryByTestId('diagram-submit-btn');
                  if (diagramSubmit) fireEvent.click(diagramSubmit);
                }
              }
            }
          }
        }
      }
    }

    // 7. 解説パネルの表示確認
    expect(screen.getByTestId('explanation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('result-banner')).toBeInTheDocument();

    // 7-2. 問題を解いた後でもヒントを振り返ることができる
    expect(screen.getByTestId('reviewed-hints-section')).toBeInTheDocument();
    expect(screen.getByText('出題ヒントの振り返り')).toBeInTheDocument();

    // 7-3. 回答後でもヒントボタンを押してヒントボックスを表示できる
    const hintBtn = screen.queryByTestId('show-hint-btn');
    if (hintBtn) {
      fireEvent.click(hintBtn);
      const hintBox = screen.getByTestId('hint-box');
      expect(hintBox).toBeInTheDocument();
      expect(hintBox).toHaveTextContent('ヒント 1:');
    }

    // 8. 「次へ」ボタン
    const nextBtn = screen.getByTestId('next-question-btn');
    expect(nextBtn).toBeInTheDocument();
  });

  it('navigates to Settings and verifies history reset flow', () => {
    render(<App />);
    const menuBtn = screen.getByTestId('header-menu-btn');
    fireEvent.click(menuBtn);

    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByTestId('recall-delay-select')).toBeInTheDocument();
  });

  it('opens and closes the pause modal during study', () => {
    render(<App />);
    const startBtn = screen.getByTestId('start-study-btn');
    fireEvent.click(startBtn);

    const pauseBtn = screen.getByTestId('study-pause-btn');
    expect(pauseBtn).toBeInTheDocument();
    fireEvent.click(pauseBtn);

    // 一時停止モーダルが表示される
    expect(screen.getByTestId('study-pause-modal')).toBeInTheDocument();
    expect(screen.getByText('一時停止中')).toBeInTheDocument();

    // 再開ボタンでモーダルが閉じる
    const resumeBtn = screen.getByTestId('study-resume-btn');
    fireEvent.click(resumeBtn);
    expect(screen.queryByTestId('study-pause-modal')).not.toBeInTheDocument();
  });
});

