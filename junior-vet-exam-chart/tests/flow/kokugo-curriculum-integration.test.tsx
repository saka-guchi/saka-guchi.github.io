import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ALL_PROGRESS_SKILLS } from '../../src/data/all-skills';
import { THEME_ENHANCEMENTS } from '../../src/data/vet-curriculum-enhancement';
import { FOCUS_CURRICULUM_QUESTIONS } from '../../src/data/focus-curriculum-questions';
import { FINAL_CHALLENGE_2022_KOKUGO_SECTIONS } from '../../src/data/final-challenge-2022-kokugo';
import { STAGE1_2022_KOKUGO_PAGE_CONTENTS } from '../../src/data/final-challenge-2022-kokugo-pages';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';

describe('国語科目追加＆2022年度安田学園過去問 UI/UX 総合テスト', () => {
  it('国語の全10スキルと動物カルテ・暗記カード・特訓問題が100%整合していること', () => {
    const kokugoSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'kokugo');
    expect(kokugoSkills.length).toBe(10);

    for (const skill of kokugoSkills) {
      // 1. 動物ストーリー＆暗記カードの存在確認
      const enhancement = THEME_ENHANCEMENTS[skill.id];
      expect(enhancement, `スキル ${skill.id} の動物カルテが存在すること`).toBeDefined();
      expect(enhancement.subject).toBe('kokugo');
      expect(enhancement.subjectLabel).toBe('📖 国語');
      expect(enhancement.flashCard.question.length).toBeGreaterThan(5);
      expect(enhancement.flashCard.answer.length).toBeGreaterThan(1);

      // 2. 固有特訓問題の存在確認（科目フォールバック禁止の担保）
      const focusQuestion = FOCUS_CURRICULUM_QUESTIONS.find(q => q.skillId === skill.id);
      expect(focusQuestion, `スキル ${skill.id} の固有特訓問題が存在すること`).toBeDefined();
      expect(focusQuestion?.subject).toBe('kokugo');
      expect(focusQuestion?.choices?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('2022年度 安田学園中学校 国語過去問の出題・解答スロットが完全整合していること', () => {
    expect(FINAL_CHALLENGE_2022_KOKUGO_SECTIONS.length).toBe(3);

    // 大問1: 漢字10問（配点20点）
    const sec1 = FINAL_CHALLENGE_2022_KOKUGO_SECTIONS[0];
    expect(sec1.slots.length).toBe(10);
    expect(sec1.slots[0].correctAnswer).toBe('過程');
    expect(sec1.slots[5].correctAnswer).toBe('せきせつ');

    // 大問2: 物語文 久米絵美里『嘘吹きネットワーク』（問1〜問7: 計9スロット）
    const sec2 = FINAL_CHALLENGE_2022_KOKUGO_SECTIONS[1];
    expect(sec2.slots.length).toBe(9); // 問1A, 問1B, 問2-1, 問2-2, 問3, 問4, 問5, 問6, 問7
    expect(sec2.slots.find(s => s.id === 'kokugo-2022-02-01-a')?.correctAnswer).toBe('エ');
    expect(sec2.slots.find(s => s.id === 'kokugo-2022-02-01-b')?.correctAnswer).toBe('イ');

    // 大問3: 説明文 稲垣栄洋『イネという不思議な植物』（問1〜問7）
    const sec3 = FINAL_CHALLENGE_2022_KOKUGO_SECTIONS[2];
    expect(sec3.slots.length).toBe(8); // 問1, 問2, 問3, 問4ア, 問4イ, 問5, 問6, 問7
    expect(sec3.slots.find(s => s.id === 'kokugo-2022-03-01')?.correctAnswer).toBe('ア');
    expect(sec3.slots.find(s => s.id === 'kokugo-2022-03-02')?.correctAnswer).toBe('エ');
    expect(sec3.slots.find(s => s.id === 'kokugo-2022-03-03')?.correctAnswer).toBe('種子の落ちない非脱粒性の突然変異の発見');

    // Stage 2 問題の選択肢・正解の完全性（ネタバレ不在・片肺UI禁止）
    for (const sec of FINAL_CHALLENGE_2022_KOKUGO_SECTIONS) {
      for (const slot of sec.slots) {
        expect(slot.stage2Prompt).toBeDefined();
        expect(slot.stage2CorrectAnswer).toBeDefined();
        if (slot.answerType === 'choice' || slot.answerType === 'multi_choice') {
          expect(slot.options && slot.options.length >= 2).toBe(true);
          expect(slot.stage2Options && slot.stage2Options.length >= 2).toBe(true);
        }
      }
    }

    // 問題用紙コンテンツ（全14ページ）の検証
    expect(Object.keys(STAGE1_2022_KOKUGO_PAGE_CONTENTS).length).toBe(14);
    expect(STAGE1_2022_KOKUGO_PAGE_CONTENTS[1].sections[0].questions?.length).toBe(10);
    // 傍線部マークの存在確認
    expect(STAGE1_2022_KOKUGO_PAGE_CONTENTS[2].sections[0].bodyText).toContain('kokugo-underline-1');
  });

  it('FinalChallengePage で国語選択時、読解アシストバーや不要バナーが表示されず統一フォントで表示され、漢字グリッドや文字数カウンターが動作すること', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2022&subject=kokugo']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 読解アシストバーおよび不要な図表モードバナーが表示されないこと（全科目統一）
    expect(screen.queryByText('📖 読解アシスト:')).toBeNull();
    expect(screen.queryByText(/図表付き問題用紙モード/)).toBeNull();
    expect(screen.queryByText('教材パックインポート')).toBeNull();

    // 漢字10問専用ヘッダーが表示されていること
    expect(screen.getByText('✏️ 漢字の書き取り（①〜⑤）と読み（⑥〜⑩）')).toBeInTheDocument();

    // 漢字スロットに入力して動作確認
    const slot1 = screen.getByTestId('slot-kokugo-2022-01-01');
    fireEvent.change(slot1, { target: { value: '過程' } });
    expect((slot1 as HTMLInputElement).value).toBe('過程');

    // 大問2の文字数カウンターが表示されていること（問3: 50字以内）
    const slotOpen = screen.getByTestId('slot-kokugo-2022-02-03');
    fireEvent.change(slotOpen, { target: { value: 'テストの解答を入力しました。' } });
    expect(screen.getByText(/文字数: 14 \/ 50 字/)).toBeInTheDocument();

    // 傍線部ジャンプボタンが存在すること
    const jumpBtn = screen.getByTestId('jump-btn-kokugo-2022-02-03');
    expect(jumpBtn).toBeInTheDocument();
    fireEvent.click(jumpBtn);
  });

  it('問題用紙（左側）に問7などの選択問題の選択肢（ア〜エ）が提示され、解答用紙でワンタップ入力できること', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2022&subject=kokugo']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 14ページ（大問3 問7）へ移動
    const nextBtn = screen.getByTestId('next-page-btn');
    for (let i = 1; i < 14; i++) {
      fireEvent.click(nextBtn);
    }

    // 原本スキャン画像が表示されていること（テキスト・図表切り替えは非表示）
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
    expect(screen.queryByText('📐 テキスト・図表')).toBeNull();

    // 解答用紙側（右側）にワンタップ選択ボタン（ア・イ・ウ・エ）が存在し、手動入力inputは無くボタンのみで解答できること
    const quickBtnU = screen.getByTestId('quick-btn-kokugo-2022-03-07-ウ');
    expect(quickBtnU).toBeInTheDocument();
    fireEvent.click(quickBtnU);

    // 選択されたボタンが押下状態になり、選択中表示が出ること
    expect(quickBtnU).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('✓ 選択中: 【ウ】')).toBeInTheDocument();

    const slotContainer = screen.getByTestId('slot-kokugo-2022-03-07');
    expect(slotContainer).toHaveAttribute('data-value', 'ウ');
  });

  it('原本スキャンモード切り替え時、初期表示で全体Fitサイズになり、拡大してもテキストモードにズームが干渉しないこと', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2026&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 原本スキャン画像が表示されていること（切り替えタブは非表示）
    expect(screen.queryByText('📸 原本スキャン')).toBeNull();
    expect(screen.queryByText('📐 テキスト・図表')).toBeNull();
    const scanImg = screen.getByTestId('exam-page-image');
    expect(scanImg).toBeInTheDocument();

    // ズームコントロールが表示され、初期状態は「全体」または「全体表示」であること
    expect(screen.getByText('全体')).toBeInTheDocument();
    expect(screen.getByText('全体表示')).toBeInTheDocument();

    // 拡大ボタンをクリック
    const zoomInBtn = screen.getByTitle('拡大');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('120%')).toBeInTheDocument();

    // 全体表示ボタンで100%（全体）に戻せること
    fireEvent.click(screen.getByText('全体表示'));
    expect(screen.getByText('全体')).toBeInTheDocument();
  });

  it('2023年度は国語過去問が存在しないためデータ定義に含まれず、他年度（2022, 2024, 2025, 2026）では国語が提供されること', async () => {
    const { FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT } = await import('../../src/data/final-challenge-data');

    // 2023年度: 国語なし（sections が空配列）
    expect(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2023].kokugo?.sections.length ?? 0).toBe(0);
    // 理科・算数・社会は存在すること
    expect(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2023].rika.sections.length).toBeGreaterThan(0);
    expect(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2023].sansu.sections.length).toBeGreaterThan(0);
    expect(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2023].shakai.sections.length).toBeGreaterThan(0);

    // 2022, 2024, 2025, 2026年度: 国語あり
    for (const yr of [2022, 2024, 2025, 2026] as const) {
      expect(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[yr].kokugo?.sections.length).toBeGreaterThan(0);
    }
  });

  it('ドクター認定試験はStage 1（過去問本番）のみ提供され、ヘッダーにStage 1/2切り替えタブが存在しないこと', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // Stage 1 / Stage 2 切り替えタブが存在しないこと
    expect(screen.queryByTestId('stage-1-tab')).toBeNull();
    expect(screen.queryByTestId('stage-2-tab')).toBeNull();
  });

  it('原本スキャン表示時、左右見開き（2ページ並び）を選択でき、左右ページが横並び表示され見開き単位でページめくりができること', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2026&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 初期状態は「1ページ」表示で、exam-page-image が存在すること
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
    expect(screen.getByTestId('layout-single-btn')).toBeInTheDocument();
    expect(screen.getByTestId('layout-spread-btn')).toBeInTheDocument();

    // 「📖 見開き」ボタンをクリック
    fireEvent.click(screen.getByTestId('layout-spread-btn'));

    // 見開きコンテナが表示され、左開き（理科）では左ページ(p.1)と右ページ(p.2)が表示されていること
    expect(screen.getByTestId('scan-spread-container')).toBeInTheDocument();
    expect(screen.getByTestId('exam-page-image-left')).toHaveAttribute('alt', '問題用紙 p.1');
    expect(screen.getByTestId('exam-page-image-right')).toHaveAttribute('alt', '問題用紙 p.2');

    // ページインジケーターが見開き表記（ページ: 1-2 / 6）になっていること
    expect(screen.getByTestId('page-indicator')).toHaveTextContent(/ページ: 1-2 \/ 6/);

    // 「次の見開き ▶」ボタンをクリックして2ページ進むこと（p.3-4）
    const nextBtn = screen.getByTestId('next-page-btn');
    expect(nextBtn).toHaveTextContent(/次の見開き/);
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('page-indicator')).toHaveTextContent(/ページ: 3-4 \/ 6/);

    // 「📄 1ページ」ボタンをクリックして単一ページ表示へ復帰できること
    fireEvent.click(screen.getByTestId('layout-single-btn'));
    expect(screen.queryByTestId('scan-spread-container')).toBeNull();
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
    expect(screen.getByTestId('page-indicator')).toHaveTextContent(/ページ: 3 \/ 6/);
  });

  it('国語の見開き表示では、右開き冊子の仕様に合わせて左右が反転し「左: P2 / 右: P1」で配置されること', async () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2022&subject=kokugo']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // 原本スキャンが表示されていることを確認
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();

    // 「📖 見開き」ボタンをクリック
    fireEvent.click(screen.getByTestId('layout-spread-btn'));
    expect(screen.getByTestId('scan-spread-container')).toBeInTheDocument();

    // 国語は右開き（右から左へめくる）のため、左側にP2、右側にP1が表示されていること
    const leftImage = screen.getByTestId('exam-page-image-left');
    const rightImage = screen.getByTestId('exam-page-image-right');
    expect(leftImage).toHaveAttribute('alt', '問題用紙 p.2');
    expect(rightImage).toHaveAttribute('alt', '問題用紙 p.1');

    // 次の見開き（p.3-4）に進んだ際も、左側にP4、右側にP3が表示されること
    const nextBtn = screen.getByTestId('next-page-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('exam-page-image-left')).toHaveAttribute('alt', '問題用紙 p.4');
    expect(screen.getByTestId('exam-page-image-right')).toHaveAttribute('alt', '問題用紙 p.3');
  });
});