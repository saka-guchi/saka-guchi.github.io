import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { MemoryRouter } from 'react-router-dom';

describe('Final Challenge Page (Stage 1 & 2)', () => {
  it('starts from page 1, does not leak answers in labels, and has structured slots', () => {
    render(
      <MemoryRouter>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 1. ページ1（表紙）から開始すること
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 7');
    expect(screen.getByTestId('prev-page-btn')).toBeDisabled();
    expect(screen.getByTestId('next-page-btn')).toBeEnabled();

    // 2. 解答用紙に答え（主根、側根、師管、道管など）が漏洩していないこと
    const sheetArea = screen.getByTestId('challenge-answer-sheet');
    expect(sheetArea).not.toHaveTextContent('(主根)');
    expect(sheetArea).not.toHaveTextContent('(側根)');
    expect(sheetArea).not.toHaveTextContent('(師管)');
    expect(sheetArea).not.toHaveTextContent('(道管)');

    // 3. 解答用紙が構造化されていること（大問1, 大問2, 大問3）
    expect(sheetArea).toHaveTextContent('大問 1');
    expect(sheetArea).toHaveTextContent('大問 2');
    expect(sheetArea).toHaveTextContent('大問 3');
    expect(sheetArea).toHaveTextContent('全 23 欄');

    // 問1の小問 [ア]〜[オ] があること
    expect(screen.getByTestId('slot-rika-2024-01-01-a')).toBeInTheDocument();
    expect(screen.getByTestId('slot-rika-2024-01-01-e')).toBeInTheDocument();

    // 4. 次のページへ進むと p.2 (大問1) が表示されること
    fireEvent.click(screen.getByTestId('next-page-btn'));
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 2 / 7');
    expect(screen.getByText('大問【1】 植物の根と茎・葉脈の観察')).toBeInTheDocument();
    expect(screen.getByText('【問1】')).toBeInTheDocument();
    expect(screen.getByText('【問2】')).toBeInTheDocument();

    // 5. 提出ボタンを押すと記述採点モーダルが表示されること
    fireEvent.click(screen.getByTestId('submit-exam-btn'));
    expect(screen.getByTestId('scoring-modal')).toBeInTheDocument();
    expect(screen.getByText('記述問題の自己判定（第13章仕様）')).toBeInTheDocument();
  });

  it('switches subjects between Science, Math, and Social Studies', () => {
    render(
      <MemoryRouter>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 算数タブに切り替え
    const sansuTab = screen.getByTestId('subject-tab-sansu');
    fireEvent.click(sansuTab);

    // 算数: 10ページ、16問、50分
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 10');
    expect(screen.getByTestId('challenge-answer-sheet')).toHaveTextContent('全 16 欄');
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 50:00');
    expect(screen.getByTestId('slot-sansu-2024-01-01')).toBeInTheDocument();

    // 社会タブに切り替え
    const shakaiTab = screen.getByTestId('subject-tab-shakai');
    fireEvent.click(shakaiTab);

    // 社会: 9ページ、25問、30分
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 9');
    expect(screen.getByTestId('challenge-answer-sheet')).toHaveTextContent('全 25 欄');
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 30:00');
    expect(screen.getByTestId('slot-shakai-2024-01-01')).toBeInTheDocument();
  });

  it('switches to Stage 2 and displays human-verified Stage 2 questions', () => {
    render(
      <MemoryRouter>
        <FinalChallengePage />
      </MemoryRouter>
    );

    const stage2Tab = screen.getByTestId('stage-2-tab');
    fireEvent.click(stage2Tab);

    expect(stage2Tab).toHaveClass(/activeTab/);
    expect(screen.getByText('Stage 2：同等未見問題セット（人による確認済み）')).toBeInTheDocument();

    // Stage 2 では原本が存在しないため原本スキャンボタンは非表示、代わりに未見問題モードバッジが表示されること
    expect(screen.queryByText('📸 原本スキャン')).not.toBeInTheDocument();
    expect(screen.getByText('✨ 同等未見問題モード（オリジナル出題）')).toBeInTheDocument();
  });
});

