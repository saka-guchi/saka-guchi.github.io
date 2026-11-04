import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StudyPage } from '../../src/pages/StudyPage';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { ReferenceBookQuizModal } from '../../src/components/ReferenceBookQuizModal';
import { useAppStore } from '../../src/store/appStore';

describe('学習・試験画面 ヘッダー統一＆中断ポップアップ統合テスト', () => {
  beforeEach(() => {
    useAppStore.getState().resetSession();
    localStorage.clear();
  });

  describe('1. 本日の診察 (StudyPage)', () => {
    it('ヘッダーが統一デザイン（← 戻る、モードバッジ、教科バッジ）になり、右側の一時停止||ボタンが削除され、← 戻るで一時停止モーダルが開くこと', () => {
      // 1問セッションを用意
      useAppStore.setState({
        currentSessionQuestions: [
          {
            id: 'sample-q1',
            subject: 'shakai',
            format: 'multiple_choice',
            prompt: 'テスト問題',
            category: '歴史人物80',
            skillTitle: '歴史人物80',
            choices: [
              { id: 'a', label: 'ア', text: '正解', isCorrect: true },
              { id: 'b', label: 'イ', text: '誤り', isCorrect: false },
            ],
            correctAnswer: 'a',
            hints: [{ level: 1, text: 'ヒント1' }, { level: 2, text: 'ヒント2' }],
            explanation: { resultSummary: '', keyTakeaway: '', reasoning: '' },
          } as any,
        ],
        currentIndex: 0,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // 1. 左上に「← 戻る」ボタンが存在すること
      const backBtn = screen.getByTestId('study-back-btn');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveTextContent('← 戻る');

      // 2. モードバッジ「🩺 本日の診察」と教科バッジ「出題教科：🗾 社会」が表示されること
      expect(screen.getByText('🩺 本日の診察')).toBeInTheDocument();
      expect(screen.getByText('出題教科：🗾 社会')).toBeInTheDocument();

      // 3. 右端の重複一時停止ボタン「||」が存在しないこと
      expect(screen.queryByTestId('study-pause-btn')).not.toBeInTheDocument();

      // 4. 「← 戻る」を押すと、即離脱せず一時停止モーダルが表示されること
      fireEvent.click(backBtn);
      const modal = screen.getByTestId('study-pause-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('一時停止中')).toBeInTheDocument();
      expect(screen.getByText('▶ 学習をつづける')).toBeInTheDocument();
      expect(screen.getByText('💾 ここまでの記録を残してホームへ')).toBeInTheDocument();

      // 5. 「学習をつづける」でモーダルが閉じること
      fireEvent.click(screen.getByTestId('study-resume-btn'));
      expect(screen.queryByTestId('study-pause-modal')).not.toBeInTheDocument();
    });
    it('症例特訓セッション（currentFocusSkillIdが存在）の場合、モードバッジが「🐾 症例スタディ」と表示されること', () => {
      useAppStore.setState({
        currentFocusSkillId: 'rika-plant-01',
        currentSessionQuestions: [
          {
            id: 'focus-rika-plant-01',
            subject: 'rika',
            format: 'multiple_choice',
            prompt: '植物のつくりとはたらきの問題',
            category: '植物のつくりとはたらき',
            skillTitle: '植物のつくりとはたらき',
            choices: [
              { id: 'a', label: 'ア', text: '主根', isCorrect: true },
            ],
            correctAnswer: 'a',
            hints: [{ level: 1, text: 'ヒント1' }, { level: 2, text: 'ヒント2' }],
            explanation: { resultSummary: '', keyTakeaway: '', reasoning: '' },
          } as any,
        ],
        currentIndex: 0,
        recallPhase: false,
      });

      render(
        <MemoryRouter>
          <StudyPage />
        </MemoryRouter>
      );

      // モードバッジが「🐾 症例スタディ」であること
      const badge = screen.getByTestId('study-mode-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('🐾 症例スタディ');
      expect(screen.getByText('出題教科：🧪 理科')).toBeInTheDocument();
    });
  });

  describe('2. 知識の処方箋 (ReferenceBookQuizModal)', () => {
    it('右上の✕ボタンが削除され、左上の「← 戻る」を押したときに即座に閉じず一時停止モーダルが表示されること', () => {
      const onClose = vi.fn();

      render(
        <ReferenceBookQuizModal bookId="history-80" onClose={onClose} />
      );

      // 1. 右上の✕ボタンが存在しないこと
      expect(screen.queryByLabelText('閉じる')).not.toBeInTheDocument();

      // 2. 左上に「← 戻る」ボタンが存在すること
      const backBtn = screen.getByTestId('refbook-back-btn');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveTextContent('← 戻る');

      // 3. 「← 戻る」をクリックしても即座に onClose が呼ばれず、一時停止モーダルが開くこと
      fireEvent.click(backBtn);
      expect(onClose).not.toHaveBeenCalled();

      const modal = screen.getByTestId('study-pause-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('一時停止中')).toBeInTheDocument();

      // 4. 「▶ 学習をつづける」でモーダルが閉じること
      fireEvent.click(screen.getByTestId('study-resume-btn'));
      expect(screen.queryByTestId('study-pause-modal')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      // 5. 「ここまでの記録を残してホームへ」で onClose が呼ばれること
      fireEvent.click(backBtn);
      fireEvent.click(screen.getByTestId('study-pause-quit-btn'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('3. ドクター認定試験 (FinalChallengePage)', () => {
    it('ヘッダーが「← 戻る」「🏆 獣医師チャレンジ」デザインになり、戻るを押すと即座に離脱せず一時停止モーダルが表示されること', () => {
      render(
        <MemoryRouter initialEntries={['/final-challenge?year=2024&subject=rika']}>
          <Routes>
            <Route path="/final-challenge" element={<FinalChallengePage />} />
            <Route path="/" element={<div>ホーム画面</div>} />
          </Routes>
        </MemoryRouter>
      );

      // 1. 左上に「← 戻る」ボタンが存在すること
      const backBtn = screen.getByTestId('challenge-back-btn');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveTextContent('← 戻る');

      // 2. 「🏆 獣医師チャレンジ」バッジが表示されていること
      expect(screen.getByText('🏆 獣医師チャレンジ')).toBeInTheDocument();

      // 3. 「← 戻る」を押しても即座にホームに遷移せず、一時停止モーダルが表示されること
      fireEvent.click(backBtn);
      expect(screen.queryByText('ホーム画面')).not.toBeInTheDocument();

      const modal = screen.getByTestId('study-pause-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('試験を一時停止中')).toBeInTheDocument();
      expect(screen.getByText('▶ 試験をつづける')).toBeInTheDocument();
      expect(screen.getByText('💾 ここまでの解答を残してホームへ')).toBeInTheDocument();

      // 4. 「試験をつづける」で再開できること
      fireEvent.click(screen.getByTestId('study-resume-btn'));
      expect(screen.queryByTestId('study-pause-modal')).not.toBeInTheDocument();
    });
  });
});
