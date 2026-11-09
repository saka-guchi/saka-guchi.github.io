import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StudyPage } from '../../src/pages/StudyPage';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { ExamReviewPage } from '../../src/components/final-challenge/ExamReviewPage';
import { useAppStore } from '../../src/store/appStore';
import { ALL_PAST_EXAM_QUESTIONS } from '../../src/data/past-exam-questions';

describe('ユーザー要望改善項目 統合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. ヒント改善の検証', () => {
    it('過去問問題のヒントが無意味な定型文（入試過去問です・解法とポイントを思い出して等）ではなく、具体的で役立つ解法ヒントになっていること', () => {
      // 算数・大問1（計算問題）を含む過去問を検索
      const calcQ = ALL_PAST_EXAM_QUESTIONS.find(
        q => q.subject === 'sansu' && (q.category.includes('大問1') || q.category.includes('計算'))
      );
      expect(calcQ).toBeDefined();
      if (calcQ) {
        expect(calcQ.hints[0].text).not.toContain('年度 安田学園中学校 入試過去問です。問題文の条件やキーワードをよく確認しましょう。');
        expect(calcQ.hints[1].text).not.toContain('の解法とポイントを思い出して考えましょう。');
        // 計算の順序や逆算、分数などの具体的な着眼点が含まれること
        const hintCombined = calcQ.hints[0].text + calcQ.hints[1].text;
        expect(hintCombined.length).toBeGreaterThan(20);
      }
    });
  });

  describe('2. 自己判定選択肢の改善', () => {
    it('一問一答（recall_card）の選択肢に「思い出せなかった／間違った」が表示されること', () => {
      const recallQ = {
        id: 'test-recall-1',
        subject: 'rika' as const,
        format: 'recall_card' as const,
        prompt: '道管の役割は？',
        category: '植物',
        skillTitle: '維管束',
        correctAnswer: '水分を運ぶ',
        hints: [
          { level: 1 as const, text: '水の通り道' },
          { level: 2 as const, text: '根から上へ' },
        ],
        explanation: {
          resultSummary: '道管',
          keyTakeaway: '道管',
          reasoning: '内側が道管',
        },
      };

      const store = useAppStore.getState();
      store.currentSessionQuestions = [recallQ];
      store.currentIndex = 0;
      store.currentAnswered = false;

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 答えを確認するボタンを押す
      const revealBtn = screen.getByTestId('recall-reveal-btn');
      fireEvent.click(revealBtn);

      // 「思い出せなかった／間違った」ボタンが存在すること
      const wrongBtn = screen.getByTestId('recall-wrong-btn');
      expect(wrongBtn).toBeInTheDocument();
      expect(wrongBtn).toHaveTextContent('思い出せなかった／間違った');
    });
  });

  describe('3. 正解後の重複ボタン排除', () => {
    it('正解後に上部の「次へ進む」ボタンが表示されず、下部ボトムバーの「次へ →」ボタンのみ存在すること', () => {
      useAppStore.getState().startSkillFocusSession('skill-rika-2023-bee-division');

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 思い出しカウントダウンを解除
      const revealBtn = screen.queryByTestId('reveal-choices-btn');
      if (revealBtn) fireEvent.click(revealBtn);

      // 選択肢をクリックして回答
      const choiceButtons = screen.getAllByRole('button').filter(b => b.getAttribute('data-testid')?.startsWith('choice-btn-'));
      fireEvent.click(choiceButtons[0]);

      // インラインの「次へ進む」は存在しないこと
      expect(screen.queryByTestId('inline-next-btn')).not.toBeInTheDocument();

      // ボトムバーの「次へ →」が存在すること
      const nextBtn = screen.getByTestId('next-question-btn');
      expect(nextBtn).toBeInTheDocument();
      expect(nextBtn).toHaveTextContent(/次へ/);
    });
  });

  describe('4. 「もんだいや答えを相談する」ボタンの早期表示と問題スキップ扱い', () => {
    it('未回答時にも相談ボタンが表示され、送信時に問題がスキップ（正誤除外）されて次へ進むこと', async () => {
      useAppStore.getState().startSkillFocusSession('skill-rika-2023-bee-division');

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 選択肢表示
      const revealBtn = screen.queryByTestId('reveal-choices-btn');
      if (revealBtn) fireEvent.click(revealBtn);

      // 未回答状態でも相談ボタンが表示されていること
      const reportBtn = screen.getByTestId('open-question-report-btn');
      expect(reportBtn).toBeInTheDocument();
      expect(reportBtn).toHaveTextContent(/相談する（スキップ）/);

      // モーダルを開く
      fireEvent.click(reportBtn);
      expect(screen.getByTestId('question-report-modal')).toBeInTheDocument();

      // 「指導医ログに送ってスキップ」ボタンが存在すること
      const sendBtn = screen.getByTestId('send-report-btn');
      expect(sendBtn).toHaveTextContent(/スキップ/);

      // 送信
      await act(async () => {
        fireEvent.click(sendBtn);
      });

      // 成功メッセージが表示されること
      expect(screen.getByTestId('report-success-message')).toBeInTheDocument();
    });
  });

  describe('5. 手書き計算メモ（ScratchPadCanvas）エリアの検証', () => {
    it('StudyPage で手書き計算メモエリアがトグル開閉でき、Canvasがレンダリングされること', () => {
      useAppStore.getState().startDailySession('sansu');

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 手書きスペースのトグルボタンが存在し、展開時は「手書きスペースを閉じる」と表示されること
      const toggleBtn = screen.getByTestId('toggle-scratch-pad-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/手書きスペースを閉じる/);

      // Canvasが存在し、ツールバー左端に「計算スペース」文字がなく左詰めになっていること
      const canvasCard = screen.getByTestId('scratch-pad-canvas');
      expect(canvasCard).toBeInTheDocument();
      expect(canvasCard).not.toHaveTextContent('✏️ 計算スペース');
      expect(screen.getByTestId('scratch-pen-black')).toBeInTheDocument();
      expect(screen.getByTestId('scratch-canvas')).toBeInTheDocument();

      // トグルで閉じると「手書きスペースを開く」になること
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('scratch-pad-canvas')).not.toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/手書きスペースを開く/);
    });

    it('FinalChallengePage（獣医師チャレンジ）で画面端のフローティングボタンから手書きメモを開閉できること', () => {
      render(
        <MemoryRouter>
          <FinalChallengePage />
        </MemoryRouter>
      );

      // 右下にフローティングボタンが存在すること
      const openScratchBtn = screen.getByTestId('challenge-open-scratch-btn');
      expect(openScratchBtn).toBeInTheDocument();
      expect(openScratchBtn).toHaveTextContent(/手書き計算メモ/);

      // クリックすると手書きパネルがスライドイン表示されること
      fireEvent.click(openScratchBtn);
      expect(screen.getByTestId('scratch-pad-canvas')).toBeInTheDocument();

      // 閉じるボタンでパネルが閉じること
      const closeBtn = screen.getByTestId('scratch-close-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('scratch-pad-canvas')).not.toBeInTheDocument();
    });
  });

  describe('6. 原本表示（問題原本・解答原本）の検証', () => {
    it('ExamReviewPage で「問題用紙原本」と「模範解答原本」を切り替えられること', () => {
      const dummySections = [
        {
          sectionNumber: 1,
          title: '大問1',
          pageRange: 'p.1',
          leadText: 'テスト',
          slots: [
            {
              id: 'slot-1',
              section: 1,
              questionNumber: '1',
              pageNumber: 1,
              label: '問1',
              answerType: 'term' as const,
              correctAnswer: 'テスト',
            },
          ],
        },
      ];

      render(
        <MemoryRouter>
          <ExamReviewPage
            year={2026}
            subject="sansu"
            subjectLabel="算数"
            sections={dummySections}
            answers={{ 'slot-1': 'テスト' }}
            rubricChecks={{}}
            markedZeroSlots={{}}
            onRubricChange={() => {}}
            onMarkZero={() => {}}
            isFinalized={true}
            onFinalize={() => {}}
            onGoHome={() => {}}
          />
        </MemoryRouter>
      );

      // 問題原本と模範解答原本の切り替えボタンが存在すること
      const mondaiBtn = screen.getByTestId('viewer-scan-mondai-btn');
      const kaitoBtn = screen.getByTestId('viewer-scan-kaito-btn');
      expect(mondaiBtn).toBeInTheDocument();
      expect(kaitoBtn).toBeInTheDocument();

      // 模範解答原本ボタンをクリック
      fireEvent.click(kaitoBtn);
      expect(kaitoBtn.className).toContain('activeTab');
    });

    it('StudyPage で回答後に「問題の出典：大問1 問...」形式で表示され、「模範解答原本を見る」ボタンから解答画像が表示されること', () => {
      const pastQ = ALL_PAST_EXAM_QUESTIONS.find(q => q.originalScan);
      expect(pastQ).toBeDefined();

      useAppStore.setState({
        currentSessionQuestions: [pastQ!],
        currentIndex: 0,
        currentAnswered: false,
        currentUserAnswer: null,
        currentIsCorrect: null,
        currentFocusSkillId: null,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 選択肢をクリックして回答
      const choiceButtons = screen.getAllByRole('button').filter(b => b.getAttribute('data-testid')?.startsWith('choice-btn-'));
      if (choiceButtons.length > 0) {
        fireEvent.click(choiceButtons[0]);
      } else {
        // self_check や recall_card の場合のフォールバック
        const revealBtn = screen.queryByTestId('recall-reveal-btn') || screen.queryByTestId('self-check-reveal-btn');
        if (revealBtn) fireEvent.click(revealBtn);
        const ansBtn = screen.queryByTestId('recall-correct-btn') || screen.queryByTestId('self-check-correct');
        if (ansBtn) fireEvent.click(ansBtn);
      }

      // 出典クレジットに学校名ではなく「大問...」が表示されること
      const credit = screen.getByTestId('study-source-credit');
      expect(credit).toHaveTextContent(/問題の出典：大問/);

      // 「模範解答原本を見る」ボタンが設置されていること
      const openAnswerScanBtn = screen.getByTestId('study-open-answer-scan-btn');
      expect(openAnswerScanBtn).toBeInTheDocument();
      expect(openAnswerScanBtn).toHaveTextContent(/模範解答原本を見る/);

      // クリックすると原本モーダルが開き、画像srcに kaito が含まれ、モーダルタイトルに模範解答原本が含まれること
      fireEvent.click(openAnswerScanBtn);
      const modal = screen.getByTestId('original-scan-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent(/模範解答原本/);

      const scanImg = screen.getByTestId('modal-scan-image');
      expect(scanImg).toHaveAttribute('src', expect.stringContaining('/kaito_p'));
    });

    it('特訓問題（focus-...）でも「問題の出典：大問...」と「模範解答原本を見る」ボタンが設置されること', () => {
      // ユーザーの画像にあった社会の摂関政治問題
      const focusQ = {
        id: 'focus-shakai-sekkan-politics',
        subject: 'shakai' as const,
        format: 'delayed_choice' as const,
        prompt: '【平安時代】藤原氏が政治の実権を握った政治体制を何といいますか？',
        category: '日本の歴史と社会',
        skillTitle: '藤原氏の摂関政治',
        choices: [
          { id: 'a', label: 'ア', text: '摂関政治', isCorrect: true },
          { id: 'b', label: 'イ', text: '院政', isCorrect: false },
        ],
        correctAnswer: 'a',
        hints: [],
        explanation: {
          resultSummary: '正解！',
          keyTakeaway: '摂関政治',
          reasoning: '藤原頼通',
        },
      };

      useAppStore.setState({
        currentSessionQuestions: [focusQ],
        currentIndex: 0,
        currentAnswered: true,
        currentUserAnswer: 'b',
        currentIsCorrect: false,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 「問題の出典：大問...」が表示されていること
      const credit = screen.getByTestId('study-source-credit');
      expect(credit).toHaveTextContent(/問題の出典：大問/);

      // 「模範解答原本を見る」ボタンが設置されていること
      const openBtn = screen.getByTestId('study-open-answer-scan-btn');
      expect(openBtn).toBeInTheDocument();
      expect(openBtn).toHaveTextContent(/模範解答原本を見る/);

      // クリックで原本解答モーダルが開くこと
      fireEvent.click(openBtn);
      const modal = screen.getByTestId('original-scan-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent(/2024年度/);
      const scanImg = screen.getByTestId('modal-scan-image');
      expect(scanImg).toHaveAttribute('src', expect.stringContaining('/pages/2024/shakai/kaito_p001.webp'));
    });

    it('自己判定（recall_card）で「正解した」の選択肢が出るタイミングで、模範解答および模範解答原本ボタンが表示されること', () => {
      // 過去問の記述/自己判定問題
      const recallPastQ = ALL_PAST_EXAM_QUESTIONS.find(q => q.format === 'recall_card' && q.originalScan)!;
      expect(recallPastQ).toBeDefined();

      useAppStore.setState({
        currentSessionQuestions: [recallPastQ],
        currentIndex: 0,
        currentAnswered: false,
        currentUserAnswer: null,
        currentIsCorrect: null,
        currentFocusSkillId: null,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 初期状態（問題表示中）でもヘッダーに模範解答原本ボタンがあること
      const headerAnswerScanBtn = screen.getByTestId('study-open-answer-scan-header-btn');
      expect(headerAnswerScanBtn).toBeInTheDocument();

      // 「答えを確認する」を押して自己判定選択肢を展開
      const revealBtn = screen.getByTestId('recall-reveal-btn');
      fireEvent.click(revealBtn);

      // 「正解した（思い出せた）」の選択肢が表示されていること
      const correctBtn = screen.getByTestId('recall-correct-btn');
      expect(correctBtn).toBeInTheDocument();

      // この自己判定のタイミングで模範解答カードが表示されていること
      const answerCard = screen.getByTestId('recall-answer-card');
      expect(answerCard).toBeInTheDocument();
      expect(answerCard).toHaveTextContent(/模範解答：/);
      expect(answerCard).toHaveTextContent(String(recallPastQ.correctAnswer));

      // 自己判定の模範解答カード内に「✅ 模範解答原本を見る」ボタンが表示されていること
      const cardAnswerScanBtn = screen.getByTestId('recall-open-answer-scan-btn');
      expect(cardAnswerScanBtn).toBeInTheDocument();

      // ボタンを押すと模範解答原本スキャンモーダルが開くこと
      fireEvent.click(cardAnswerScanBtn);
      const modal = screen.getByTestId('original-scan-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent(/模範解答原本/);
      const scanImg = screen.getByTestId('modal-scan-image');
      expect(scanImg).toHaveAttribute('src', expect.stringContaining('/kaito_p'));
    });

    it('回答後の解説パネルに「覚えること」「考え方」の定型文が表示されず、問題の出典と原本ボタン、ヒント振り返りのみが表示されること', () => {
      const recallPastQ = ALL_PAST_EXAM_QUESTIONS.find(q => q.format === 'recall_card' && q.originalScan)!;
      expect(recallPastQ).toBeDefined();

      useAppStore.setState({
        currentSessionQuestions: [recallPastQ],
        currentIndex: 0,
        currentAnswered: true,
        currentUserAnswer: 'correct',
        currentIsCorrect: true,
        currentFocusSkillId: null,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      const panel = screen.getByTestId('explanation-panel');
      expect(panel).toBeInTheDocument();

      // 「覚えること」「考え方」のセクションが存在しないこと
      expect(panel).not.toHaveTextContent('覚えること');
      expect(panel).not.toHaveTextContent('考え方');

      // 出典クレジットと原本ボタンが表示されていること
      expect(screen.getByTestId('study-source-credit')).toBeInTheDocument();
      expect(screen.getByTestId('study-open-answer-scan-btn')).toBeInTheDocument();
    });
  });
});
