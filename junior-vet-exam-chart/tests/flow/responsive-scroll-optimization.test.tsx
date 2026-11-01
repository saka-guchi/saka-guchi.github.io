import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';

describe('スマホ・タブレット向けスクロールレスUI/UX 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('学習画面（StudyPage）のスクロール改善', () => {
    it('回答確定後にインラインの「次へ進む ❯」ボタンが出現し、固定バーまでスクロールしなくても即座に次へ進める', () => {
      // 1問セッションを開始
      useAppStore.getState().startDailySession(['rika']);

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 思い出すフェーズをスキップして選択肢表示
      const revealBtn = screen.queryByTestId('recall-skip-btn') || screen.queryByTestId('reveal-choices-btn') || screen.queryByTestId('recall-understood-btn');
      if (revealBtn) {
        fireEvent.click(revealBtn);
      }

      // 最初の選択肢ボタンをクリックして回答
      const choiceButtons = screen.getAllByRole('button').filter(b => b.getAttribute('data-testid')?.startsWith('choice-btn-'));
      expect(choiceButtons.length).toBeGreaterThan(0);
      fireEvent.click(choiceButtons[0]);

      // 結果ヘッダーにインラインの「次へ進む ❯」ボタンが出現すること
      const inlineNextBtn = screen.getByTestId('inline-next-btn');
      expect(inlineNextBtn).toBeInTheDocument();
      expect(inlineNextBtn).toHaveTextContent(/次へ進む/);

      // 固定ボトムバーにも「次へ ❯」が存在すること（スクロールゼロ・ハイブリッド配置）
      const bottomNextBtn = screen.getByTestId('next-question-btn');
      expect(bottomNextBtn).toBeInTheDocument();

      // インラインボタンを押して次へ進めること
      fireEvent.click(inlineNextBtn);
    });
  });

  describe('ホーム画面（HomePage）のカルテ進度・認定試験スクロール改善', () => {
    it('スマホ用タブ切り替え（カルテ進度 / 認定試験）で認定試験へスクロールゼロで切り替えられる', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const progressTab = screen.getByTestId('mobile-tab-progress');
      const examTab = screen.getByTestId('mobile-tab-exam');

      expect(progressTab).toBeInTheDocument();
      expect(examTab).toBeInTheDocument();

      // 認定試験タブをクリック
      fireEvent.click(examTab);

      // 認定試験カードが表示されていること
      const examCard = screen.getByTestId('card-final-challenge');
      expect(examCard).toBeInTheDocument();
      expect(examCard.className).not.toContain('cardHiddenOnMobile');

      // カルテ進度カードはモバイルで非表示クラスが付与されること
      const weaknessCard = screen.getByTestId('card-weakness');
      expect(weaknessCard.className).toContain('cardHiddenOnMobile');
    });

    it('カルテ進度ボックスの「🏆 認定試験へ ❯」ボタンを押すと認定試験へクイックジャンプできる', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const quickJumpBtn = screen.getByTestId('quick-jump-exam-btn');
      expect(quickJumpBtn).toBeInTheDocument();

      fireEvent.click(quickJumpBtn);

      const examCard = screen.getByTestId('card-final-challenge');
      expect(examCard.className).not.toContain('cardHiddenOnMobile');
    });

    it('未達成テーマ（レベルアップをめざすテーマ）がデフォルトで折りたたまれており、クリックで開閉できる', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('toggle-unmastered-skills-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/レベルアップをめざすテーマ/);

      // 初期状態では折りたたまれており、未マスターのスキル行が表示されていないこと
      expect(screen.queryByTestId('focus-study-btn-skill-rika-plant-vascular')).not.toBeInTheDocument();

      // トグルボタンをクリックして開く
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('focus-study-btn-skill-rika-plant-vascular')).toBeInTheDocument();

      // もう一度クリックして閉じる
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('focus-study-btn-skill-rika-plant-vascular')).not.toBeInTheDocument();
    });
  });
});
