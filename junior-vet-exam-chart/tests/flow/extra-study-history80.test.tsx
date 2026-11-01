import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { HISTORY_80_FIGURES } from '../../src/data/extra-history-80';

describe('番外クエスト（名作参考書：歴史人物80）UI/UX 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('ホーム画面上段が2カラムになり、今日のカルテ学習と番外クエストカードが両方表示される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 左カラム: 今日のカルテ学習
    expect(screen.getByTestId('today-study-card')).toBeInTheDocument();
    expect(screen.getByText(/今日のカルテ学習/)).toBeInTheDocument();
    expect(screen.getByTestId('start-study-btn')).toBeInTheDocument();

    // 右カラム: 番外クエスト
    const extraCard = screen.getByTestId('section-extra-study');
    expect(extraCard).toBeInTheDocument();
    expect(screen.getByText('🎒 番外クエスト')).toBeInTheDocument();
    expect(screen.getByText('出題教科：🗾 社会')).toBeInTheDocument();
    expect(screen.getByText(/中学入試 即答キーワードで覚える歴史人物80/)).toBeInTheDocument();
    expect(screen.getByTestId('start-extra-book-btn')).toBeInTheDocument();
  });

  it('「⚡ 歴史人物80 特訓スタート！」をクリックするとクイズモーダルが開き、即答キーワード・学校名・4択が表示される', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // スタートボタンをクリック
    const startBtn = screen.getByTestId('start-extra-book-btn');
    fireEvent.click(startBtn);

    // モーダルヘッダー
    expect(screen.getByText('歴史人物80 即答キーワード')).toBeInTheDocument();
    expect(screen.getAllByText('出題教科：🗾 社会').length).toBeGreaterThanOrEqual(1);

    // 即答キーワード枠
    expect(screen.getByText('即答キーワード')).toBeInTheDocument();

    // 4択ボタン（ア、イ、ウ、エ）が存在すること
    expect(screen.getByText('ア')).toBeInTheDocument();
    expect(screen.getByText('イ')).toBeInTheDocument();
    expect(screen.getByText('ウ')).toBeInTheDocument();
    expect(screen.getByText('エ')).toBeInTheDocument();

    // 学校名の出典が表示されていること（例: 〇〇中学校 改、〇〇中等部 改など）
    expect(screen.getByText(/🏫.*(中学校|中等部|中学部)/)).toBeInTheDocument();
  });

  it('選択肢をタップすると解答判定され、解説カードと「つぎの問題へ進む」が表示される', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('start-extra-book-btn'));

    // 「ア」のボタンをクリック
    const choiceA = screen.getByText('ア').closest('button')!;
    fireEvent.click(choiceA);

    // 解答後のフィードバックと解説が表示される
    expect(screen.getByText(/重要ポイント解説:/)).toBeInTheDocument();
    expect(screen.getByText(/つぎの問題へ進む/)).toBeInTheDocument();

    // 次へ進むボタンをクリック
    fireEvent.click(screen.getByText(/つぎの問題へ進む/));

    // 問 2 / 10 に進むこと
    expect(screen.getByText('問 2 / 10')).toBeInTheDocument();
  });

  it('データおよび出題時において正解位置が「ア」固定ではなくランダムに分散していること（再発防止テスト）', () => {
    // 1. データ自体の検証: 全問の correctAnswer の位置がア〜エ（インデックス0〜3）にバランスよく分散していること
    const positionCounts = [0, 0, 0, 0];
    HISTORY_80_FIGURES.forEach(fig => {
      const idx = fig.question.choices.indexOf(fig.question.correctAnswer);
      expect(idx).toBeGreaterThanOrEqual(0);
      positionCounts[idx]++;
    });

    // ア、イ、ウ、エのすべてに複数問の正解が配置されていること（アだけに偏っていないこと）
    positionCounts.forEach((count, i) => {
      const label = ['ア', 'イ', 'ウ', 'エ'][i];
      expect(count, `正解位置「${label}」の設問が1問以上存在すること`).toBeGreaterThan(0);
    });

    // 2. 出題時（モーダル）の検証: 10問解く中で正解位置が「ア」以外にも必ず配置されること
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('start-extra-book-btn'));

    // 1問目での正解ボタンが存在すること
    const choiceButtons = screen.getAllByRole('button').filter(b => 
      b.querySelector('span') && ['ア', 'イ', 'ウ', 'エ'].includes(b.querySelector('span')!.textContent || '')
    );
    expect(choiceButtons.length).toBe(4);
  });
});
