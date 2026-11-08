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
      // 選択式問題が含まれる特訓セッションを開始
      useAppStore.getState().startSkillFocusSession('skill-rika-2023-bee-division');

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

      // 重複ボタンとならず、下部ボトムバーの「次へ →」ボタンに一本化されていること
      expect(screen.queryByTestId('inline-next-btn')).not.toBeInTheDocument();

      // 固定ボトムバーの「次へ →」が存在すること
      const bottomNextBtn = screen.getByTestId('next-question-btn');
      expect(bottomNextBtn).toBeInTheDocument();
      expect(bottomNextBtn).toHaveTextContent(/次へ/);

      // ボトムバーのボタンを押して次へ進めること
      fireEvent.click(bottomNextBtn);
    });
  });

  describe('ホーム画面（HomePage）の症例スタディ・認定試験スクロール改善', () => {
    it('スマホ用タブ切り替え（症例スタディ / 認定試験）で認定試験へスクロールゼロで切り替えられる', () => {
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

    it('各テーマ右上のLvバッジをクリックするとLvってなに？モーダルが表示され、レベルアップ方法が確認できる', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      // 未達成テーマのアコーディオンを開く
      fireEvent.click(screen.getByTestId('toggle-unmastered-skills-btn'));

      // 最初のテーマのLvバッジを取得してクリック
      const lvBadge = screen.getByTestId('level-badge-skill-rika-plant-vascular');
      expect(lvBadge).toBeInTheDocument();
      fireEvent.click(lvBadge);

      // モーダルが開き、レベルアップ方法が明記されていること
      expect(screen.getByText('知識のレベル（Lv）ってなに？')).toBeInTheDocument();
      expect(screen.getByText(/場面が変わった応用問題に正解で/)).toBeInTheDocument();

      // Lv.1〜Lv.4（カルテマスターまで）が存在し、Lv.5・Lv.6（獣医師チャレンジ側の領域）は削除されていること
      expect(screen.getByTestId('level-help-item-M1')).toBeInTheDocument();
      expect(screen.getByTestId('level-help-item-M2')).toBeInTheDocument();
      expect(screen.getByTestId('level-help-item-M3')).toBeInTheDocument();
      expect(screen.getByTestId('level-help-item-M4')).toBeInTheDocument();
      expect(screen.queryByTestId('level-help-item-M5')).not.toBeInTheDocument();
      expect(screen.queryByTestId('level-help-item-M6')).not.toBeInTheDocument();
    });

    it('未達成テーマ（治療中の症例）がデフォルトで折りたたまれており、クリックで開閉できる', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('toggle-unmastered-skills-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/治療中の症例/);

      // 初期状態では折りたたまれており、未マスターのスキル行が表示されていないこと
      expect(screen.queryByTestId('focus-study-btn-skill-rika-plant-vascular')).not.toBeInTheDocument();

      // トグルボタンをクリックして開く
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('focus-study-btn-skill-rika-plant-vascular')).toBeInTheDocument();

      // もう一度クリックして閉じる
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('focus-study-btn-skill-rika-plant-vascular')).not.toBeInTheDocument();
    });

    it('各テーマの動物アイコンをクリックまたはホバーすると患者名が表示され、右上に「出題教科」バッジが表示される', () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      // 未達成テーマを開く
      fireEvent.click(screen.getByTestId('toggle-unmastered-skills-btn'));

      // 「出題教科：🧪 理科」バッジが右上に表示されていること
      const subjectBadges = screen.getAllByText('出題教科：🧪 理科');
      expect(subjectBadges.length).toBeGreaterThan(0);

      // 動物アイコンのロール要素（button）を取得
      const patientIconWraps = screen.getAllByRole('button', { name: /患者:/ });
      expect(patientIconWraps.length).toBeGreaterThan(0);

      // 初期状態では吹き出しに _patientTooltipVisible_ クラスが付いていない
      const tooltips = document.querySelectorAll('._patientTooltip_733e29, [class*="patientTooltip"]');
      expect(tooltips.length).toBeGreaterThan(0);
      expect(tooltips[0].className).not.toContain('patientTooltipVisible');

      // アイコンクリックで対象のツールチップに patientTooltipVisible クラスが付与される
      const firstPatientIcon = patientIconWraps[0];
      fireEvent.click(firstPatientIcon);
      expect(tooltips[0].className).toContain('patientTooltipVisible');
    });
  });
});
