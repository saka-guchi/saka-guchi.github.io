import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';

describe('StudyPage Hints and Report Feature', () => {
  beforeEach(() => {
    useAppStore.getState().resetSession();
    localStorage.clear();
  });

  it('displays both Hint 1 and Hint 2 simultaneously when user opens hint 2', () => {
    const qWith2Hints = {
      ...SAMPLE_QUESTIONS[0],
      format: 'delayed_choice',
      hints: [
        { level: 1, text: 'ヒント1の内容です。' },
        { level: 2, text: 'ヒント2の内容です。' },
      ],
    };

    useAppStore.setState({
      currentSessionQuestions: [qWith2Hints as any],
      currentIndex: 0,
      recallPhase: false,
      hintLevel: 0,
      currentAnswered: false,
    });

    render(
      <BrowserRouter>
        <StudyPage />
      </BrowserRouter>
    );

    // 1回目のヒントクリック（ヒント1開示）
    const hintBtn = screen.getByTestId('show-hint-btn');
    fireEvent.click(hintBtn);

    const hintBox1 = screen.getByTestId('hint-box');
    expect(hintBox1).toHaveTextContent('💡 ヒント 1:');
    expect(hintBox1).toHaveTextContent('ヒント1の内容です。');
    expect(hintBox1).not.toHaveTextContent('💡 ヒント 2:');

    // 2回目のヒントクリック（ヒント2開示）
    const hintBtn2 = screen.getByTestId('show-hint-btn');
    fireEvent.click(hintBtn2);

    const hintBox2 = screen.getByTestId('hint-box');
    // ヒント1とヒント2の両方が同時に表示されていること！
    expect(hintBox2).toHaveTextContent('💡 ヒント 1:');
    expect(hintBox2).toHaveTextContent('ヒント1の内容です。');
    expect(hintBox2).toHaveTextContent('💡 ヒント 2:');
    expect(hintBox2).toHaveTextContent('ヒント2の内容です。');
  });

  it('hides the top yellow hintBox after answering to prevent duplication with reviewed-hints-section', () => {
    const q = {
      ...SAMPLE_QUESTIONS[0],
      hints: [
        { level: 1, text: 'ヒント1の内容です。' },
        { level: 2, text: 'ヒント2の内容です。' },
      ],
    };

    useAppStore.setState({
      currentSessionQuestions: [q as any],
      currentIndex: 0,
      recallPhase: false,
      hintLevel: 2, // ヒントを開示済み
      currentAnswered: true, // 回答完了後
      currentIsCorrect: true,
    });

    render(
      <BrowserRouter>
        <StudyPage />
      </BrowserRouter>
    );

    // 正解バナーが表示されている
    expect(screen.getByTestId('result-banner')).toBeInTheDocument();

    // 上部の黄色背景ヒントボックスは非表示になっている（重複排除）
    expect(screen.queryByTestId('hint-box')).not.toBeInTheDocument();

    // 下部の解説エリア内にあるヒント振り返りセクションにヒントが表示されている
    const reviewedSection = screen.getByTestId('reviewed-hints-section');
    expect(reviewedSection).toBeInTheDocument();
    expect(reviewedSection).toHaveTextContent('ヒントの振り返り');
    expect(reviewedSection).toHaveTextContent('ヒント1の内容です。');
    expect(reviewedSection).toHaveTextContent('ヒント2の内容です。');
  });

  it('does not display question report button (direct user communication policy)', async () => {
    const q = SAMPLE_QUESTIONS[0];
    useAppStore.setState({
      currentSessionQuestions: [q as any],
      currentIndex: 0,
      recallPhase: false,
      currentAnswered: true,
      currentIsCorrect: false,
    });

    render(
      <BrowserRouter>
        <StudyPage />
      </BrowserRouter>
    );

    // 不要な報告リンクが表示されないこと
    expect(screen.queryByTestId('report-question-btn')).not.toBeInTheDocument();
    expect(screen.queryByText('この問題はおかしい')).not.toBeInTheDocument();
  });
});

