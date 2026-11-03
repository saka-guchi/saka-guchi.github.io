import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';

describe('合格カルテ完成度の解説（マウスオーバー＆クリックガイド） 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('合格カルテ完成度にマウスオーバー用 title 属性が存在し、クリックで100%達成ガイドモーダルが開く', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 完成度グループが存在し、title属性があること
    const progressGroup = screen.getByTestId('completion-progress-group');
    expect(progressGroup).toBeInTheDocument();
    expect(progressGroup).toHaveAttribute('title');
    expect(progressGroup.getAttribute('title')).toContain('全56症例の「記憶メーター（定着度）」の平均値');

    // 初期状態ではモーダルは開いていない
    expect(screen.queryByTestId('completion-help-modal')).not.toBeInTheDocument();

    // クリックすると解説モーダルが開く
    fireEvent.click(progressGroup);
    expect(screen.getByTestId('completion-help-modal')).toBeInTheDocument();

    // 100%にするための3つのアクションが記載されていること
    expect(screen.getByTestId('action-item-focus')).toHaveTextContent(/症例の「特訓問題」を解いて正解する/);
    expect(screen.getByTestId('action-item-flashcard')).toHaveTextContent(/「トリアージ・カード」をサクッとめくって復習する/);
    expect(screen.getByTestId('action-item-daily')).toHaveTextContent(/「本日の診察」を毎日解く/);

    // 閉じるボタンで閉じられること
    const closeBtn = screen.getByTestId('close-completion-help-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('completion-help-modal')).not.toBeInTheDocument();
  });

  it('ガイドモーダルのジャンプボタンを押すとカルテ進度へ誘導される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // モーダルを開く
    fireEvent.click(screen.getByTestId('completion-progress-group'));
    expect(screen.getByTestId('completion-help-modal')).toBeInTheDocument();

    // ジャンプボタンを押すとモーダルが閉じる
    const jumpBtn = screen.getByTestId('jump-to-weakness-btn');
    fireEvent.click(jumpBtn);
    expect(screen.queryByTestId('completion-help-modal')).not.toBeInTheDocument();
  });
});

