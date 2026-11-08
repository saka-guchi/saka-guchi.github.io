import type { Subject } from '../types';
import type { SampleQuestion } from './sample-data';
import {
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT,
  SUPPORTED_EXAM_YEARS,
  type ExamYear,
  type ChallengeSlot,
  type ChallengeSection,
} from './final-challenge-data';
import { getSubjectJaName } from '../utils/source-helper';
import { EXAM_SLOT_SKILL_MAP } from './exam-slot-skill-map';
import { THEME_ENHANCEMENTS } from './vet-curriculum-enhancement';

/**
 * Fisher-Yates アルゴリズムによる安全な配列シャッフル
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 選択肢テキスト（例: "ア 長野県"）をパース
 */
interface ParsedOption {
  originalLabel: string;
  text: string;
  isCorrect: boolean;
}

function parseOptions(options: string[], targetAnswer: string): ParsedOption[] {
  return options.map((opt, idx) => {
    const match = opt.match(/^([ア-ンA-Za-z0-9①-⑩]+)(?:[:：\.\s　]+)(.*)$/);
    const originalLabel = match ? match[1] : String.fromCharCode(65 + idx);
    const text = match ? match[2] : opt;
    const isCorrect =
      targetAnswer.includes(originalLabel) ||
      targetAnswer.includes(text) ||
      targetAnswer.trim() === opt.trim();

    return {
      originalLabel,
      text,
      isCorrect,
    };
  });
}

/**
 * ChallengeSlot から単問学習用 SampleQuestion を生成
 */
export function convertSlotToSampleQuestion(
  year: ExamYear,
  subject: Subject,
  section: ChallengeSection,
  slot: ChallengeSlot
): SampleQuestion {
  const subjectJa = getSubjectJaName(subject);
  const targetAnswer = (slot.stage2CorrectAnswer || slot.correctAnswer || '').trim();
  const rawOptions = slot.stage2Options || slot.options;

  // 複数正解（「イ、エ」など）かどうかの判定
  const isMultipleTarget = /[、,・]/.test(targetAnswer);

  let format: SampleQuestion['format'] = 'recall_card';
  let choices: SampleQuestion['choices'] = undefined;
  let finalCorrectAnswer: any = targetAnswer;

  // 選択肢があり、単一正解の場合は multiple_choice を採用
  if (rawOptions && rawOptions.length >= 2 && !isMultipleTarget) {
    const parsed = parseOptions(rawOptions, targetAnswer);
    const correctCount = parsed.filter(p => p.isCorrect).length;

    // 正解がちょうど1つ見つかった場合、4択クイズとして構成
    if (correctCount === 1) {
      format = 'multiple_choice';

      // シャッフルして新しいラベル（ア・イ・ウ・エ...）を割り当て（ルール㉒: 正解位置固定の禁止）
      const shuffled = shuffleArray(parsed);
      const japaneseLabels = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ'];

      choices = shuffled.map((item, idx) => {
        const id = String.fromCharCode(97 + idx); // 'a', 'b', 'c', 'd'
        if (item.isCorrect) {
          finalCorrectAnswer = id;
        }
        return {
          id,
          label: japaneseLabels[idx] || String(idx + 1),
          text: item.text,
          isCorrect: item.isCorrect,
        };
      });
    }
  }

  // ヒント2段階（問題・解答に即した具体解法ヒントを動的生成）
  const hints = generateSlotHints(year, subject, section, slot);

  // 解説
  const explanation = {
    resultSummary: `正解は「${targetAnswer}」です。`,
    keyTakeaway: `${year}年度 安田学園中学校 ${subjectJa}（${section.title}）`,
    reasoning: `過去問の実戦類題を繰り返し解いて、入試本番で確実に得点できる力を養いましょう！`,
  };

  return {
    id: `past-exam-${year}-${subject}-${slot.id}`,
    subject,
    format,
    prompt: slot.stage2Prompt || slot.label,
    category: section.title,
    skillTitle: section.title,
    source: `${year}年度 安田学園中学校 ${subjectJa}`,
    originalScan: {
      year,
      subject,
      pageNumber: slot.pageNumber,
      slotId: slot.id,
      sectionNumber: section.sectionNumber,
      questionNumber: slot.questionNumber,
      partNumber: slot.partNumber,
    },
    choices,
    correctAnswer: finalCorrectAnswer,
    hints,
    explanation,
  };
}

/**
 * 設問の特性・単元・ルーブリックに基づいて具体的で役立つ2段階ヒントを動的生成
 */
