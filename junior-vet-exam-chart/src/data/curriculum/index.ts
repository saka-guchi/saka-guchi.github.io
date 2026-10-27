import type { StoredPack } from '../../db';
import type { SampleQuestion } from '../sample-data';
import { SAMPLE_QUESTIONS } from '../sample-data';

// 理科
import rikaQuestions from './rika/questions.json';
import rikaSkills from './rika/skills.json';
import rikaPractice from './rika/practice.json';
import rikaTransfer from './rika/transfer.json';
import rikaIntegrated from './rika/integrated.json';
import rikaStage2 from './rika/stage2.json';
import rikaFigures from './rika/figures.json';

// 算数
import sansuQuestions from './sansu/questions.json';
import sansuSkills from './sansu/skills.json';
import sansuPractice from './sansu/practice.json';
import sansuTransfer from './sansu/transfer.json';
import sansuIntegrated from './sansu/integrated.json';
import sansuStage2 from './sansu/stage2.json';
import sansuFigures from './sansu/figures.json';

// 社会
import shakaiQuestions from './shakai/questions.json';
import shakaiSkills from './shakai/skills.json';
import shakaiPractice from './shakai/practice.json';
import shakaiTransfer from './shakai/transfer.json';
import shakaiIntegrated from './shakai/integrated.json';
import shakaiStage2 from './shakai/stage2.json';
import shakaiFigures from './shakai/figures.json';

// 全スキル・全問題・全図表の合算
export const ALL_CURRICULUM_SKILLS = [...rikaSkills, ...sansuSkills, ...shakaiSkills];
export const ALL_EXAM_QUESTIONS = [...rikaQuestions, ...sansuQuestions, ...shakaiQuestions];
export const ALL_CURRICULUM_FIGURES = [...rikaFigures, ...sansuFigures, ...shakaiFigures];

// スキル辞書
const skillMap = new Map<string, { title: string; category: string }>();
for (const s of ALL_CURRICULUM_SKILLS) {
  skillMap.set(s.id, { title: s.title, category: s.category });
}

