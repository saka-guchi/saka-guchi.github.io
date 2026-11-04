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
    expect(sheetArea).toHaveTextContent('全 22 欄');

    // 設問ラベルに大問番号が付与され（例: 「大問1 問1」「大問1 問2」）、複数大問の問1と混同しないこと
    expect(sheetArea).toHaveTextContent('大問1 問1');
    expect(sheetArea).toHaveTextContent('大問1 問2 (記述)');

    // 問1の小問 [ア]〜[オ] があること
    expect(screen.getByTestId('slot-rika-2024-01-01-a')).toBeInTheDocument();
    expect(screen.getByTestId('slot-rika-2024-01-01-e')).toBeInTheDocument();

    // 問4が「ウのはたらき」「エのはたらき」の記述欄であり、無関係な「植物A」「植物B」の選択肢欄になっていないこと
    expect(sheetArea).toHaveTextContent('問4 [ウのはたらき] (記述)');
    expect(sheetArea).toHaveTextContent('問4 [エのはたらき] (記述)');
    expect(sheetArea).not.toHaveTextContent('問4 [植物A]');
    expect(sheetArea).not.toHaveTextContent('問4 [植物B]');
    expect(screen.getByTestId('slot-rika-2024-01-04-c')).toBeInTheDocument();
    expect(screen.getByTestId('slot-rika-2024-01-04-d')).toBeInTheDocument();

    // 問5が「語句を入力」のinput欄であり、問6が記述用textarea欄であること
    const slot5Input = screen.getByTestId('slot-rika-2024-01-05');
    expect(slot5Input.tagName).toBe('INPUT');
    expect(slot5Input).toHaveAttribute('placeholder', '語句を入力');

    const slot6Textarea = screen.getByTestId('slot-rika-2024-01-06');
    expect(slot6Textarea.tagName).toBe('TEXTAREA');
    expect(slot6Textarea).toHaveAttribute('placeholder', 'ノートや紙に記述後、提出時に自己採点要素を確認します');

    // 4. 次のページへ進むと p.2 (大問1) が表示されること（初期表示は原本スキャン画像）
    fireEvent.click(screen.getByTestId('next-page-btn'));
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 2 / 7');
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
    // テキスト・図表タブに切り替えて問題文を検証
    fireEvent.click(screen.getByText('📐 テキスト・図表'));
    expect(screen.getByText('大問【1】 植物の根と茎・葉脈の観察')).toBeInTheDocument();
    expect(screen.getByText('【問1】')).toBeInTheDocument();
    expect(screen.getByText('【問2】')).toBeInTheDocument();

    // 問題用紙（大問1）の問題文に答え（師管・道管など）がネタバレ漏洩していないこと
    const pdfArea = screen.getByTestId('challenge-pdf-area');
    expect(pdfArea).not.toHaveTextContent('(師管)');
    expect(pdfArea).not.toHaveTextContent('(道管)');
    expect(pdfArea).not.toHaveTextContent('組織㋒（師管）');
    expect(pdfArea).not.toHaveTextContent('組織㋓（道管）');
    expect(pdfArea).toHaveTextContent('図2の㋒と㋓のはたらきを簡単に説明しなさい。');

    // 5. 提出ボタンを押すと記述採点モーダルが表示されること
    fireEvent.click(screen.getByTestId('submit-exam-btn'));
    expect(screen.getByTestId('scoring-modal')).toBeInTheDocument();
    expect(screen.getByText('記述問題の自己判定（第13章仕様）')).toBeInTheDocument();
  });

  it('displays specified subjects Math and Social Studies via query parameters', () => {
    // 算数をクエリパラメータで指定してレンダリング
    const { unmount } = render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=sansu']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 算数: 10ページ、16問、50分
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('算数');
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 10');
    expect(screen.getByTestId('challenge-answer-sheet')).toHaveTextContent('全 16 欄');
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 50:00');
    expect(screen.getByTestId('slot-sansu-2024-01-01')).toBeInTheDocument();

    unmount();

    // 社会をクエリパラメータで指定してレンダリング
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=shakai']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 社会: 9ページ、25問、30分
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('社会');
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 9');
    expect(screen.getByTestId('challenge-answer-sheet')).toHaveTextContent('全 25 欄');
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 30:00');
    expect(screen.getByTestId('slot-shakai-2024-01-01')).toBeInTheDocument();
  });

  it('triggers time-up modal when exam timer reaches zero', async () => {
    const { act } = await import('@testing-library/react');
    const { vi } = await import('vitest');

    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 初期状態: 理科 30:00
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 30:00');

    // 10秒経過
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('⏱ 残り時間: 29:50');

    // 残り時間すべて進める (29分51秒進める)
    act(() => {
      vi.advanceTimersByTime(29 * 60 * 1000 + 51 * 1000);
    });

    // タイムアップモーダルが表示されること
    expect(screen.getByTestId('timeup-modal')).toBeInTheDocument();
    expect(screen.getByText('試験時間が終了しました！')).toBeInTheDocument();

    // 採点へ進むボタンをクリックすると採点モーダルへ遷移
    fireEvent.click(screen.getByTestId('timeup-proceed-btn'));
    expect(screen.getByTestId('scoring-modal')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('provides Stage 1 only and does not display Stage 1/2 switch tabs in header', () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // ヘッダーにStage切り替えタブ（Stage 1 / Stage 2）が存在しないこと
    expect(screen.queryByTestId('stage-1-tab')).toBeNull();
    expect(screen.queryByTestId('stage-2-tab')).toBeNull();

    // Stage 1（原本スキャン/問題用紙）が表示されていること
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
  });

  it('displays in-app result modal and allows opening history modal after finalizing score', async () => {
    const { waitFor } = await import('@testing-library/react');

    render(
      <MemoryRouter>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 提出ボタンを押す
    fireEvent.click(screen.getByTestId('submit-exam-btn'));
    expect(screen.getByTestId('scoring-modal')).toBeInTheDocument();

    // 採点を確定
    fireEvent.click(screen.getByTestId('finalize-score-btn'));

    // ブラウザalertではなく、アプリ内リザルトモーダルが表示されること
    await waitFor(() => {
      expect(screen.getByTestId('exam-result-modal')).toBeInTheDocument();
      expect(screen.getByTestId('result-score-display')).toBeInTheDocument();
    });

    // 「成績表を見る」ボタンを押すと、過去の採点カルテ・成績表モーダルが開くこと
    fireEvent.click(screen.getByTestId('view-history-from-result-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('exam-history-modal')).toBeInTheDocument();
      expect(screen.getByText('🏆 獣医師チャレンジ 採点カルテ・成績表')).toBeInTheDocument();
    });
  });

  it('displays exam paper and answer slots according to exam year in query params', () => {
    // 2023年度・理科を指定してレンダリング
    const { unmount } = render(
      <MemoryRouter initialEntries={['/final-challenge?year=2023&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 理科2023年度（5ページ、20スロット）が表示されること
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('2023年度');
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('理科');
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 5');
    const sheetArea = screen.getByTestId('challenge-answer-sheet');
    expect(sheetArea).toHaveTextContent('大問 1: ミツバチの社会生活と日齢分業・完全変態');
    expect(sheetArea).toHaveTextContent('全 20 欄');
    expect(screen.getByTestId('slot-rika-2023-01-01-1')).toBeInTheDocument();
    expect(screen.getByTestId('slot-rika-2023-01-02')).toBeInTheDocument();

    unmount();

    // 2023年度・算数を指定してレンダリング（2023年度: 8ページ、18スロット）
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2023&subject=sansu']}>
        <FinalChallengePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('2023年度');
    expect(screen.getByTestId('challenge-exam-badge')).toHaveTextContent('算数');
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 8');
    expect(screen.getByTestId('challenge-answer-sheet')).toHaveTextContent('全 18 欄');
    expect(screen.getByTestId('slot-sansu-2023-01-01')).toBeInTheDocument();
    expect(screen.getByTestId('slot-sansu-2023-02-01')).toBeInTheDocument();
  });
});

