import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { setSkillStage } from '../../src/utils/mastery-helper';

describe('受験カルテ進度マスター（全快）キャラクターのスタンプ帳連動 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('ホーム画面のスタンプ帳エリアでカルテ全快プレビューへ切り替えられる', async () => {
    // ウサギのロップくん（維管束の配置）を M4（マスター）に設定
    setSkillStage('skill-rika-plant-vascular', 'M4');

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // スタンプヘッダーにカルテ全快数が含まれていること
    expect(screen.getByText(/元気にした動物スタンプ帳/)).toBeInTheDocument();
    expect(screen.getByText(/カルテ全快:/)).toBeInTheDocument();

    // プレビュータブ（カルテ全快）をクリック
    const chartTab = screen.getByTestId('preview-tab-chart');
    expect(chartTab).toBeInTheDocument();
    fireEvent.click(chartTab);

    // ウサギのロップくんのスロットが表示され、全快（🐰）になっていること
    const lopSlot = screen.getByTestId('preview-chart-stamp-skill-rika-plant-vascular');
    expect(lopSlot).toBeInTheDocument();
    expect(lopSlot).toHaveTextContent('🐰');
  });

  it('スタンプ帳モーダルで「カルテ全快ドクタースタンプ」タブを開き、ウサギのロップくんの全快メッセージと豆知識が飛び出す', async () => {
    // ウサギのロップくん（skill-rika-plant-vascular）を全快マスターに設定
    setSkillStage('skill-rika-plant-vascular', 'M4');

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // スタンプ帳を開く
    const openBtn = screen.getByTestId('open-stamp-book-btn');
    fireEvent.click(openBtn);

    // モーダルが表示され、2つのタブが存在すること
    const dailyTab = screen.getByTestId('stamp-tab-daily');
    const chartTab = screen.getByTestId('stamp-tab-chart');
    expect(dailyTab).toBeInTheDocument();
    expect(chartTab).toBeInTheDocument();

    // カルテ全快タブをクリック
    fireEvent.click(chartTab);

    // カルテ全快グリッドが表示されること
    expect(screen.getByTestId('chart-stamp-grid')).toBeInTheDocument();

    // ウサギのロップくんのスタンプカードが表示されていること
    const lopCard = screen.getByTestId('chart-animal-stamp-skill-rika-plant-vascular');
    expect(lopCard).toBeInTheDocument();
    expect(lopCard).toHaveTextContent('ウサギのロップくん');
    expect(lopCard).toHaveTextContent('🎉 全快！');
    expect(lopCard).toHaveTextContent('維管束の配置');

    // 最初はまだ開かれていない（タップして飛び出す案内がある）
    expect(screen.queryByTestId('chart-stamp-cheer-skill-rika-plant-vascular')).not.toBeInTheDocument();

    // カードをタップする
    fireEvent.click(lopCard);

    // セリフと急所ポイントが飛び出すこと！
    const cheerEl = screen.getByTestId('chart-stamp-cheer-skill-rika-plant-vascular');
    const factEl = screen.getByTestId('chart-stamp-fact-skill-rika-plant-vascular');
    expect(cheerEl).toBeInTheDocument();
    expect(factEl).toBeInTheDocument();
    expect(cheerEl).toHaveTextContent('道管と師管の場所');

    // 再度クリックしても閉じずに開きっぱなしが維持されること
    fireEvent.click(lopCard);
    expect(screen.getByTestId('chart-stamp-cheer-skill-rika-plant-vascular')).toBeInTheDocument();
  });

  it('未全快の患者キャラクターはロック表示され、特訓ボタンから特訓セッションへ行ける', async () => {
    // つるかめ算（skill-sansu-tsurukame-elimination、カメのカメ吉）は初期M3（未マスター）
    setSkillStage('skill-sansu-tsurukame-elimination', 'M2');

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // スタンプ帳を開く
    fireEvent.click(screen.getByTestId('open-stamp-book-btn'));
    fireEvent.click(screen.getByTestId('stamp-tab-chart'));

    // カメのカメ吉のスタンプカード
    const kameCard = screen.getByTestId('chart-animal-stamp-skill-sansu-tsurukame-elimination');
    expect(kameCard).toBeInTheDocument();
    expect(kameCard).toHaveTextContent('カメのカメ吉');
    expect(kameCard).toHaveTextContent('🩺 治療中');
    expect(kameCard).toHaveTextContent('🔒');

    // 特訓ボタンが存在すること
    const trainBtn = screen.getByTestId('train-from-stamp-skill-sansu-tsurukame-elimination');
    expect(trainBtn).toBeInTheDocument();
    expect(trainBtn).toHaveTextContent('この単元を特訓して全快にする');

    // 特訓ボタンをクリックするとモーダルが閉じて特訓へ進むこと
    fireEvent.click(trainBtn);
    expect(screen.queryByTestId('chart-stamp-grid')).not.toBeInTheDocument();
  });
});
