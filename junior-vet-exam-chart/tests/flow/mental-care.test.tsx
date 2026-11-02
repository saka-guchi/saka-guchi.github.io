import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { MentalCareModal } from '../../src/components/MentalCareModal';
import { ParentDashboardModal } from '../../src/components/ParentDashboardModal';

vi.mock('../../src/utils/version-checker', () => ({
  checkForAppUpdate: vi.fn().mockResolvedValue({ hasUpdate: false, isOnline: true }),
  isNetworkConnected: () => true,
}));

describe('こころの相談室・メンタルケア学習機能 総合結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('ホーム画面のヘッダーボタンおよびバナーからこころの相談室モーダルが開閉できること', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('today-study-card')).toBeInTheDocument();
    });

    // ヘッダーボタンから開く
    const headerBtn = screen.getByTestId('header-mental-care-btn');
    expect(headerBtn).toBeInTheDocument();
    fireEvent.click(headerBtn);

    expect(screen.getByTestId('mental-care-modal')).toBeInTheDocument();
    expect(screen.getByText('🐾 こころの相談室・マインドカルテ')).toBeInTheDocument();

    // 閉じるボタン
    const closeBtn = screen.getByTestId('mental-care-close-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('mental-care-modal')).not.toBeInTheDocument();

    // バナーから開く
    const banner = screen.getByTestId('banner-mental-care');
    expect(banner).toBeInTheDocument();
    fireEvent.click(banner);
    expect(screen.getByTestId('mental-care-modal')).toBeInTheDocument();
  });

  it('こころのお天気チェックインが動作し、フィードバックが表示されること', async () => {
    const handleClose = () => {};
    render(
      <MentalCareModal isOpen={true} onClose={handleClose} initialTab="puzzle" />
    );

    expect(screen.getByTestId('weather-checkin-bar')).toBeInTheDocument();
    const rainBtn = screen.getByTestId('weather-btn-rainy');
    fireEvent.click(rainBtn);

    expect(screen.getByTestId('weather-toast')).toBeInTheDocument();
    expect(screen.getByText(/お天気を記録したよ！/)).toBeInTheDocument();
  });

  it('タブ1: モヤモヤ仕分けパズルでカードの仕分けと自由追加が正常に動作すること', async () => {
    const handleClose = () => {};
    render(
      <MentalCareModal isOpen={true} onClose={handleClose} initialTab="puzzle" />
    );

    // 最初のカード（先生の贔屓）が表示されていることを確認
    expect(screen.getByText(/先生が男子ばかり褒めたり贔屓/)).toBeInTheDocument();

    // 「まわりの箱（変えられない）」へ仕分け
    const btnSortOthers = screen.getByTestId('btn-sort-others');
    fireEvent.click(btnSortOthers);

    // 解説フィードバックが表示され、まわりの箱にチップが入ること
    expect(screen.getByText(/相手の課題/)).toBeInTheDocument();

    // 独自のモヤモヤ自由追加フォームのテスト
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '友達から返事が遅くて不安' } });
    const addBtn = screen.getByTestId('btn-add-custom-sort');
    fireEvent.click(addBtn);

    expect(screen.getByText(/友達から返事が遅くて不安/)).toBeInTheDocument();
  });

  it('タブ2: お守りコーピング図鑑でガチャ、マイお守り登録、お試しフィードバックが動作すること', async () => {
    const handleClose = () => {};
    render(
      <MentalCareModal isOpen={true} onClose={handleClose} initialTab="coping" />
    );

    // コーピングタブに切り替え
    const tabCoping = screen.getByTestId('tab-coping');
    fireEvent.click(tabCoping);

    // コーピングレシピが表示されていること
    expect(screen.getByText(/冷たいお水をゆっくり一口飲む/)).toBeInTheDocument();

    // ガチャボタンのクリック
    const gachaBtn = screen.getByTestId('btn-coping-gacha');
    fireEvent.click(gachaBtn);

    // マイお守り登録トグル（cope-2を登録）
    const saveBtn = screen.getByTestId('save-coping-cope-2');
    fireEvent.click(saveBtn);

    // マイお守りフィルター
    const filterSavedBtn = screen.getByTestId('filter-saved-coping');
    fireEvent.click(filterSavedBtn);
    expect(screen.getByText(/いらない紙を思いっきりビリビリ破く/)).toBeInTheDocument();

    // やってみたボタン
    const tryButtons = screen.getAllByText('✨ やってみた！');
    fireEvent.click(tryButtons[0]);
    expect(screen.getByText(/試したね！えらい！/)).toBeInTheDocument();
  });

  it('タブ3: 哲学対話ノートで対話シナリオが進行し、こころの処方箋が受け取れること', async () => {
    const handleClose = () => {};
    render(
      <MentalCareModal isOpen={true} onClose={handleClose} initialTab="philosophy" />
    );

    // 哲学対話タブに切り替え
    const tabPhilosophy = screen.getByTestId('tab-philosophy');
    fireEvent.click(tabPhilosophy);

    // 4つのテーマが表示されていること（文献ベースの怒りと一次感情トピックを含む）
    expect(screen.getByText(/「えこひいき」って、なんでこんなにモヤモヤするんだろう？/)).toBeInTheDocument();
    expect(screen.getByText(/「学校を休む」って、いけないことなのかな？/)).toBeInTheDocument();
    expect(screen.getByText(/「みんなと仲良く」って、本当にしなきゃいけないの？/)).toBeInTheDocument();
    expect(screen.getByText(/「怒り」のうしろに隠れている、本当の気持ちって？/)).toBeInTheDocument();

    // ステップ1の選択肢をクリック
    const choiceBtn0 = screen.getByTestId('choice-btn-0');
    fireEvent.click(choiceBtn0);

    // リアクションカードが表示されること
    expect(screen.getByTestId('reaction-card')).toBeInTheDocument();

    // 次のステップへ進む
    const nextBtn1 = screen.getByTestId('btn-next-step');
    fireEvent.click(nextBtn1);

    // ステップ2の選択肢をクリック
    const choiceBtnStep2 = screen.getByTestId('choice-btn-0');
    fireEvent.click(choiceBtnStep2);
    const nextBtn2 = screen.getByTestId('btn-next-step');
    fireEvent.click(nextBtn2);

    // ステップ3の選択肢をクリック
    const choiceBtnStep3 = screen.getByTestId('choice-btn-0');
    fireEvent.click(choiceBtnStep3);
    const nextBtn3 = screen.getByTestId('btn-next-step');
    fireEvent.click(nextBtn3);

    // 処方箋カードが表示されること
    expect(screen.getByTestId('prescription-card')).toBeInTheDocument();
    expect(screen.getByText(/こころの処方箋/)).toBeInTheDocument();
  });

  it('親向け画面（指導医ログ）の「こころの見守り処方箋」タブでお天気サイン・親のアクションチェックリストが動作すること', async () => {
    // 子どもがお天気「あめ」を記録した状態を模倣
    localStorage.setItem(
      'junior_vet_mental_today_checkin',
      JSON.stringify({
        date: '2026-11-02',
        weather: 'rainy',
        weatherLabel: 'あめ（つらい・心が雨降り）',
      })
    );

    render(<ParentDashboardModal onClose={() => {}} />);

    // 「こころの見守り処方箋」タブをクリック
    const tabMental = screen.getByTestId('parent-tab-mental');
    expect(tabMental).toBeInTheDocument();
    fireEvent.click(tabMental);

    // お子さんのこころのお天気サインカードが表示されていること
    expect(screen.getByTestId('child-mental-forecast-card')).toBeInTheDocument();
    expect(screen.getByText(/あめ（つらい・心が雨降り）/)).toBeInTheDocument();

    // 今日かけたい言葉カードとNGワードカードが表示されていること
    expect(screen.getByTestId('recommended-phrases-card')).toBeInTheDocument();
    expect(screen.getByTestId('ng-words-card')).toBeInTheDocument();

    // 家庭ケアアクションのチェックリストをクリックして完了状態にすること
    const careItem = screen.getByTestId('parent-action-item-care-1');
    expect(careItem).toBeInTheDocument();
    fireEvent.click(careItem);

    // 完了トーストが表示されること
    expect(screen.getByTestId('parent-action-done-toast')).toBeInTheDocument();
    expect(screen.getByText(/ナイスサポート！お子さんの心の安全基地が守られました/)).toBeInTheDocument();
  });
});
