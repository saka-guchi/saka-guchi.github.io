import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { QuickFlashCardModal } from '../../src/components/QuickFlashCardModal';
import { HomePage } from '../../src/pages/HomePage';
import { MemoryRouter } from 'react-router-dom';
import { getMemoryRetention, boostMemoryRetention } from '../../src/utils/memory-retention';

describe('Memory Retention Meter Boost Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('boosts memory retention value when user clicks remembered button in flashcard', () => {
    const skillId = 'skill-rika-physics-buoyancy-principle'; // アルキメデスの原理
    const initialVal = getMemoryRetention(skillId);

    render(
      <QuickFlashCardModal
        initialSkillId={skillId}
        onClose={() => {}}
      />
    );

    // 初期メーター値が表示されていること
    expect(screen.getByTestId('flashcard-retention-val')).toHaveTextContent(`${initialVal}%`);

    // カードを裏返す
    fireEvent.click(screen.getByText('👆 タップして【答えと獣医ポイント】を見る'));

    // 「🎉 思い出せた！（記憶メーターUP）」ボタンをクリック
    const boostBtn = screen.getByTestId('flashcard-remembered-btn');
    fireEvent.click(boostBtn);

    // メーターが +20% 上昇していること
    const expectedVal = Math.min(100, initialVal + 20);
    expect(screen.getByTestId('flashcard-retention-val')).toHaveTextContent(`${expectedVal}%`);
    expect(screen.getByTestId('boost-success-message')).toHaveTextContent(`+20% UP！（現在 ${expectedVal}%）`);

    // localStorageに保存されていること
    expect(getMemoryRetention(skillId)).toBe(expectedVal);
  });

  it('reflects boosted memory retention on HomePage', () => {
    const skillId = 'skill-rika-physics-buoyancy-principle';
    // 記憶メーターをブースト
    boostMemoryRetention(skillId, 25);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // ホーム画面の該当スキルのメーターが更新された数値で表示されていること
    const retentionDisplay = screen.getByTestId(`retention-score-${skillId}`);
    expect(retentionDisplay).toHaveTextContent(`${getMemoryRetention(skillId)}%`);
  });
});

