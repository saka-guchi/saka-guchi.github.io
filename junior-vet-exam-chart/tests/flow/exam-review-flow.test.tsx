import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { HomePage } from '../../src/pages/HomePage';
import { StudyPage } from '../../src/pages/StudyPage';
import { FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT } from '../../src/data/final-challenge-data';
import { useAppStore } from '../../src/store/appStore';
import { setSkillStage } from '../../src/utils/mastery-helper';
import { db } from '../../src/db';
import {
  loadPendingReview,
  savePendingReview,
  savePausedAnswering,
} from '../../src/utils/final-challenge-storage';
import type { Subject } from '../../src/types';

const slotsOf = (subject: Subject) =>
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2024][subject].sections.flatMap(s => s.slots);
const openIds = (subject: Subject) => slotsOf(subject).filter(s => s.answerType === 'open').map(s => s.id);
const NO_OPEN_SUBJECT = (['sansu', 'shakai', 'rika', 'kokugo'] as Subject[]).find(s => openIds(s).length === 0);

const renderPage = (subject: Subject, year: number = 2024) =>
  render(
    <MemoryRouter initialEntries={[`/final-challenge?year=${year}&subject=${subject}`]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/final-challenge" element={<FinalChallengePage />} />
      </Routes>
    </MemoryRouter>
  );

const submit = () => {
  fireEvent.click(screen.getByTestId('submit-exam-btn'));
  fireEvent.click(screen.getByTestId('submit-proceed-btn'));
};
const markAllZero = (subject: Subject) => openIds(subject).forEach(id => fireEvent.click(screen.getByTestId(`mark-zero-btn-${id}`)));

describe('見直しページ（全画面）＆提出フロー', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await db.finalChallengeResults.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('1. 提出確認ダイアログ: 初期フォーカス・Esc・背景クリック・連打防止', async () => {
    renderPage('rika');
    const btn = screen.getByTestId('submit-exam-btn');
    expect(btn).toHaveTextContent('こたえを出して採点する');
    fireEvent.click(btn);
    expect(screen.getByText('こたえを出していい？')).toBeInTheDocument();
    expect(screen.getByText(/出したあとは、こたえを直せないよ。/)).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('submit-cancel-btn')));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('submit-confirm-modal')).toBeNull();

    fireEvent.click(btn);
    fireEvent.click(screen.getByTestId('submit-confirm-modal'));
    expect(screen.queryByTestId('submit-confirm-modal')).toBeNull();

    fireEvent.click(btn);
    fireEvent.click(screen.getByTestId('submit-cancel-btn'));
    expect(screen.queryByTestId('exam-review-page')).toBeNull();
    expect(await db.finalChallengeResults.count()).toBe(0);

    fireEvent.click(btn);
    const proceed = screen.getByTestId('submit-proceed-btn');
    fireEvent.click(proceed);
    fireEvent.click(proceed);
    await waitFor(() => expect(screen.getByTestId('exam-review-page')).toBeInTheDocument());
  });

  it('2. 未入力の欄があるときの文言（実データから算出）', () => {
    renderPage('rika');
    fireEvent.click(screen.getByTestId('submit-exam-btn'));
    expect(screen.getByTestId('unanswered-count-notice')).toHaveTextContent(
      `まだ書いていない欄が${slotsOf('rika').length}つあるよ。`
    );
  });

  it('3. 記述なしの試験は状態Aを飛ばして状態Bになる', async () => {
    if (!NO_OPEN_SUBJECT) return;
    renderPage(NO_OPEN_SUBJECT);
    submit();
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(screen.queryByTestId('review-pending-area')).toBeNull();
    expect(screen.getByTestId('review-return-home-btn')).toBeInTheDocument();
    expect(await db.finalChallengeResults.count()).toBe(1);
  });

  it('4. 未判定の記述が残っているあいだ「採点を決める」は無効、ヘッダー下ではなくフッター内に進捗バーが表示されること', async () => {
    renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    expect(screen.getByTestId('finalize-review-btn')).toBeDisabled();
    expect(screen.getByTestId('remaining-notice')).toHaveTextContent(/記述 あと\d+問/);

    // フッター（contentinfo）内に進捗エリアとプログレスバーが含まれること
    const footer = screen.getByRole('contentinfo');
    expect(footer).toContainElement(screen.getByTestId('review-pending-area'));
    expect(footer).toContainElement(screen.getByRole('progressbar'));
  });

  it('5. 「どれも書けなかった」で判定ずみになる', async () => {
    renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    const [first, ...rest] = openIds('rika');
    expect(screen.getByTestId(`status-pending-${first}`)).toHaveTextContent('まだ');
    fireEvent.click(screen.getByTestId(`mark-zero-btn-${first}`));
    expect(screen.queryByTestId(`status-pending-${first}`)).toBeNull();
    expect(screen.getByTestId(`review-slot-${first}`)).toHaveTextContent('もう少し');
    rest.forEach(id => fireEvent.click(screen.getByTestId(`mark-zero-btn-${id}`)));
    expect(screen.getByTestId('finalize-review-btn')).toBeEnabled();
  });

  it('6. 判定の確定後、チェックがロックされる', async () => {
    renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    markAllZero('rika');
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    const id = openIds('rika')[0];
    expect(screen.getByTestId(`mark-zero-btn-${id}`)).toBeDisabled();
    expect(screen.getByTestId(`rubric-check-${id}-0`)).toBeDisabled();
  });

  it('7. 制限時間0で自動提出され「時間になったので、出したよ」が出る', () => {
    vi.useFakeTimers();
    renderPage('rika');
    act(() => { vi.advanceTimersByTime(30 * 60 * 1000 + 2000); });
    expect(screen.queryByTestId('submit-confirm-modal')).toBeNull();
    expect(screen.getByTestId('exam-review-page')).toBeInTheDocument();
    expect(screen.getByTestId('timeup-notice-banner')).toHaveTextContent('時間になったので、出したよ');
  });

  it('8. 二重保存防止＆確定後リロード復元: 連打しても1件のみ、確定後リロードで結果ページが復元され、ホームに戻るとクリアされる', async () => {
    const { unmount } = renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    markAllZero('rika');
    const fin = screen.getByTestId('finalize-review-btn');
    fireEvent.click(fin);
    fireEvent.click(fin);
    fireEvent.click(fin);
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(await db.finalChallengeResults.count()).toBe(1);
    expect(loadPendingReview(2024, 'rika')).toBeNull();

    // 確定後に再マウント（再読み込み相当）すると状態B（結果ページ）が復元され、DB件数は増えない
    unmount();
    const { unmount: unmount2 } = renderPage('rika');
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(await db.finalChallengeResults.count()).toBe(1);
    expect(loadPendingReview(2024, 'rika')).toBeNull();

    // 「ホームにもどる」を押すとsessionStorageスナップショットがクリアされ、再度開いたときは解答用紙から始まる
    fireEvent.click(screen.getByTestId('review-return-home-btn'));
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    unmount2();

    renderPage('rika');
    expect(screen.getByTestId('submit-exam-btn')).toBeInTheDocument();
  });

  it('9. 再読み込みで判定中データから復元され、壊れたデータは破棄される', async () => {
    const [first] = openIds('rika');
    savePendingReview({
      version: 1, year: 2024, subject: 'rika', answers: {}, rubricChecks: {},
      markedZeroSlots: { [first]: true }, isTimeUpSubmitted: false, timestamp: Date.now(),
    });
    const { unmount } = renderPage('rika');
    expect(screen.getByTestId('exam-review-page')).toBeInTheDocument();
    expect(screen.getByTestId('resumed-notice-banner')).toHaveTextContent('つづきから見直すよ。');
    expect(screen.getByTestId(`review-slot-${first}`)).toHaveTextContent('もう少し');
    expect(await db.finalChallengeResults.count()).toBe(0);
    unmount();

    localStorage.setItem('jvet:final-challenge-pending:2024:rika', JSON.stringify({ version: 0, junk: true }));
    renderPage('rika');
    expect(screen.getByTestId('submit-exam-btn')).toBeInTheDocument();
    expect(localStorage.getItem('jvet:final-challenge-pending:2024:rika')).toBeNull();
  });

  it('10. 見直しページで「戻る」やヘッダー「ホームにもどる」でホームへ移動し解答用紙に戻らない', async () => {
    const { unmount } = renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('exam-review-page')).toBeInTheDocument());
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    expect(screen.queryByTestId('submit-exam-btn')).toBeNull();
    expect(loadPendingReview(2024, 'rika')).not.toBeNull();
    unmount();

    renderPage('rika');
    await waitFor(() => expect(screen.getByTestId('exam-review-page')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('review-header-home-btn'));
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    expect(loadPendingReview(2024, 'rika')).not.toBeNull();
  });

  it('11. 認定証ボタン: 60点以上で表示されクリックで認定証モーダルが開き、59点以下では表示されない', async () => {
    // (A) 59点以下（0点）の場合: ボタンが出ない
    const { unmount } = renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    markAllZero('rika');
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(screen.queryByTestId('view-certificate-btn')).toBeNull();
    unmount();

    // (B) 60点以上（全問正解）の場合: ボタンが出て、押すと認定証モーダルが開く
    const allRikaSlots = slotsOf('rika');
    const perfectAnswers: Record<string, string> = {};
    const perfectRubrics: Record<string, Record<number, boolean>> = {};
    for (const s of allRikaSlots) {
      if (s.answerType === 'open') {
        const checks: Record<number, boolean> = {};
        (s.rubricItems || ['']).forEach((_, idx) => { checks[idx] = true; });
        perfectRubrics[s.id] = checks;
      } else {
        perfectAnswers[s.id] = s.correctAnswer;
      }
    }
    savePendingReview({
      version: 1, year: 2024, subject: 'rika',
      answers: perfectAnswers, rubricChecks: perfectRubrics,
      markedZeroSlots: {}, isTimeUpSubmitted: false, timestamp: Date.now(),
    });
    renderPage('rika');
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());

    const certBtn = screen.getByTestId('view-certificate-btn');
    expect(certBtn).toHaveTextContent('認定証を見る');
    // 自動では開いていないこと
    expect(screen.queryByTestId('doctor-certificate-modal')).toBeNull();
    fireEvent.click(certBtn);
    await waitFor(() => {
      expect(screen.getByTestId('doctor-certificate-modal')).toBeInTheDocument();
    });
  });

  it('12. ホーム画面の途中保存表示: 本日の診察・知識の処方箋・獣医師チャレンジの砂時計アイコン(⏳)', async () => {
    // 初期状態（未中断）は ▶ および科目アイコン
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('start-study-btn')).toHaveTextContent('▶ 本日の診察をはじめる（10問）');
    expect(screen.getByTestId('start-extra-book-btn')).toHaveTextContent('▶ 知識の処方箋をつくる（10問）');
    expect(screen.getByTestId('start-exam-btn-2024-rika')).toHaveTextContent('🧪');
    unmount();

    // 途中保存状態をセットすると ⏳ アイコンに切り替わる
    localStorage.setItem('jvet:daily-session-paused', '1');
    localStorage.setItem('jvet:refbook-paused:history-80', JSON.stringify({ currentIndex: 1, sessionQuestions: [{}] }));
    savePausedAnswering({
      version: 1,
      year: 2024,
      subject: 'rika',
      answers: { 'rika-01-01-a': 'テスト' },
      currentPage: 2,
      remainingSeconds: 1200,
      timestamp: Date.now(),
    });
    savePendingReview({
      version: 1,
      year: 2024,
      subject: 'sansu',
      answers: {},
      rubricChecks: {},
      markedZeroSlots: {},
      isTimeUpSubmitted: false,
      timestamp: Date.now(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('start-study-btn')).toHaveTextContent('⏳ 本日の診察をはじめる（10問）');
    expect(screen.getByTestId('start-extra-book-btn')).toHaveTextContent('⏳ 知識の処方箋をつくる（10問）');
    expect(screen.getByTestId('start-exam-btn-2024-rika')).toHaveTextContent('⏳');
    expect(screen.getByTestId('start-exam-btn-2024-sansu')).toHaveTextContent('⏳');
    expect(screen.getByTestId('start-exam-btn-2024-shakai')).toHaveTextContent('🗾');
  });

  it('13. つぎの一歩（第一段・単元誘導）: 状態Aでは出ず、状態Bで単元特定できるとき表示され、全問正解では出ない', async () => {
    // 状態A（判定中）では表示されない
    const { unmount } = renderPage('rika');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    expect(screen.queryByTestId('next-step-card')).toBeNull();

    // 確定して状態Bになると表示される（2024理科は単元が特定できる）
    markAllZero('rika');
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());

    const card = screen.getByTestId('next-step-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId('next-step-headline')).toHaveTextContent(/は、もう少しで全快だよ。/);
    expect(screen.getByTestId('next-step-subtext')).toHaveTextContent(/もう少しだった問題:\d+問/);
    expect(screen.getByTestId('next-step-button')).toHaveTextContent('この症例スタディをはじめる ❯');
    unmount();

    // 全問せいかいのときは表示されない
    sessionStorage.clear();
    const allRikaSlots = slotsOf('rika');
    const perfectAnswers: Record<string, string> = {};
    const perfectRubrics: Record<string, Record<number, boolean>> = {};
    for (const s of allRikaSlots) {
      if (s.answerType === 'open') {
        const checks: Record<number, boolean> = {};
        (s.rubricItems || ['']).forEach((_, idx) => { checks[idx] = true; });
        perfectRubrics[s.id] = checks;
      } else {
        perfectAnswers[s.id] = s.correctAnswer;
      }
    }
    savePendingReview({
      version: 1, year: 2024, subject: 'rika',
      answers: perfectAnswers, rubricChecks: perfectRubrics,
      markedZeroSlots: {}, isTimeUpSubmitted: false, timestamp: Date.now(),
    });
    renderPage('rika');
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(screen.queryByTestId('next-step-card')).toBeNull();
  });

  it('14. つぎの一歩（Lv.4単元の復習＆遷移・戻っても受験記録が増えない）', async () => {
    // 2024算数で sansu-2024-01-01 (skill-sansu-calc-order) だけ「もう少し」、他をすべて正解にし、skill-sansu-calc-order を M4 に設定
    setSkillStage('skill-sansu-calc-order', 'M4');
    const allSansuSlots = slotsOf('sansu');
    const answers: Record<string, string> = {};
    for (const s of allSansuSlots) {
      if (s.id !== 'sansu-2024-01-01') {
        answers[s.id] = s.correctAnswer;
      }
    }
    const spyFocus = vi.spyOn(useAppStore.getState(), 'startSkillFocusSession');

    const { unmount } = renderPage('sansu');
    // 解答を入力して提出（算数は記述なしのため即状態B）
    for (const [slotId, val] of Object.entries(answers)) {
      const input = screen.getByTestId(`slot-${slotId}`);
      fireEvent.change(input, { target: { value: val } });
    }
    submit();
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(await db.finalChallengeResults.count()).toBe(1);

    // Lv.4用の文言とボタン名になっていること
    expect(screen.getByTestId('next-step-headline')).toHaveTextContent(
      '【計算の順序と四則混合計算】を、もう一度ふり返ろう。'
    );
    expect(screen.getByTestId('next-step-subtext')).toHaveTextContent('もう少しだった問題:1問');
    const btn = screen.getByTestId('next-step-button');
    expect(btn).toHaveTextContent('この症例を復習する ❯');

    // ボタンを押すと startSkillFocusSession がその skillId で1回だけ呼ばれ /study へ遷移する
    fireEvent.click(btn);
    expect(spyFocus).toHaveBeenCalledTimes(1);
    expect(spyFocus).toHaveBeenCalledWith('skill-sansu-calc-order');
    await waitFor(() => expect(screen.getByTestId('study-page')).toBeInTheDocument());
    unmount();

    // 戻ってきたとき（再マウント）に結果ページ（状態B）が保たれ、受験記録が増えないこと
    renderPage('sansu');
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());
    expect(await db.finalChallengeResults.count()).toBe(1);
    spyFocus.mockRestore();
  });

  it('15. つぎの一歩（第二段・教科誘導）と HashRouter での /?caseStudySubject= クエリ動作', async () => {
    // 2024社会（単元紐づけ0件）で提出・確定すると、第二段（社会）のカードが出る
    const { unmount } = renderPage('shakai');
    submit();
    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());
    markAllZero('shakai');
    fireEvent.click(screen.getByTestId('finalize-review-btn'));
    await waitFor(() => expect(screen.getByTestId('review-result-area')).toBeInTheDocument());

    expect(screen.getByTestId('next-step-headline')).toHaveTextContent(
      '【社会】の症例スタディで、れんしゅうしよう。'
    );
    expect(screen.getByTestId('next-step-subtext')).toHaveTextContent(
      `もう少しだった問題:${slotsOf('shakai').length}問`
    );
    const nextBtn = screen.getByTestId('next-step-button');
    expect(nextBtn).toHaveTextContent('【社会】の症例スタディをひらく ❯');

    // 押すとホームへ遷移し、社会の症例スタディタブが選択され、治療中の症例アコーディオンが開く
    fireEvent.click(nextBtn);
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    expect(screen.getByTestId('triage-card-banner')).toHaveTextContent('🗾 社会');
    expect(screen.getByTestId('toggle-unmastered-skills-btn')).toHaveTextContent('▲ とじる');
    unmount();

    // HashRouter で #/?caseStudySubject=kokugo を開いたとき、クエリが読まれ、反応後にURLからクエリが除去されること
    window.location.hash = '#/?caseStudySubject=kokugo';
    const { unmount: unmountHash } = render(
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </HashRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId('triage-card-banner')).toHaveTextContent('📖 国語');
    });
    expect(window.location.hash).not.toContain('caseStudySubject');
    unmountHash();

    // 不正な値（#/?caseStudySubject=invalid）は無視され、通常の初期表示（🧪 理科・アコーディオン閉）になること
    window.location.hash = '#/?caseStudySubject=invalid';
    const { unmount: unmountInvalid } = render(
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </HashRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId('triage-card-banner')).toHaveTextContent('🧪 理科');
    });
    expect(screen.getByTestId('toggle-unmastered-skills-btn')).toHaveTextContent('▼ ひらく');
    expect(window.location.hash).not.toContain('caseStudySubject');
    unmountInvalid();
  });

  it('16. テキスト・図表ボタン非表示＆古い viewMode:"text" データからの再開', async () => {
    // 古いデータに viewMode: 'text' が入っていても破棄せず 'image' として再開できる
    localStorage.setItem(
      'jvet:final-challenge-answering:2024:rika',
      JSON.stringify({
        version: 1,
        year: 2024,
        subject: 'rika',
        answers: { 'rika-2024-01-01-a': '主根' },
        currentPage: 2,
        remainingSeconds: 1500,
        timestamp: Date.now(),
        viewMode: 'text',
      })
    );

    renderPage('rika');
    expect(screen.queryByText('📐 テキスト・図表')).toBeNull();
    expect(screen.queryByText('📸 原本スキャン')).toBeNull();
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 2 / 7');
    expect((screen.getByTestId('slot-rika-2024-01-01-a') as HTMLInputElement).value).toBe('主根');
  });

  it('17. 見直しページ2カラム構成: 答え合わせ入力不可・未入力「かいていない」・状態A点数非表示・大問注意書き1回・設問タップでページ連動', async () => {
    renderPage('rika');
    // 1問だけ正解を入力し、他は未入力のまま提出
    fireEvent.change(screen.getByTestId('slot-rika-2024-01-01-a'), { target: { value: '主根' } });
    fireEvent.change(screen.getByTestId('slot-rika-2024-01-01-b'), { target: { value: 'まちがい' } });
    submit();

    await waitFor(() => expect(screen.getByTestId('review-pending-area')).toBeInTheDocument());

    // 状態Aで点数（0点など）が出ないこと
    expect(screen.queryByTestId('pending-score-display')).toBeNull();
    expect(screen.getByTestId('review-pending-area')).not.toHaveTextContent('いまの点数');

    // 左に原本ビューア、右に答え合わせカラムが存在すること
    expect(screen.getByTestId('review-left-problem-col')).toBeInTheDocument();
    const rightCol = screen.getByTestId('review-answer-column');
    expect(rightCol).toBeInTheDocument();

    // 答え合わせ側にテキスト入力欄（input[type="text"], textarea）が存在しないこと
    expect(rightCol.querySelectorAll('input[type="text"], textarea').length).toBe(0);

    // 正解は「✓ せいかい」、誤答は「✎ もう少し」、未入力は「— かいていない」が表示されること
    expect(screen.getByTestId('review-slot-rika-2024-01-01-a')).toHaveTextContent('✓ せいかい');
    expect(screen.getByTestId('review-slot-rika-2024-01-01-b')).toHaveTextContent('✎ もう少し');
    expect(screen.getByTestId('status-unanswered-rika-2024-01-01-c')).toHaveTextContent('— かいていない');

    // 大問の注意書きが大問見出し下に1回だけ表示されること
    expect(screen.getAllByTestId('review-section-notice-1').length).toBe(1);

    // 設問ヘッダー（p.5を見る）をタップすると左のページが p.5 へ移動し、カード本体タップでは移動しないこと
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 7');
    fireEvent.click(screen.getByTestId('review-slot-rika-2024-03-01'));
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 1 / 7');
    fireEvent.click(screen.getByTestId('jump-page-btn-rika-2024-03-01'));
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('ページ: 5 / 7');
  });

  it('18. 狭い幅(767px以下)では原本が下部に折りたたまれ、初期状態で閉じていること', async () => {
    const origWidth = window.innerWidth;
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    try {
      renderPage('rika');
      submit();
      await waitFor(() => expect(screen.getByTestId('exam-review-page')).toBeInTheDocument());

      const toggleBtn = screen.getByTestId('mobile-problem-toggle');
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('mobile-problem-content')).toBeNull();

      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('mobile-problem-content')).toBeInTheDocument();
    } finally {
      window.innerWidth = origWidth;
      window.dispatchEvent(new Event('resize'));
    }
  });
});
