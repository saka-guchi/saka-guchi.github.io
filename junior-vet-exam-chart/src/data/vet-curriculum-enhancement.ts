// 中学受験理科9テーマに対応する「動物カルテ・ストーリー」と「クイック暗記カード」

export interface ThemeEnhancement {
  skillId: string;
  field: '生物' | '物理' | '地学' | '化学';
  fieldColor: string;
  fieldBg: string;
  patientAnimal: {
    icon: string;
    name: string;
    role: string;
    symptom: string; // 獣医ストーリー
  };
  memoryRetention: number; // 記憶定着率 0〜100%
  flashCard: {
    question: string;
    answer: string;
    tip: string;
    examPoint: string;
  };
}

export const THEME_ENHANCEMENTS: Record<string, ThemeEnhancement> = {
  'skill-rika-plant-dicot-monocot': {
    skillId: 'skill-rika-plant-dicot-monocot',
    field: '生物',
    fieldColor: '#10b981',
    fieldBg: '#ecfdf5',
    patientAnimal: {
      icon: '🐿️',
      name: 'シマリスのチッチ',
      role: '木の実・種ドクター',
      symptom: '「ドングリやアサガオの種を拾ったよ！子葉が2枚出るか1枚出るかカルテをチェックしてね！」',
    },
    memoryRetention: 95,
    flashCard: {
      question: '単子葉類と双子葉類の【葉脈】と【根】のちがいは？',
      answer: '単子葉類＝平行脈・ひげ根 / 双子葉類＝網状脈・主根と側根',
      tip: '覚え方：「たんぽぽ（単・平）」で単子葉類は平行！トウモロコシやイネも仲間だよ。',
      examPoint: '中学受験の最頻出！茎の維管束の散らばり（単子葉）か輪（双子葉）かもセットで出ます。',
    },
  },
  'skill-rika-gas-co2': {
    skillId: 'skill-rika-gas-co2',
    field: '化学',
    fieldColor: '#8b5cf6',
    fieldBg: '#f5f3ff',
    patientAnimal: {
      icon: '🦉',
      name: 'フクロウのホッホ先生',
      role: '空気のけんきゅう室長',
      symptom: '「夜の森で気体の実験中じゃ。二酸化炭素の重さや石灰水の反応をカルテに記すのじゃ！」',
    },
    memoryRetention: 90,
    flashCard: {
      question: '二酸化炭素（CO2）の発生方法と集め方は？',
      answer: '石灰石（貝殻など）＋ うすい塩酸 ／ 水上置換（または下方置換）',
      tip: '水に少し溶けるけれど、水上置換で集めるのが一番純度が高くて安全！',
      examPoint: '空気より重い（下方置換可）、石灰水を白くにごらせる、火を消す性質が狙われます。',
    },
  },
  'skill-rika-physics-density-floating': {
    skillId: 'skill-rika-physics-density-floating',
    field: '物理',
    fieldColor: '#3b82f6',
    fieldBg: '#eff6ff',
    patientAnimal: {
      icon: '🦦',
      name: 'ラッコのクーちゃん',
      role: 'ぷかぷか水泳ドクター',
      symptom: '「お気に入りの貝が水に浮くか沈むか実験中！密度と重さのヒミツを解き明かそう！」',
    },
    memoryRetention: 88,
    flashCard: {
      question: '水（密度 1.0 g/cm³）に物体が浮く条件は？',
      answer: '物体の密度が 1.0 g/cm³ より小さいとき（密度＝重さ÷体積）',
      tip: '体積が大きくても軽ければ浮く！「密度の勝負」だよ。',
      examPoint: '1cm³あたりの重さに直して比べる計算問題が合否を分けます。',
    },
  },
  'skill-rika-plant-vascular': {
    skillId: 'skill-rika-plant-vascular',
    field: '生物',
    fieldColor: '#10b981',
    fieldBg: '#ecfdf5',
    patientAnimal: {
      icon: '🐰',
      name: '白うさぎのミミ',
      role: 'お耳ピクピク患者さん',
      symptom: '「お庭のセロリを食べたらスジがあったよ！水と栄養が通る道はどう並んでるの？」',
    },
    memoryRetention: 65,
    flashCard: {
      question: '茎の維管束で、道管と師管の配置はどちらが内側？',
      answer: '【内道・外師（ないどう・がいし）】道管が内側、師管が外側！',
      tip: '呪文「内道外師」で一発暗記！根から吸った水は幹の深い内側を通って守られるよ。',
      examPoint: '「赤いインクを吸わせたセロリの切り口」の断面図選択問題が頻出！',
    },
  },
  'skill-rika-physics-buoyancy-principle': {
    skillId: 'skill-rika-physics-buoyancy-principle',
    field: '物理',
    fieldColor: '#3b82f6',
    fieldBg: '#eff6ff',
    patientAnimal: {
      icon: '🦆',
      name: 'コガモのピピ',
      role: 'みずかき練習生',
      symptom: '「水の中に入ると体が軽くなるよ！アルキメデスさんの浮力の計算をお手当てして！」',
    },
    memoryRetention: 42,
    flashCard: {
      question: '浮力の大きさは何と等しい？（アルキメデスの原理）',
      answer: '物体が【おしのけた液体の重さ】とぴったり等しい！',
      tip: '体積 100 cm³ の物体を全部水（1g/cm³）に沈めたら、浮力は 100 g重になるよ。',
      examPoint: 'ばねばかりの目盛りの減り＝浮力。台ばかりの目盛りの増え＝浮力（反作用）！',
    },
  },
  'skill-rika-env-greenhouse': {
    skillId: 'skill-rika-env-greenhouse',
    field: '地学',
    fieldColor: '#f59e0b',
    fieldBg: '#fffbeb',
    patientAnimal: {
      icon: '🐻‍❄️',
      name: 'ホッキョクグマのシロ',
      role: '北極レスキュー患者さん',
      symptom: '「北極の氷がとけて足場が少なくなってるの…温室効果ガスのカルテを直して！」',
    },
    memoryRetention: 60,
    flashCard: {
      question: '地球温暖化の主な原因となる代表的な気体は？',
      answer: '二酸化炭素（CO2）やメタン、フロンなど',
      tip: '温室効果自体は地球を適温に保つために必要だけど、増えすぎると気温が上昇しちゃう！',
      examPoint: '化石燃料の燃焼と森林伐採が二酸化炭素増加の2大要因として記述されます。',
    },
  },
  'skill-rika-plant-root-hair': {
    skillId: 'skill-rika-plant-root-hair',
    field: '生物',
    fieldColor: '#10b981',
    fieldBg: '#ecfdf5',
    patientAnimal: {
      icon: '🐹',
      name: 'ハムスターのチョコ',
      role: 'お庭の探検隊長',
      symptom: '「草の根っこにフサフサの毛が生えてたよ！どうしてこんな形をしてるのかな？」',
    },
    memoryRetention: 78,
    flashCard: {
      question: '根毛（こんもう）がたくさんある利点（記述の型）は？',
      answer: '【表面積を広げることで、水や肥料分を効率よく吸収できるため】',
      tip: '小腸の「柔毛（じゅうもう）」や肺の「肺胞」と同じ！「表面積を広げて効率UP」の三兄弟！',
      examPoint: '記述試験の超定番フレーズ！「表面積を大きく」「効率よく」の2語を必ず入れよう。',
    },
  },
  'skill-rika-env-ocean-acidification': {
    skillId: 'skill-rika-env-ocean-acidification',
    field: '地学',
    fieldColor: '#f59e0b',
    fieldBg: '#fffbeb',
    patientAnimal: {
      icon: '🐬',
      name: 'イルカのルカ',
      role: 'サンゴ礁ガード',
      symptom: '「サンゴや貝の赤ちゃんが元気がなくなってるの…海の酸性化を調べて助けて！」',
    },
    memoryRetention: 48,
    flashCard: {
      question: '海洋酸性化が進むと、サンゴや貝類にどんな影響がある？',
      answer: '炭酸カルシウムでできた骨格や貝殻が溶けやすくなり、作りにくくなる！',
      tip: '大気中のCO2が海水に溶けて炭酸になり、海が弱アルカリ性から酸性側に傾く現象だよ。',
      examPoint: '地球温暖化とセットで環境問題大問の最後の考察問題として出題急増中！',
    },
  },
  'skill-rika-physics-galileo-thermometer': {
    skillId: 'skill-rika-physics-galileo-thermometer',
    field: '物理',
    fieldColor: '#3b82f6',
    fieldBg: '#eff6ff',
    patientAnimal: {
      icon: '🐧',
      name: 'ペンギンのピコ',
      role: '南極クリニック患者さん',
      symptom: '「クリニックのガリレオ温度計がプカプカ動いてるよ！液体の温度と体積のナゾを教えて！」',
    },
    memoryRetention: 62,
    flashCard: {
      question: '水などの液体は、温めると体積と密度はどう変化する？',
      answer: '体積は【膨張（大きく）】し、密度は【小さく（軽く）】なる！',
      tip: 'ガリレオ温度計は、液体の密度が変化して球が浮き沈みする仕組みを利用しているよ。',
      examPoint: 'ただし「水は4℃で密度が最大」という例外トラップに注意！',
    },
  },
};