// 組み込みパックデータ（2024年度 安田学園中学校 3教科総合パック）
export const BUILTIN_YASUDA_PACK: StoredPack = {
  examId: 'yasuda-2024',
  manifest: {
    packId: 'pack-yasuda-2024-1.0.0',
    examId: 'yasuda-2024',
    title: '2024年度 安田学園中学校 入学試験【理科・算数・社会】',
    version: '1.0.0',
    subjects: [
      { subject: 'rika', questionCount: rikaQuestions.length },
      { subject: 'sansu', questionCount: sansuQuestions.length },
      { subject: 'shakai', questionCount: shakaiQuestions.length },
    ],
    files: [],
  },
  questions: ALL_EXAM_QUESTIONS as any,
  answers: [],
  figures: ALL_CURRICULUM_FIGURES as any,
  skills: ALL_CURRICULUM_SKILLS as any,
  skillDependencies: [],
  practice: [...rikaPractice, ...sansuPractice, ...shakaiPractice] as any,
  transfer: [...rikaTransfer, ...sansuTransfer, ...shakaiTransfer] as any,
  integrated: [...rikaIntegrated, ...sansuIntegrated, ...shakaiIntegrated] as any,
  stage2: [...rikaStage2, ...sansuStage2, ...shakaiStage2] as any,
  regions: [],
  images: {
    // 理科
    'figures/fig-rika-01-root.webp': './figures/fig-rika-01-root.webp',
    'figures/fig-rika-01-stem.webp': './figures/fig-rika-01-stem.webp',
    'figures/fig-rika-03-archimedes.webp': './figures/fig-rika-03-archimedes.webp',
    'figures/fig-rika-03-thermometer.webp': './figures/fig-rika-03-thermometer.webp',
    'images/pages/rika/mondai_p001.webp': './pages/rika/mondai_p001.webp',
    'images/pages/rika/mondai_p002.webp': './pages/rika/mondai_p002.webp',
    'images/pages/rika/mondai_p003.webp': './pages/rika/mondai_p003.webp',
    'images/pages/rika/mondai_p004.webp': './pages/rika/mondai_p004.webp',
    'images/pages/rika/mondai_p005.webp': './pages/rika/mondai_p005.webp',
    'images/pages/rika/mondai_p006.webp': './pages/rika/mondai_p006.webp',
    'images/pages/rika/mondai_p007.webp': './pages/rika/mondai_p007.webp',
    'images/pages/rika/kaito_p001.webp': './pages/rika/kaito_p001.webp',

    // 算数
    'figures/fig-sansu-01-fan.webp': './figures/fig-sansu-01-fan.webp',
    'figures/fig-sansu-01-cube-tilt.webp': './figures/fig-sansu-01-cube-tilt.webp',
    'figures/fig-sansu-02-trapezoid.webp': './figures/fig-sansu-02-trapezoid.webp',
    'figures/fig-sansu-04-cube-cut.webp': './figures/fig-sansu-04-cube-cut.webp',
    'images/pages/sansu/mondai_p001.webp': './pages/sansu/mondai_p001.webp',
    'images/pages/sansu/mondai_p002.webp': './pages/sansu/mondai_p002.webp',
    'images/pages/sansu/mondai_p003.webp': './pages/sansu/mondai_p003.webp',
    'images/pages/sansu/mondai_p004.webp': './pages/sansu/mondai_p004.webp',
    'images/pages/sansu/mondai_p005.webp': './pages/sansu/mondai_p005.webp',
    'images/pages/sansu/mondai_p006.webp': './pages/sansu/mondai_p006.webp',
    'images/pages/sansu/mondai_p007.webp': './pages/sansu/mondai_p007.webp',
    'images/pages/sansu/mondai_p008.webp': './pages/sansu/mondai_p008.webp',
    'images/pages/sansu/mondai_p009.webp': './pages/sansu/mondai_p009.webp',
    'images/pages/sansu/mondai_p010.webp': './pages/sansu/mondai_p010.webp',
    'images/pages/sansu/kaito_p001.webp': './pages/sansu/kaito_p001.webp',

    // 社会
    'figures/fig-shakai-01-map.webp': './figures/fig-shakai-01-map.webp',
    'figures/fig-shakai-01-tables.webp': './figures/fig-shakai-01-tables.webp',
    'figures/fig-shakai-01-fish-table.webp': './figures/fig-shakai-01-fish-table.webp',
    'figures/fig-shakai-02-japan-map.webp': './figures/fig-shakai-02-japan-map.webp',
    'figures/fig-shakai-02-edo-art.webp': './figures/fig-shakai-02-edo-art.webp',
    'images/pages/shakai/mondai_p001.webp': './pages/shakai/mondai_p001.webp',
    'images/pages/shakai/mondai_p002.webp': './pages/shakai/mondai_p002.webp',
    'images/pages/shakai/mondai_p003.webp': './pages/shakai/mondai_p003.webp',
    'images/pages/shakai/mondai_p004.webp': './pages/shakai/mondai_p004.webp',
    'images/pages/shakai/mondai_p005.webp': './pages/shakai/mondai_p005.webp',
    'images/pages/shakai/mondai_p006.webp': './pages/shakai/mondai_p006.webp',
    'images/pages/shakai/mondai_p007.webp': './pages/shakai/mondai_p007.webp',
    'images/pages/shakai/mondai_p008.webp': './pages/shakai/mondai_p008.webp',
    'images/pages/shakai/mondai_p009.webp': './pages/shakai/mondai_p009.webp',
    'images/pages/shakai/mondai_p010.webp': './pages/shakai/mondai_p010.webp',
    'images/pages/shakai/kaito_p001.webp': './pages/shakai/kaito_p001.webp',
  },
  importedAt: Date.now(),
};

