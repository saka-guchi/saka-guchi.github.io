import type { Skill } from '../types';

export interface SkillProgressItem {
  id: string;
  title: string;
  category: string;
  levelType: 'core' | 'primary';
  levelTypeName: string; // '大問コア' | '基本'
  stage: 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';
  isMastered: boolean; // Lv.4以上
  nextGoalHint: string;
}

export const RIKA_EXAM_SKILLS: SkillProgressItem[] = [
  // 達成済み（3テーマ）
  {
    id: 'skill-rika-plant-dicot-monocot',
    title: '双子葉類と単子葉類の仲間分け',
    category: '植物',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M4',
    isMastered: true,
    nextGoalHint: 'マスター達成済み！あとは復習で定着',
  },
  {
    id: 'skill-rika-gas-co2',
    title: '二酸化炭素の性質と発生方法',
    category: '気体',
    levelType: 'primary',
    levelTypeName: '基本',
    stage: 'M4',
    isMastered: true,
    nextGoalHint: 'マスター達成済み！あとは復習で定着',
  },
  {
    id: 'skill-rika-physics-density-floating',
    title: '物体の密度と浮き沈みの判断',
    category: '浮力',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M4',
    isMastered: true,
    nextGoalHint: 'マスター達成済み！あとは復習で定着',
  },
  // 未達成（6テーマ）- ここをLv.4に引き上げる！
  {
    id: 'skill-rika-plant-vascular',
    title: '維管束の配置（内道外師）',
    category: '植物',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M2',
    isMastered: false,
    nextGoalHint: '「なぜそうなるか」理由問題に正解でLv.3へ！',
  },
  {
    id: 'skill-rika-physics-buoyancy-principle',
    title: 'アルキメデスの原理と浮力の計算',
    category: '浮力',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M1',
    isMastered: false,
    nextGoalHint: '選択肢なしでパッと思い出せるとLv.2へ！',
  },
  {
    id: 'skill-rika-env-greenhouse',
    title: '温室効果ガスと地球温暖化',
    category: '環境',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M2',
    isMastered: false,
    nextGoalHint: '「なぜそうなるか」理由問題に正解でLv.3へ！',
  },
  {
    id: 'skill-rika-plant-root-hair',
    title: '根毛の構造と表面積の役割',
    category: '植物',
    levelType: 'primary',
    levelTypeName: '基本',
    stage: 'M3',
    isMastered: false,
    nextGoalHint: '初見の応用問題に正解するとLv.4マスター！',
  },
  {
    id: 'skill-rika-env-ocean-acidification',
    title: '海洋酸性化と地球の炭素収支',
    category: '環境',
    levelType: 'primary',
    levelTypeName: '基本',
    stage: 'M1',
    isMastered: false,
    nextGoalHint: '選択肢なしでパッと思い出せるとLv.2へ！',
  },
  {
    id: 'skill-rika-physics-galileo-thermometer',
    title: '液体の温度変化とガリレオ温度計',
    category: '浮力',
    levelType: 'core',
    levelTypeName: '大問コア',
    stage: 'M2',
    isMastered: false,
    nextGoalHint: '「なぜそうなるか」理由問題に正解でLv.3へ！',
  },
];

