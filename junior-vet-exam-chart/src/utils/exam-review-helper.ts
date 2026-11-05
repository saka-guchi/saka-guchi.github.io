import { getExamBadgeTier, getExamBadgeInfo } from './exam-scores';
import { ALL_PROGRESS_SKILLS, type ComprehensiveSkillProgressItem } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { EXAM_SLOT_SKILL_MAP } from '../data/exam-slot-skill-map';
import { getSkillStage } from './mastery-helper';
import { getMemoryRetention } from './memory-retention';
import { getSubjectJaName } from './source-helper';
import type { MasteryStage, Subject } from '../types';

export interface MikeFeedback {
  message: string;
  badgeTitle?: string;
  nextRewardText?: string;
}

/**
 * 点数帯ごとのミケちゃんの一言メッセージ（小学3〜6年生向け・肯定的な承認と次の一歩）
 * ごほうびの称号・次の目安は exam-scores.ts の定義（ホームと同じ定義）を参照する
 */
export function getMikeFeedback(score: number): MikeFeedback {
  const tier = getExamBadgeTier(score);
  const badgeInfo = tier ? getExamBadgeInfo(tier) : null;
  const badgeTitle = badgeInfo ? `${badgeInfo.icon} ${badgeInfo.label}` : undefined;

  if (score === 100) {
    const messages = [
      '全部せいかい！最後までよく見て、ていねいに解けたね。完ぺきだよ！',
      '満点クリア！じっくり考え抜いた成果が出たね。すごい集中力だよ！',
      '全問せいかい、お見事！自信を持って、つぎのステップへ進もう！',
    ];
    return {
      message: messages[score % messages.length],
      badgeTitle,
      nextRewardText: '最高ランクを達成したよ！',
    };
  }

  if (score >= 90) {
    const nextInfo = getExamBadgeInfo('gold');
    const messages = [
      'すばらしい点数だよ！あと1歩で満点だね。見直しのコツがつかめてきたよ！',
      '高得点クリア、かっこいい！難しい問題もあきらめずに解ききったね。',
      '90点こえ、大かつやく！あともう少しの1問を、カルテでたしかめてみよう。',
    ];
    return {
      message: messages[score % messages.length],
      badgeTitle,
      nextRewardText: `あと ${100 - score} 点で、${nextInfo?.label ?? '最高賞'}だよ`,
    };
  }

  if (score >= 80) {
    const nextInfo = getExamBadgeInfo('silver');
    const messages = [
      '合格おめでとう！しっかり点数を取れたね。得意な単元がどんどん増えているよ！',
      '80点たっせい！最後までねばり強く取り組んだね。カルテで弱点をつぶそう！',
      'ナイスチャレンジ！力を発揮できたね。次はさらに上をめざせるよ。',
    ];
    return {
      message: messages[score % messages.length],
      badgeTitle,
      nextRewardText: `あと ${90 - score} 点で、${nextInfo?.label ?? 'つぎの称号'}だよ`,
    };
  }

  if (score >= 60) {
    const nextInfo = getExamBadgeInfo('bronze');
    const messages = [
      '合格ラインクリア！最後まで全部やりきったね。まずは自分に拍手しよう！',
      'やりきったね！解けた問題がたくさんあったよ。もう少しだった問題を見直そう。',
      '合格おめでとう！毎日の積み重ねが形になってきたね。つぎもがんばろう！',
    ];
    return {
      message: messages[score % messages.length],
      badgeTitle,
      nextRewardText: `あと ${80 - score} 点で、${nextInfo?.label ?? 'つぎの称号'}だよ`,
    };
  }

  const certInfo = getExamBadgeInfo('certificate');
  if (score >= 40) {
    const messages = [
      '最後まで解ききったのが、いちばんのエライところ！よくがんばったね。',
      'じっくり問題に向き合えたね。解けた問題をほめて、つぎのチャンスにつなげよう。',
      '集中して最後まで取り組めたね。もう少しだった単元を、カルテで復習してみよう。',
    ];
    return {
      message: messages[score % messages.length],
      nextRewardText: `あと ${60 - score} 点で、${certInfo?.label ?? '認定証'}だよ`,
    };
  }

  const messages = [
    '最後までよくがんばったね！入試問題にちょう戦したこと自体が、大きな一歩だよ。',
    '難しい試験に最後まで立ち向かったね！まずは1問ずつ、できる問題を増やしていこう。',
    '解ききってえらい！カルテの特訓で力をたくわえて、またちょう戦しようね。',
  ];
  return {
    message: messages[score % messages.length],
    nextRewardText: `あと ${60 - score} 点で、${certInfo?.label ?? '認定証'}だよ`,
  };
}

/**
 * 採点基準（ルーブリック）の文言を子ども向けに変換する
 * 例:「〜に触れている点」→「〜が書けた」
 */
export function formatRubricItem(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(
    /(?:に触れている(?:点|こと)|について言及している(?:点|こと)|に言及している(?:点|こと))$/g,
    'が書けた'
  );
  if (!cleaned.endsWith('が書けた') && !cleaned.endsWith('書けた')) {
    cleaned = cleaned.replace(/(?:点|こと)$/g, '');
    if (!cleaned.endsWith('が書けた')) {
      cleaned = `${cleaned}が書けた`;
    }
  }
  return cleaned;
}

export interface NeedsWorkSlotInput {
  slotId: string;
  subject: Subject;
}