function generateSlotHints(
  year: ExamYear,
  subject: Subject,
  section: ChallengeSection,
  slot: ChallengeSlot
): [{ level: 1; text: string }, { level: 2; text: string }] {
  // 1. スロットに個別定義されたヒントがある場合
  if (slot.hints && slot.hints.length >= 2) {
    return [slot.hints[0], slot.hints[1]];
  }

  // 2. 単元マッピングから急所ヒントを取得
  const skillId = EXAM_SLOT_SKILL_MAP[slot.id];
  if (skillId && THEME_ENHANCEMENTS[skillId]) {
    const enh = THEME_ENHANCEMENTS[skillId];
    return [
      { level: 1, text: `💡 解法のコツ: ${enh.flashCard.tip}` },
      { level: 2, text: `🎯 入試の急所: ${enh.flashCard.examPoint}` },
    ];
  }

  const promptText = (slot.stage2Prompt || slot.label || '').toLowerCase();
  const labelText = slot.label || '';

  // 3. 算数の計算・小問集合の具体解法ヒント
  if (subject === 'sansu') {
    if (section.title.includes('計算') || labelText.includes('計算') || promptText.includes('計算')) {
      if (promptText.includes('□') || promptText.includes('しかく') || labelText.includes('逆算')) {
        return [
          { level: 1, text: '逆算（□を求める計算）は、計算の最後のまとまりから順にはがしていきましょう。' },
          { level: 2, text: '「＋」は「−」に、「×」は「÷」に入れ替え、外側の数から順に右辺へ移項して整理しよう。' },
        ];
      }
      if (promptText.includes('/') || promptText.includes('分') || promptText.includes('小数') || promptText.includes('.')) {
        return [
          { level: 1, text: '小数と分数が混ざっている場合は、すべて分数（または計算しやすい形）になおして整理しましょう。' },
          { level: 2, text: 'かけ算・わり算を先にまとめて約分できるか探し、計算を簡単にしてからたし引きしよう。' },
        ];
      }
      return [
        { level: 1, text: '計算の順序（カッコの中 → かけ算・わり算 → たし算・ひき算）をまず確認しましょう。' },
        { level: 2, text: '分配法則や工夫できる計算のまとまりがないか探してから筆算に入ろう。' },
      ];
    }
    if (section.title.includes('旅人') || promptText.includes('出会') || promptText.includes('分速') || promptText.includes('池のまわり')) {
      return [
        { level: 1, text: '反対向きに出会うときは「速さの和」、同じ向きに追いつくときは「速さの差」に着目しよう。' },
        { level: 2, text: '時間 ＝ 距離 ÷ (速さの和 または 差) の公式に当てはめて立式しよう。' },
      ];
    }
    if (section.title.includes('つるかめ') || promptText.includes('ツル') || promptText.includes('カメ')) {
      return [
        { level: 1, text: '「すべてどちらか一方（例えばすべてツル）だった場合」を仮定して計算してみよう。' },
        { level: 2, text: '実際の合計との差を求め、1つあたりの差で割るともう一方の個数が求まります。' },
      ];
    }
    if (section.title.includes('図形') || section.title.includes('面積') || promptText.includes('面積')) {
      return [
        { level: 1, text: '補助線を引くか、全体から不要な部分を引く「引く作戦」が使えないか考えよう。' },
        { level: 2, text: '合同な図形や等積変形、相似比・面積比の関係に着目して求めよう。' },
      ];
    }
  }

  // 4. 記述問題（open）
  if (slot.answerType === 'open') {
    if (slot.rubricItems && slot.rubricItems.length > 0) {
      const rubricClues = slot.rubricItems
        .map(r => r.replace(/と書けた.*$/, '').replace(/点.*$/, '').trim())
        .filter(Boolean)
        .slice(0, 2);
      if (rubricClues.length >= 2) {
        return [
          { level: 1, text: `問題文の条件をよく読み、「なぜそうなるのか」の理由や仕組みを説明しよう。` },
          { level: 2, text: `【着眼点】「${rubricClues[0]}」と「${rubricClues[1]}」の2つのポイントを含めてまとめよう。` },
        ];
      }
    }
    return [
      { level: 1, text: '問題文の指示された条件やキーワードを正確に拾い出し、結論から先に書こう。' },
      { level: 2, text: '「理由」を聞かれている場合は文末を「〜だから」「〜ため」で整えよう。' },
    ];
  }

  // 5. 選択問題（choice / multi_choice）
  if (slot.answerType === 'choice' || slot.answerType === 'multi_choice') {
    return [
      { level: 1, text: '問題文の問いかけ（正しいもの／誤っているもの／すべて選ぶ）の条件を再確認しよう。' },
      { level: 2, text: '各選択肢のキーワードを比較し、時代や性質の矛盾する選択肢を消去法で絞り込もう。' },
    ];
  }

  // 6. 語句問題（term）
  if (slot.answerType === 'term') {
    return [
      { level: 1, text: `【${section.title}】に関する重要キーワード・基本用語を思い出そう。` },
      { level: 2, text: '問題文の文脈や役割に合う語句を、漢字や送り仮名のミスがないよう正確に書こう。' },
    ];
  }

  // 7. 数値問題（numeric）
  return [
    { level: 1, text: '問題文に出てくる数値の条件と、求められている単位（cm、g、人など）を整理しよう。' },
    { level: 2, text: '公式に当てはめて計算し、概算（およその値）で見当をつけて検算しよう。' },
  ];
}

