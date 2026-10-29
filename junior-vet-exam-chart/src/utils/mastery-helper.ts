import { db } from '../db';
import type { MasteryStage } from '../types';

export interface MasteryLevelInfo {
  stage: string;
  label: string;          // 例: '🌱 みならい助手 (Lv.1)'
  shortLabel: string;     // 例: 'Lv.1 みならい'
  badgeColor: string;
  badgeBg: string;
  description: string;
}

const STAGE_STORAGE_PREFIX = 'junior_vet_skill_stage_';

/**
 * スキルの現在の習得レベル（ステージ M0〜M6）を動的に取得する
 */
export function getSkillStage(skillId: string, defaultStage: MasteryStage = 'M2'): MasteryStage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(`${STAGE_STORAGE_PREFIX}${skillId}`);
      if (saved && ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'].includes(saved)) {
        return saved as MasteryStage;
      }
    }
  } catch {
    // ignore
  }
  return defaultStage;
}

/**
 * スキルの習得レベル（ステージ）を更新・永続化する
 */
export function setSkillStage(skillId: string, stage: MasteryStage): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`${STAGE_STORAGE_PREFIX}${skillId}`, stage);
    }

    // IndexedDB にも非同期同期
    db.masteries.put({
      skillId,
      stage,
      score: stage === 'M5' ? 100 : stage === 'M4' ? 95 : stage === 'M3' ? 80 : stage === 'M2' ? 60 : 40,
      lastUpdated: Date.now(),
      consecutiveDirectRecallCount: 0,
      whyChoiceSuccessCount: 0,
      transferSuccessCount: 0,
      differentContextSuccessCount: 0,
    }).catch(() => {});

    // ホーム画面等の関連表示へ即時同期
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skill-stage-updated', {
        detail: {
          skillId,
          stage,
          isMastered: stage === 'M4' || stage === 'M5' || stage === 'M6',
        },
      }));
    }
  } catch {
    // ignore
  }
}

/**
 * スキルを1段階レベルアップ（昇格）させる
 */
export function promoteSkillStage(
  skillId: string,
  skillTitle: string = '重点単元',
  fallbackDefaultStage: MasteryStage = 'M2'
): { skillId: string; skillTitle: string; prevStage: string; newStage: string; isMastered: boolean } {
  const current = getSkillStage(skillId, fallbackDefaultStage);
  let next: MasteryStage = current;

  switch (current) {
    case 'M0': next = 'M1'; break;
    case 'M1': next = 'M2'; break;
    case 'M2': next = 'M3'; break;
    case 'M3': next = 'M4'; break;
    case 'M4': next = 'M5'; break;
    default: next = 'M4'; break;
  }

  setSkillStage(skillId, next);
  const isMastered = (next as string) === 'M4' || (next as string) === 'M5' || (next as string) === 'M6';
  return {
    skillId,
    skillTitle,
    prevStage: current,
    newStage: next,
    isMastered,
  };
}

/**
 * ステージに応じた次のレベルアップ目標ヒントを動的に生成する
 */
export function getNextGoalHint(stage: string): string {
  switch (stage) {
    case 'M0':
    case 'M1':
      return '選択肢なしでパッと思い出せるとLv.2へ！';
    case 'M2':
      return '「なぜそうなるか」理由問題に正解でLv.3へ！';
    case 'M3':
      return '場面が変わった応用問題に正解でLv.4マスター！';
    case 'M4':
    case 'M5':
    case 'M6':
      return 'マスター達成済み！カギ獲得完了🎉';
    default:
      return '問題を解いて定着させよう！';
  }
}

export function getMasteryLevelInfo(stage: string): MasteryLevelInfo {
  switch (stage) {
    case 'M0':
      return {
        stage: 'M0',
        label: '🐣 はじめてのカルテ (Lv.0)',
        shortLabel: 'Lv.0 はじめて',
        badgeColor: '#64748b',
        badgeBg: '#f1f5f9',
        description: 'これから新しく学ぶテーマです。',
      };
    case 'M1':
      return {
        stage: 'M1',
        label: '🌱 みならい助手 (Lv.1)',
        shortLabel: 'Lv.1 みならい',
        badgeColor: '#2563eb',
        badgeBg: '#eff6ff',
        description: '選択肢を見れば正解を選べるレベル！',
      };
    case 'M2':
      return {
        stage: 'M2',
        label: '🌿 てごたえあり (Lv.2)',
        shortLabel: 'Lv.2 てごたえ',
        badgeColor: '#059669',
        badgeBg: '#ecfdf5',
        description: '選択肢を見る前に、頭の中でパッと思い出せるレベル！',
      };
    case 'M3':
      return {
        stage: 'M3',
        label: '🍀 なっとく理由 (Lv.3)',
        shortLabel: 'Lv.3 なっとく',
        badgeColor: '#0d9488',
        badgeBg: '#f0fdfa',
        description: '「なぜそうなるのか」理由や解く手順まで説明できるレベル！',
      };
    case 'M4':
      return {
        stage: 'M4',
        label: '⭐ カルテマスター (Lv.4)',
        shortLabel: 'Lv.4 マスター',
        badgeColor: '#d97706',
        badgeBg: '#fffbeb',
        description: '数字や場面が変わった初めて見る応用問題もスラスラ解けるレベル！',
      };
    case 'M5':
      return {
        stage: 'M5',
        label: '👑 かんぺき定着 (Lv.5)',
        shortLabel: 'Lv.5 かんぺき',
        badgeColor: '#7c3aed',
        badgeBg: '#faf5ff',
        description: '何日か経ったあとの復習でもバッチリ正解できる本物の実力！',
      };
    case 'M6':
      return {
        stage: 'M6',
        label: '🏆 合格ドクター (Lv.6)',
        shortLabel: 'Lv.6 ドクター',
        badgeColor: '#e11d48',
        badgeBg: '#fff1f2',
        description: '本番形式のテストで満点を達成！立派な合格ドクター認定！',
      };
    default:
      return {
        stage,
        label: `🌱 Lv.1`,
        shortLabel: 'Lv.1',
        badgeColor: '#2563eb',
        badgeBg: '#eff6ff',
        description: '',
      };
  }
}