// 演習問題、応用問題、統合問題、過去問を SampleQuestion 形式に正規化して結合
function buildCurriculumQuestions(): SampleQuestion[] {
  const list: SampleQuestion[] = [...SAMPLE_QUESTIONS];

  const allPractice = [
    ...rikaPractice.map(p => ({ ...p, subject: 'rika' as const })),
    ...sansuPractice.map(p => ({ ...p, subject: 'sansu' as const })),
    ...shakaiPractice.map(p => ({ ...p, subject: 'shakai' as const })),
  ];

  const allTransfer = [
    ...rikaTransfer.map(t => ({ ...t, subject: 'rika' as const })),
    ...sansuTransfer.map(t => ({ ...t, subject: 'sansu' as const })),
    ...shakaiTransfer.map(t => ({ ...t, subject: 'shakai' as const })),
  ];

  const allIntegrated = [
    ...rikaIntegrated.map(i => ({ ...i, subject: 'rika' as const })),
    ...sansuIntegrated.map(i => ({ ...i, subject: 'sansu' as const })),
    ...shakaiIntegrated.map(i => ({ ...i, subject: 'shakai' as const })),
  ];

  // 1. 基礎練習問題 (practice)
  for (const p of allPractice as any[]) {
    const sInfo = skillMap.get(p.skillId) || { title: '基礎知識・解法', category: p.subject === 'sansu' ? '算数' : p.subject === 'shakai' ? '社会' : '理科' };
    const hints = (p.hints && p.hints.length >= 2)
      ? [p.hints[0], p.hints[1]]
      : [
          { level: 1, text: '落ち着いて問題文のキーワードを確認しよう。' },
          { level: 2, text: '学習した解法や知識を思い出そう。' },
        ];

    list.push({
      id: p.id,
      subject: p.subject,
      format: p.format || (p.choices ? 'multiple_choice' : 'recall_card'),
      prompt: p.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: p.skillId,
      choices: p.choices,
      correctAnswer: p.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${p.correctAnswer}】です。`,
        keyTakeaway: sInfo.title,
        reasoning: '基礎解法・知識をしっかり頭に定着させましょう。',
      },
      figureUrl: p.figureId ? `./figures/${p.figureId}.webp` : undefined,
      data: p.data,
    });
  }

  // 2. 転用・応用問題 (transfer)
  for (const t of allTransfer as any[]) {
    const primarySkillId = t.requiredSkillIds?.[0];
    const sInfo = skillMap.get(primarySkillId) || { title: '応用思考力', category: t.subject === 'sansu' ? '算数' : t.subject === 'shakai' ? '社会' : '理科' };
    const hints = (t.hints && t.hints.length >= 2)
      ? [t.hints[0], t.hints[1]]
      : [
          { level: 1, text: '問題文の条件を整理してみよう。' },
          { level: 2, text: '基本原理を別の場面に当てはめてみよう。' },
        ];

    list.push({
      id: t.id,
      subject: t.subject,
      format: t.format || (t.choices ? 'multiple_choice' : 'recall_card'),
      prompt: t.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: primarySkillId,
      choices: t.choices,
      correctAnswer: t.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${t.correctAnswer}】です。`,
        keyTakeaway: t.expectedReasoning || sInfo.title,
        reasoning: t.expectedReasoning || '条件の違いに着目して考えましょう。',
      },
      figureUrl: t.figureId ? `./figures/${t.figureId}.webp` : undefined,
      data: t.data,
    });
  }

  // 3. 統合問題 (integrated)
  for (const integ of allIntegrated as any[]) {
    const primarySkillId = integ.requiredSkillIds?.[0];
    const sInfo = skillMap.get(primarySkillId) || { title: '複合問題', category: integ.subject === 'sansu' ? '算数' : integ.subject === 'shakai' ? '社会' : '理科' };
    const hints = (integ.hints && integ.hints.length >= 2)
      ? [integ.hints[0], integ.hints[1]]
      : [
          { level: 1, text: '複数の知識を組み合わせて考えてみよう。' },
          { level: 2, text: '1つずつ条件を絞り込んでいこう。' },
        ];

    list.push({
      id: integ.id,
      subject: integ.subject,
      format: integ.format || (integ.choices ? 'multiple_choice' : 'recall_card'),
      prompt: integ.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: primarySkillId,
      choices: integ.choices,
      correctAnswer: integ.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${integ.correctAnswer}】です。`,
        keyTakeaway: '複数テーマの複合的な理解が必要です。',
        reasoning: '各分野の性質を正確につなげて判断しましょう。',
      },
      figureUrl: integ.figureId ? `./figures/${integ.figureId}.webp` : undefined,
      data: integ.data,
    });
  }

  return list;
}

export const ALL_CURRICULUM_QUESTIONS: SampleQuestion[] = buildCurriculumQuestions();
