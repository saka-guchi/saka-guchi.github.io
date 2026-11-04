import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';

describe('合格カルテ完成度の整理 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('合格カルテ完成度はヘッダーから整理・削除され、不要なプログレスバーが表示されないこと', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 完成度グループがヘッダーから削除されていること
    expect(screen.queryByTestId('completion-progress-group')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completion-percent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completion-help-modal')).not.toBeInTheDocument();
  });
});
