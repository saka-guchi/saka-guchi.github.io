import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';

describe('HomePage - ミケちゃんの世界の名言バナー UI結合テスト', () => {
  it('renders quote banner with nurse cat Mike, quote, author, and explanation', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const banner = screen.getByTestId('mentor-quote-bar');
    const withinBanner = within(banner);

    // ナース猫のミケちゃんの見出しとバッジ
    expect(withinBanner.getByText('ナース猫のミケちゃん:')).toBeInTheDocument();

    // カテゴリフィルターピルが表示されていること
    expect(withinBanner.getByRole('button', { name: '🌟 すべて' })).toBeInTheDocument();
    expect(withinBanner.getByRole('button', { name: '🔥 渇！気合' })).toBeInTheDocument();
    expect(withinBanner.getByRole('button', { name: '🌸 心のお守り' })).toBeInTheDocument();
    expect(withinBanner.getByRole('button', { name: '📚 入試頻出' })).toBeInTheDocument();

    // 別の名言を聞くボタン
    const nextBtn = withinBanner.getByRole('button', { name: '別の名言を聞く' });
    expect(nextBtn).toBeInTheDocument();

    // 解説タグとミケちゃんの言葉（「先生！」プレフィックスは削除され、主語は「君」に統一）
    expect(withinBanner.getByText('🐾 ミケちゃんの言葉')).toBeInTheDocument();
    expect(withinBanner.queryByText(/「先生！/)).not.toBeInTheDocument();
  });

  it('filters quotes by category pills', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 「🌸 心のお守り」をクリック
    const empowerBtn = screen.getByRole('button', { name: '🌸 心のお守り' });
    fireEvent.click(empowerBtn);

    const banner = screen.getByTestId('mentor-quote-bar');
    expect(banner.textContent).toContain('🌸 心のお守り');

    // 「🔥 渇！気合」をクリック
    const gritBtn = screen.getByRole('button', { name: '🔥 渇！気合' });
    fireEvent.click(gritBtn);
    expect(banner.textContent).toContain('🔥 渇！気合');
  });

  it('switches quote when clicking "別の名言を聞く" or avatar', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const banner = screen.getByTestId('mentor-quote-bar');
    const initialText = banner.textContent || '';

    // ボタンをクリック
    const nextBtn = screen.getByRole('button', { name: '別の名言を聞く' });
    fireEvent.click(nextBtn);

    // 名言または解説が変わる（ランダムだが自分以外から選ばれるので必ず変わる）
    const updatedText = banner.textContent || '';
    expect(updatedText).not.toBe(initialText);

    // 猫アバターをクリックしても切り替わる
    const avatar = screen.getByLabelText('ナース猫のミケちゃん（クリックで別の名言）');
    fireEvent.click(avatar);
    const thirdText = banner.textContent || '';
    expect(thirdText).not.toBe(updatedText);
  });
});
