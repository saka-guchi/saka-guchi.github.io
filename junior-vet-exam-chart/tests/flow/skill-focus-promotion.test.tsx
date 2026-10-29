import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { App } from '../../src/App';
import { useAppStore } from '../../src/store/appStore';
import { getSkillStage, setSkillStage, promoteSkillStage } from '../../src/utils/mastery-helper';

describe('Skill Focus & Level Promotion Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    useAppStore.getState().resetSession();
  });

  it('promotes skill stage when promoteSkillStage is called', () => {
    const skillId = 'skill-rika-plant-vascular';
    // 初期状態は M2 (Lv.2 てごたえ)
    expect(getSkillStage(skillId, 'M2')).toBe('M2');

    // 昇格
    const promo = promoteSkillStage(skillId);
    expect(promo).not.toBeNull();
    expect(promo?.prevStage).toBe('M2');
    expect(promo?.newStage).toBe('M3');

    // 保存されていることを確認
    expect(getSkillStage(skillId, 'M2')).toBe('M3');
  });

  it('navigates to study when clicking "🎯 この単元を特訓してLvアップ！" button on HomePage', async () => {
    render(<App />);

    // 「維管束の配置」の特訓ボタンを取得
    const focusBtn = screen.getByTestId('focus-study-btn-skill-rika-plant-vascular');
    expect(focusBtn).toBeInTheDocument();
    expect(focusBtn).toHaveTextContent('🎯 この単元を特訓してLvアップ！');

    // クリックして特訓スタート
    fireEvent.click(focusBtn);

    // /study 画面に遷移していることを確認
    await waitFor(() => {
      expect(screen.getByTestId('study-page')).toBeInTheDocument();
    });

    // ストアに対象スキルIDがセットされていること
    expect(useAppStore.getState().currentFocusSkillId).toBe('skill-rika-plant-vascular');
  });

  it('allows starting focus study directly from the back of the flashcard', async () => {
    render(<App />);

    // 暗記カードを開く
    const flashBtn = screen.getByTestId('quick-flash-btn-skill-rika-plant-vascular');
    fireEvent.click(flashBtn);
    expect(screen.getByTestId('flashcard-modal')).toBeInTheDocument();

    // カードをタップして裏返す
    const flipArea = screen.getByText('👆 タップして【答えと獣医ポイント】を見る');
    fireEvent.click(flipArea);

    // 裏面に「🎯 今すぐLvアップ問題に挑戦！ ❯」ボタンが表示される
    const startFromCardBtn = screen.getByTestId('flashcard-start-focus-btn');
    expect(startFromCardBtn).toBeInTheDocument();

    // クリックするとモーダルが閉じて学習画面へ遷移する
    fireEvent.click(startFromCardBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('flashcard-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('study-page')).toBeInTheDocument();
    });
  });
});
