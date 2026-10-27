export interface MasteryLevelInfo {
  stage: string;
  label: string;          // 例: '🌱 みならい助手 (Lv.1)'
  shortLabel: string;     // 例: 'Lv.1 みならい'
  badgeColor: string;
  badgeBg: string;
  description: string;
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

