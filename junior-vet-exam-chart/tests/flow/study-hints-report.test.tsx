import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { StudyPage } from '../../src/pages/StudyPage';
import { useAppStore } from '../../src/store/appStore';
import { SAMPLE_QUESTIONS } from '../../src/data/sample-data';
import { getQuestionReports } from '../../src/utils/question-reports';

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

  it('allows child to report question issue and persists it to question-reports', async () => {
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

    // ヘッダーの「💬 おうちの人に相談」ボタンが存在すること
    const consultBtn = screen.getByTestId('header-report-btn');
    expect(consultBtn).toBeInTheDocument();
    fireEvent.click(consultBtn);

    // モーダルが開く
    const modal = screen.getByTestId('question-report-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent('おうちの人に相談・チェック依頼');

    // 理由「正解・解答がちがう気がする」を選択
    const wrongAnswerOption = screen.getByTestId('report-reason-answer_error');
    fireEvent.click(wrongAnswerOption);

    // コメントを入力
    const commentInput = screen.getByTestId('report-comment-input');
    fireEvent.change(commentInput, { target: { value: '答えの選択肢が逆になっている気がするよ' } });

    // 「保護者カルテに送る」ボタンをクリック
    const submitBtn = screen.getByTestId('send-report-btn');
    fireEvent.click(submitBtn);

    // 送信完了フィードバックの表示
    await waitFor(() => {
      expect(screen.getByText('保護者カルテに届けました！')).toBeInTheDocument();
    });

    // 登録されたデータを検証
    const savedReports = getQuestionReports();
    expect(savedReports).toHaveLength(1);
    expect(savedReports[0].questionId).toBe(q.id);
    expect(savedReports[0].reason).toBe('answer_error');
    expect(savedReports[0].comment).toBe('答えの選択肢が逆になっている気がするよ');
    expect(savedReports[0].resolved).toBe(false);
  });
});