export type NextStepRecommendation =
  | {
      kind: 'skill';
      skillId: string;
      skillTitle: string;
      patientIcon: string;
      patientName: string;
      needsWorkCount: number;
      isMastered: boolean;
      headlineText: string;
      subText: string;
      buttonText: string;
    }
  | {
      kind: 'subject';
      subject: Subject;
      subjectLabel: string;
      needsWorkCount: number;
      headlineText: string;
      subText: string;
      buttonText: string;
    };

export interface SelectNextStepOptions {
  skillMap?: Readonly<Record<string, string>>;
  skillsList?: readonly ComprehensiveSkillProgressItem[];
  getStageFn?: (skillId: string, defaultStage: MasteryStage) => MasteryStage;
  getRetentionFn?: (skillId: string) => number;
}

function stageToNumericLevel(stage: MasteryStage | string): number {
  switch (stage) {
    case 'M0': return 0;
    case 'M1': return 1;
    case 'M2': return 2;
    case 'M3': return 3;
    case 'M4': return 4;
    case 'M5': return 5;
    case 'M6': return 6;
    default: return 2;
  }
}

/**
 * 「もう少し」だった設問から「つぎの一歩」の1件を選ぶ純粋関数（第一段: 単元 / 第二段: 教科）
 */
export function selectNextStepRecommendation(
  needsWorkSlots: readonly NeedsWorkSlotInput[],
  options: SelectNextStepOptions = {}
): NextStepRecommendation | null {
  if (!needsWorkSlots || needsWorkSlots.length === 0) {
    return null;
  }

  const skillMap = options.skillMap ?? EXAM_SLOT_SKILL_MAP;
  const skillsList = options.skillsList ?? ALL_PROGRESS_SKILLS;
  const getStage = options.getStageFn ?? getSkillStage;
  const getRetention = options.getRetentionFn ?? getMemoryRetention;

  const skillLookup = new Map<string, ComprehensiveSkillProgressItem>();
  for (const s of skillsList) {
    skillLookup.set(s.id, s);
  }

  // 第一段: 単元の集計（辞書にあり、かつskillsListに存在する単元のみ）
  const skillStats = new Map<
    string,
    { skill: ComprehensiveSkillProgressItem; count: number; firstOrder: number }
  >();

  needsWorkSlots.forEach((item, index) => {
    const mappedSkillId = item.slotId ? skillMap[item.slotId] : undefined;
    if (!mappedSkillId) return;
    const skillObj = skillLookup.get(mappedSkillId);
    if (!skillObj) return;

    const existing = skillStats.get(mappedSkillId);
    if (existing) {
      existing.count += 1;
    } else {
      skillStats.set(mappedSkillId, {
        skill: skillObj,
        count: 1,
        firstOrder: index,
      });
    }
  });

  if (skillStats.size > 0) {
    const candidates = Array.from(skillStats.values()).map((entry) => {
      const currentStage = getStage(entry.skill.id, entry.skill.stage);
      const levelNum = stageToNumericLevel(currentStage);
      const retention = getRetention(entry.skill.id);
      return {
        ...entry,
        currentStage,
        levelNum,
        retention,
      };
    });

    // 1. 「もう少し」の問題が最も多い単元
    // 2. 同数なら、現在のレベルが低い単元
    // 3. それでも同じなら、記憶キープ度が低い単元
    // 4. それでも同じなら、年度・設問の順で先に出てくる単元
    candidates.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.levelNum !== b.levelNum) return a.levelNum - b.levelNum;
      if (a.retention !== b.retention) return a.retention - b.retention;
      return a.firstOrder - b.firstOrder;
    });

    const winner = candidates[0];
    const isMastered = winner.levelNum >= 4;
    const enhance = THEME_ENHANCEMENTS[winner.skill.id];
    const patientIcon = enhance?.patientAnimal?.icon || winner.skill.patientIcon || '🐾';
    const patientName = enhance?.patientAnimal?.name || winner.skill.patientName || '患者どうぶつ';

    return {
      kind: 'skill',
      skillId: winner.skill.id,
      skillTitle: winner.skill.title,
      patientIcon,
      patientName,
      needsWorkCount: winner.count,
      isMastered,
      headlineText: isMastered
        ? `【${winner.skill.title}】を、もう一度ふり返ろう。`
        : `【${winner.skill.title}】は、もう少しで全快だよ。`,
      subText: `もう少しだった問題:${winner.count}問`,
      buttonText: isMastered ? 'この症例を復習する ❯' : 'この症例スタディをはじめる ❯',
    };
  }

  // 第二段: 単元が特定できない場合は教科単位へフォールバック（「もう少し」が最も多い教科、同数なら出現順）
  const subjectStats = new Map<Subject, { subject: Subject; count: number; firstOrder: number }>();
  needsWorkSlots.forEach((item, index) => {
    if (!item.subject) return;
    const existing = subjectStats.get(item.subject);
    if (existing) {
      existing.count += 1;
    } else {
      subjectStats.set(item.subject, {
        subject: item.subject,
        count: 1,
        firstOrder: index,
      });
    }
  });

  if (subjectStats.size === 0) {
    return null;
  }

  const subjectCandidates = Array.from(subjectStats.values());
  subjectCandidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.firstOrder - b.firstOrder;
  });

  const winningSub = subjectCandidates[0];
  const subLabel = getSubjectJaName(winningSub.subject);

  return {
    kind: 'subject',
    subject: winningSub.subject,
    subjectLabel: subLabel,
    needsWorkCount: winningSub.count,
    headlineText: `【${subLabel}】の症例スタディで、れんしゅうしよう。`,
    subText: `もう少しだった問題:${winningSub.count}問`,
    buttonText: `【${subLabel}】の症例スタディをひらく ❯`,
  };
}
