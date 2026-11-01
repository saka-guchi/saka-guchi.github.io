import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { StudyPage } from '../../src/pages/StudyPage';
import { SettingsPage } from '../../src/pages/SettingsPage';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { ResultPage } from '../../src/pages/ResultPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';

describe('Global Navigation Consistency Tests', () => {
  beforeEach(() => {
    useAppStore.getState().resetSession();
  });

  it('guarantees top-left back button is present across all pages for zero cognitive load', () => {
    // 1. StudyPage (学習中画面)
    useAppStore.getState().startDailySession();
    const { unmount: unmountStudy } = render(
      <BrowserRouter>
        <StudyPage />
      </BrowserRouter>
    );
    const studyBackBtn = screen.getByTestId('study-back-btn');
    expect(studyBackBtn).toBeInTheDocument();
    expect(studyBackBtn).toHaveTextContent('←');
    unmountStudy();

    // 2. SettingsPage (設定画面)
    const { unmount: unmountSettings } = render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    const settingsBackBtn = screen.getByTestId('settings-back-btn');
    expect(settingsBackBtn).toBeInTheDocument();
    expect(settingsBackBtn).toHaveTextContent('←');
    unmountSettings();

    // 3. FinalChallengePage (合格ドクター認定試験画面)
    const { unmount: unmountChallenge } = render(
      <BrowserRouter>
        <FinalChallengePage />
      </BrowserRouter>
    );
    const challengeBackBtn = screen.getByTestId('challenge-back-btn');
    expect(challengeBackBtn).toBeInTheDocument();
    expect(challengeBackBtn).toHaveTextContent('←');
    unmountChallenge();

    // 4. ResultPage (学習完了画面: 左上 + 最下部のハイブリッド配置)
    useAppStore.setState({
      currentSessionQuestions: [SAMPLE_QUESTIONS[0]],
      sessionResults: [],
      correctCount: 1,
      directRecallCount: 1,
    });
    const { unmount: unmountResult } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );
    // 左上戻るボタン
    const resultTopBackBtn = screen.getByTestId('result-top-back-btn');
    expect(resultTopBackBtn).toBeInTheDocument();
    expect(resultTopBackBtn).toHaveTextContent('←');
    expect(resultTopBackBtn).toHaveAttribute('aria-label', 'ホームへ戻る');

    // 最下部メインCTA戻るボタン
    const resultHomeBtn = screen.getByTestId('result-home-btn');
    expect(resultHomeBtn).toBeInTheDocument();
    expect(resultHomeBtn).toHaveTextContent('ホームへ戻る 🐾');

    unmountResult();
  });

  it('opens pause/interruption modal when clicking top-left back button on StudyPage to prevent accidental quit and provides save vs reset options', () => {
    // 選択式問題（delayed_choice）を確実にセット
    useAppStore.setState({
      currentSessionQuestions: [SAMPLE_QUESTIONS[1]],
      currentIndex: 0,
      recallPhase: true,
      currentAnswered: false,
    });
    render(
      <BrowserRouter>
        <StudyPage />
      </BrowserRouter>
    );

    // ボトムバーに「分かった」や「やめる」ボタンが存在しないこと（UI/UX整理）
    expect(screen.queryByTestId('recall-understood-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('study-quit-btn')).not.toBeInTheDocument();
    // 「今すぐ選択肢を見る」ボタンは存在すること
    expect(screen.getByTestId('reveal-choices-btn')).toBeInTheDocument();

    // 左上の「←」戻るボタンをクリック
    const studyBackBtn = screen.getByTestId('study-back-btn');
    fireEvent.click(studyBackBtn);

    // いきなりホームへ遷移せず、中断確認モーダルが開くこと（誤操作防止）
    const pauseModal = screen.getByTestId('study-pause-modal');
    expect(pauseModal).toBeInTheDocument();
    expect(screen.getByText('一時停止中')).toBeInTheDocument();

    // 1. 学習をつづけるボタン
    expect(screen.getByTestId('study-resume-btn')).toBeInTheDocument();

    // 2. ここまでの記録を残して中断するボタン（セーブ中断）
    expect(screen.getByTestId('study-pause-quit-btn')).toHaveTextContent('💾 ここまでの記録を残してホームへ');

    // 3. 最初からやり直す（リセット）ボタン
    expect(screen.getByTestId('study-pause-reset-btn')).toHaveTextContent('🔄 この学習をリセットして最初から（ホームへ）');
  });
});