/**
 * 全年度（2026, 2025, 2024, 2023, 2022）の過去問から SampleQuestion を一括生成
 */
export function buildAllPastExamQuestions(): SampleQuestion[] {
  const all: SampleQuestion[] = [];

  for (const year of SUPPORTED_EXAM_YEARS) {
    const yearData = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[year];
    for (const subject of ['rika', 'sansu', 'shakai', 'kokugo'] as const) {
      const subData = yearData[subject];
      if (!subData?.sections) continue;

      for (const section of subData.sections) {
        for (const slot of section.slots) {
          const q = convertSlotToSampleQuestion(year, subject, section, slot);
          all.push(q);
        }
      }
    }
  }

  return all;
}

export const ALL_PAST_EXAM_QUESTIONS: SampleQuestion[] = buildAllPastExamQuestions();

/**
 * 本日の回診用に、複数年度（2022〜2026年度）をバランスよく均等にブレンドして抽出するアルゴリズム
 * 2024年度への偏りを完全に防止し、各年度の過去問を確実に体験できるようにする
 */
export function selectBalancedDailyExamQuestions(
  pool: SampleQuestion[],
  targetCount: number
): SampleQuestion[] {
  if (pool.length <= targetCount) {
    return shuffleArray(pool);
  }

  // 年度ごとに問題を分類
  const questionsByYear: Record<number, SampleQuestion[]> = {
    2026: [],
    2025: [],
    2024: [],
    2023: [],
    2022: [],
  };

  for (const q of pool) {
    const id = q.id || '';
    const src = q.source || '';
    let matchedYear = 2024; // デフォルト

    if (id.includes('2026') || src.includes('2026')) matchedYear = 2026;
    else if (id.includes('2025') || src.includes('2025')) matchedYear = 2025;
    else if (id.includes('2023') || src.includes('2023')) matchedYear = 2023;
    else if (id.includes('2022') || src.includes('2022')) matchedYear = 2022;
    else if (id.includes('2024') || src.includes('2024')) matchedYear = 2024;

    if (questionsByYear[matchedYear]) {
      questionsByYear[matchedYear].push(q);
    } else {
      questionsByYear[2024].push(q);
    }
  }

  // 問題が存在する年度のリスト
  const availableYears = SUPPORTED_EXAM_YEARS.filter(
    y => questionsByYear[y] && questionsByYear[y].length > 0
  );

  if (availableYears.length === 0) {
    return shuffleArray(pool).slice(0, targetCount);
  }

  // 各年度に配分する目標問題数を計算
  const basePerYear = Math.floor(targetCount / availableYears.length);
  let remainder = targetCount % availableYears.length;

  const selected: SampleQuestion[] = [];
  const selectedIds = new Set<string>();

  // シャッフルした各年度のプールから抽出
  for (const year of availableYears) {
    const quota = basePerYear + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const yearPool = shuffleArray(questionsByYear[year]);
    let taken = 0;
    for (const q of yearPool) {
      if (taken >= quota) break;
      if (!selectedIds.has(q.id)) {
        selected.push(q);
        selectedIds.add(q.id);
        taken++;
      }
    }
  }

  // 目標数に満たない場合、残りのプールから補充
  if (selected.length < targetCount) {
    const remainingPool = shuffleArray(pool.filter(q => !selectedIds.has(q.id)));
    for (const q of remainingPool) {
      if (selected.length >= targetCount) break;
      selected.push(q);
      selectedIds.add(q.id);
    }
  }

  // 選択問題の選択肢を再シャッフル（出題ごとのランダム化保証）
  const randomizedQuestions = selected.map(q => {
    if (q.choices && q.choices.length > 0) {
      const shuffledChoices = shuffleArray(q.choices);
      const japaneseLabels = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ'];
      let newCorrectAnswer = q.correctAnswer;

      const reindexed = shuffledChoices.map((c, idx) => {
        const newId = String.fromCharCode(97 + idx);
        if (c.id === q.correctAnswer || c.isCorrect) {
          newCorrectAnswer = newId;
        }
        return {
          ...c,
          id: newId,
          label: japaneseLabels[idx] || String(idx + 1),
        };
      });

      return {
        ...q,
        choices: reindexed,
        correctAnswer: newCorrectAnswer,
      };
    }
    return q;
  });

  // 全体をシャッフルして出題順をランダム化
  return shuffleArray(randomizedQuestions).slice(0, targetCount);
}

