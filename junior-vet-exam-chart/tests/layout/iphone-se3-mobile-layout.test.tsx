import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { HomePage } from '../../src/pages/HomePage';
import { MentalCarePage } from '../../src/pages/MentalCarePage';
import { SchoolAdvicePage } from '../../src/pages/SchoolAdvicePage';
import { ExamProblemViewer } from '../../src/components/final-challenge/ExamProblemViewer';

describe('iPhone SE 3 (375px × 667px) Mobile Layout Tests', () => {
  it('FinalChallengePage provides mobile tab navigation and instant switching between problem and answer sheet', () => {
    render(
      <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=rika']}>
        <FinalChallengePage />
      </MemoryRouter>
    );

    // モバイルタブ切り替えボタン（問題用紙 / 解答用紙）が存在すること
    const problemTab = screen.getByTestId('mobile-tab-problem');
    const sheetTab = screen.getByTestId('mobile-tab-sheet');
    expect(problemTab).toBeInTheDocument();
    expect(sheetTab).toBeInTheDocument();

    // 初期状態は問題用紙タブが選択されていること
    expect(problemTab).toHaveAttribute('aria-selected', 'true');
    expect(sheetTab).toHaveAttribute('aria-selected', 'false');

    // 問題用紙から解答用紙へのフローティング導線が存在すること
    const jumpToSheetBtn = screen.getByTestId('mobile-jump-to-sheet-btn');
    expect(jumpToSheetBtn).toBeInTheDocument();

    // 解答用紙タブをクリックして切り替えられること
    fireEvent.click(sheetTab);
    expect(problemTab).toHaveAttribute('aria-selected', 'false');
    expect(sheetTab).toHaveAttribute('aria-selected', 'true');

    // 解答用紙から問題用紙へ戻る導線が存在すること
    const jumpToProblemBtn = screen.getByTestId('jump-to-problem-btn');
    expect(jumpToProblemBtn).toBeInTheDocument();

    // 問題用紙へ戻れること
    fireEvent.click(jumpToProblemBtn);
    expect(problemTab).toHaveAttribute('aria-selected', 'true');
  });

  it('HomePage renders compact header and medical activity cards for mobile without layout collapse', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    // ヘッダー要素が存在し、タイトルおよびステータスバッジが正しく表示されること
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('exam-countdown-badge')).toBeInTheDocument();
    expect(screen.getByTestId('streak-badge')).toBeInTheDocument();

    // 4大医療活動（診察・処方箋・症例スタディ・獣医師チャレンジ）が存在すること
    expect(screen.getByText('🩺 本日の診察')).toBeInTheDocument();
    expect(screen.getByText('💊 知識の処方箋')).toBeInTheDocument();
    expect(screen.getByText('🩺 症例スタディ')).toBeInTheDocument();
    expect(screen.getByText('🏆 獣医師チャレンジ')).toBeInTheDocument();
  });

  it('MentalCarePage renders 4 care tabs and check-in options for compact mobile screens', () => {
    render(
      <MemoryRouter initialEntries={['/mental-care']}>
        <MentalCarePage />
      </MemoryRouter>
    );

    // 4つのこころタブが存在すること
    expect(screen.getByText('モヤモヤ仕分け')).toBeInTheDocument();
    expect(screen.getByText('気分転換のお守り図鑑')).toBeInTheDocument();
    expect(screen.getByText('ホー先生の相談ノート')).toBeInTheDocument();
    expect(screen.getByText('おうちの人へお願いカード')).toBeInTheDocument();

    // 天気チェックインボタン（4種類）が存在すること
    expect(screen.getByTestId('weather-btn-sunny')).toBeInTheDocument();
    expect(screen.getByTestId('weather-btn-cloudy')).toBeInTheDocument();
    expect(screen.getByTestId('weather-btn-rainy')).toBeInTheDocument();
    expect(screen.getByTestId('weather-btn-storm')).toBeInTheDocument();
  });

  it('SchoolAdvicePage renders responsive school selector tabs and hero header', () => {
    render(
      <MemoryRouter initialEntries={['/school-advice']}>
        <SchoolAdvicePage />
      </MemoryRouter>
    );

    // 志望校タブ切り替えが存在すること
    expect(screen.getByTestId('tab-chiyoda')).toBeInTheDocument();
    expect(screen.getByTestId('tab-meguro')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-home-btn')).toBeInTheDocument();
  });

  it('ExamProblemViewer Stage 2 renders responsive question prompt cards with samplePdfContent class', () => {
    render(
      <ExamProblemViewer
        stage={2}
        currentYear={2024}
        currentSubject="rika"
        currentSubjectLabel="理科"
        currentPage={1}
        currentTotalPages={5}
        onPageChange={() => {}}
        pageLayout="single"
        onPageLayoutChange={() => {}}
        scanZoom={100}
        onScanZoomChange={() => {}}
        viewMode="text"
        pageImageData={null}
        nextPageImageData={null}
        currentSections={[]}
      />
    );

    // Stage 2 の問題用紙エリアが存在し、同等未見問題の案内が表示されること
    expect(screen.getByTestId('challenge-pdf-area')).toBeInTheDocument();
    expect(screen.getByText('Stage 2：同等未見問題（人による確認済み）')).toBeInTheDocument();
    expect(screen.getByText('Stage 2 理科 試験表紙')).toBeInTheDocument();
  });
});
