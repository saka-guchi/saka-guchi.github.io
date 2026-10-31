import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
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

  it('FinalChallengePage で国語タブを選択時、読解アシストバーや文字数カウンター、漢字グリッドが表示されること', async () => {
    render(
      <BrowserRouter>
        <FinalChallengePage />
      </BrowserRouter>
    );

    // 国語タブをクリック
    const kokugoTab = screen.getByTestId('subject-tab-kokugo');
    expect(kokugoTab).toBeInTheDocument();
    fireEvent.click(kokugoTab);

    // 国語専用の読解アシストツールバーが表示されていること
    expect(screen.getByText('📖 読解アシスト:')).toBeInTheDocument();
    expect(screen.getByText('明朝体（入試風）')).toBeInTheDocument();
    expect(screen.getByText('ゴシック体')).toBeInTheDocument();

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
      <BrowserRouter>
        <FinalChallengePage />
      </BrowserRouter>
    );

    // 国語タブをクリック
    fireEvent.click(screen.getByTestId('subject-tab-kokugo'));

    // 14ページ（大問3 問7）へ移動
    const nextBtn = screen.getByTestId('next-page-btn');
    for (let i = 1; i < 14; i++) {
      fireEvent.click(nextBtn);
    }

    // ページ14のタイトルが表示されていること
    expect(screen.getByText(/三、大問 3 設問（問7）/)).toBeInTheDocument();

    // 【最重要】問題用紙エリアに問7の選択肢ア〜エが表示されていること
    const questionChoices = screen.getByTestId('question-choices-問7');
    expect(questionChoices).toBeInTheDocument();
    expect(questionChoices).toHaveTextContent(/ア 比喩や倒置法/);
    expect(questionChoices).toHaveTextContent(/イ 一般的な見方/);
    expect(questionChoices).toHaveTextContent(/ウ 読み手が感じる疑問/);
    expect(questionChoices).toHaveTextContent(/エ 読み手に語りかけるような文体/);

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
});
