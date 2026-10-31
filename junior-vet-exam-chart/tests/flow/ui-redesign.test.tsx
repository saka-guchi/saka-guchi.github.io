import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../src/App';
import { DoctorCertificateModal } from '../../src/components/DoctorCertificateModal';
import { useAppStore } from '../../src/store/appStore';

describe('UI Redesign & New Features Integration Tests', () => {
  beforeEach(() => {
    window.location.hash = '#/';
    useAppStore.getState().resetSession();
    localStorage.clear();
  });

  it('cycles through color themes when clicking the theme button', () => {
    render(<App />);

    const themeBtn = screen.getByLabelText('テーマ切り替え');
    expect(themeBtn).toBeInTheDocument();

    // 1回目のクリックで sakura
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('sakura');
    expect(localStorage.getItem('junior_vet_theme')).toBe('sakura');

    // 2回目のクリックで mint
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint');
    expect(localStorage.getItem('junior_vet_theme')).toBe('mint');

    // 3回目のクリックで lavender
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('lavender');
    expect(localStorage.getItem('junior_vet_theme')).toBe('lavender');

    // 4回目のクリックで night
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
    expect(localStorage.getItem('junior_vet_theme')).toBe('night');

    // 5回目のクリックで default（属性削除）
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggles sound effects button', () => {
    render(<App />);
    const soundBtn = screen.getByLabelText('効果音切り替え');
    expect(soundBtn).toBeInTheDocument();

    // デフォルトは🔔
    expect(soundBtn).toHaveTextContent('🔔');

    // クリックで消音🔕
    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent('🔕');

    // 再度クリックで有効化🔔
    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent('🔔');
  });

  it('filters topics by subject tabs (Science, Math, Social Studies, Japanese)', () => {
    render(<App />);

    // 初期状態では全56テーマ（国語10テーマ追加）表示
    expect(screen.getByText('🌟 すべて (56)')).toBeInTheDocument();

    // 国語ボタンが存在することを確認
    expect(screen.getByText('📖 国語 (10)')).toBeInTheDocument();

    // 「🧪 理科 (12)」をクリック
    const rikaBtn = screen.getByText('🧪 理科 (12)');
    fireEvent.click(rikaBtn);

    // 理科のテーマが表示され、算数のテーマが表示されていないことを確認
    expect(screen.getByText('維管束の配置（内道外師）')).toBeInTheDocument();
    expect(screen.queryByText('つるかめ算と消去算の条件整理')).not.toBeInTheDocument();

    // 「📐 算数 (17)」をクリック
    const sansuBtn = screen.getByText('📐 算数 (17)');
    fireEvent.click(sansuBtn);

    // 算数のテーマが表示され、理科のテーマが表示されていないことを確認
    expect(screen.getByText('つるかめ算と消去算の条件整理')).toBeInTheDocument();
    expect(screen.queryByText('維管束の配置（内道外師）')).not.toBeInTheDocument();

    // 「📖 国語 (10)」をクリック
    const kokugoBtn = screen.getByText('📖 国語 (10)');
    fireEvent.click(kokugoBtn);
    expect(screen.getByText('漢字の書き取りと部首・同音異義語')).toBeInTheDocument();
    expect(screen.queryByText('つるかめ算と消去算の条件整理')).not.toBeInTheDocument();

    // 「🌟 すべて (56)」に戻す
    fireEvent.click(screen.getByText('🌟 すべて (56)'));
    expect(screen.getByText('維管束の配置（内道外師）')).toBeInTheDocument();
    expect(screen.getByText('つるかめ算と消去算の条件整理')).toBeInTheDocument();
    expect(screen.getByText('漢字の書き取りと部首・同音異義語')).toBeInTheDocument();
  });

  it('opens and flips quick flashcard modal', () => {
    render(<App />);

    // 「サクッと暗記カード」ボタンをクリック
    const flashBtns = screen.getAllByText(/暗記カード/);
    fireEvent.click(flashBtns[0]);

    // モーダルが表示される
    expect(screen.getByTestId('flashcard-modal')).toBeInTheDocument();
    expect(screen.getByText('サクッと暗記カード')).toBeInTheDocument();

    // 科目バッジが「🧪 理科」であり、高校分野の「生物」ではないこと
    expect(screen.getByTestId('flashcard-subject-badge')).toHaveTextContent('🧪 理科');
    expect(screen.queryByText('生物')).not.toBeInTheDocument();

    // 表面の問題が表示されている
    expect(screen.getByText('【問題】頭の中でパッと思い出せるかな？')).toBeInTheDocument();

    // カードをタップして裏返す
    const flipArea = screen.getByText('👆 タップして【答えと獣医ポイント】を見る');
    fireEvent.click(flipArea);

    // 裏面の解答が表示される
    expect(screen.getByText('✨ ズバリ解答！')).toBeInTheDocument();

    // 閉じるボタンで閉じる
    const closeBtn = screen.getByLabelText('閉じる');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('flashcard-modal')).not.toBeInTheDocument();
  });

  it('displays mentor cat message and dynamic streak and completion percentage', async () => {
    localStorage.setItem('junior_vet_study_streak', '3');
    render(<App />);
    expect(screen.getByText(/ナース猫のミケちゃん:/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('streak-badge')).toHaveTextContent('3日れんぞく！');
    });
    const completionEl = screen.getByTestId('completion-percent');
    expect(completionEl).toBeInTheDocument();
    // 固定値のダミーではなく、各単元の定着度平均値が数値%としてレンダリングされる
    expect(completionEl.textContent).toMatch(/^\d+%$/);
  });

  it('keeps opened stamp message open when clicked again or when another stamp is clicked', () => {
    localStorage.setItem('junior_vet_earned_stamps', JSON.stringify(['stamp-dog-shiba', 'stamp-cat-mike']));
    render(<App />);
    // スタンプ帳ボタンをクリック
    const stampAlbumBtn = screen.getByTestId('open-stamp-book-btn');
    fireEvent.click(stampAlbumBtn);

    // シール帳モーダルが開く
    expect(screen.getByText('🐾 みならい獣医さんの動物シール帳')).toBeInTheDocument();

    // 獲得済みスタンプ1（stamp-dog-shiba）
    const dogStamp = screen.getByTestId('animal-stamp-stamp-dog-shiba');
    fireEvent.click(dogStamp);

    // クリック後にメッセージと豆知識が飛び出す！
    expect(screen.getByTestId('stamp-cheer-stamp-dog-shiba')).toBeInTheDocument();
    expect(screen.getByTestId('stamp-fact-stamp-dog-shiba')).toBeInTheDocument();

    // 再度クリックしても閉じずに「開きっぱなし」が維持されること！
    fireEvent.click(dogStamp);
    expect(screen.getByTestId('stamp-cheer-stamp-dog-shiba')).toBeInTheDocument();

    // 別の獲得済みスタンプ2（stamp-cat-mike）をクリック
    const catStamp = screen.getByTestId('animal-stamp-stamp-cat-mike');
    fireEvent.click(catStamp);

    // スタンプ2が開くだけでなく、スタンプ1も閉じずに「両方開きっぱなし」になっていること！
    expect(screen.getByTestId('stamp-cheer-stamp-dog-shiba')).toBeInTheDocument();
    expect(screen.getByTestId('stamp-cheer-stamp-cat-mike')).toBeInTheDocument();
  });

  it('opens exam history modal from HomePage', () => {
    render(<App />);
    const historyBtn = screen.getByTestId('open-exam-history-btn');
    fireEvent.click(historyBtn);

    expect(screen.getByTestId('exam-history-modal')).toBeInTheDocument();
    expect(screen.getByText('合格ドクター認定試験 採点カルテ・成績表')).toBeInTheDocument();
  });

  it('displays key progress box in the medical chart area and shows reward details', () => {
    render(<App />);

    // カルテ領域に合格のカギボックスが存在
    const keyBox = screen.getByTestId('key-progress-box');
    expect(keyBox).toBeInTheDocument();
    expect(keyBox).toHaveTextContent(/🔑 合格のカギ:/);
    expect(keyBox).toHaveTextContent(/【⭐Lv.4 マスター】にすると手に入ります/);
    expect(keyBox).toHaveTextContent(/🐾 カギ全達成特典: 全動物からの感謝メッセージ/);

    // 右カラム認定試験の報酬カードの二段階報酬（Stage 1: 認定証 / Stage 1&2: 獣医師バッジ）
    const rewardCard = screen.getByTestId('challenge-reward-card');
    expect(rewardCard).toBeInTheDocument();
    expect(rewardCard).toHaveTextContent('Stage 1（過去問本番）クリア');
    expect(rewardCard).toHaveTextContent('「合格ドクター認定証（ライセンス）」');
    expect(rewardCard).toHaveTextContent('Stage 1 & 2（同等未見問題）両方クリア');
    expect(rewardCard).toHaveTextContent('「金のマスター獣医師バッジ」');
  });

  it('verifies DoctorCertificateModal renders master badge according to hasMasterBadge prop', () => {
    const handleClose = vi.fn();

    // 1. Stage 1 のみクリア（hasMasterBadge: false）の場合: バッジはロック表示
    const { unmount } = render(
      <DoctorCertificateModal
        onClose={handleClose}
        examTitle="2024年度 理科 過去問マスター"
        isPerfectScore={true}
        hasMasterBadge={false}
      />
    );
    expect(screen.getByText('合格ドクター認定証')).toBeInTheDocument();
    expect(screen.getByText('合格ドクターライセンス')).toBeInTheDocument();
    expect(screen.getByTestId('master-vet-badge-locked')).toBeInTheDocument();
    expect(screen.queryByTestId('master-vet-badge-earned')).not.toBeInTheDocument();
    unmount();

    // 2. Stage 1 & 2 両方クリア（hasMasterBadge: true）の場合: 金のマスター獣医師バッジ授与！
    render(
      <DoctorCertificateModal
        onClose={handleClose}
        examTitle="2024年度 理科 過去問マスター"
        isPerfectScore={true}
        hasMasterBadge={true}
      />
    );
    expect(screen.getByTestId('master-vet-badge-earned')).toBeInTheDocument();
    expect(screen.getByText(/金のマスター獣医師バッジ（Stage 1&2 制覇！）/)).toBeInTheDocument();
    expect(screen.queryByTestId('master-vet-badge-locked')).not.toBeInTheDocument();
  });
});
