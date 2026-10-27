import type { QuestionFormat, Subject } from '../types';

export interface SampleQuestion {
  id: string;
  subject: Subject;
  format: QuestionFormat;
  prompt: string;
  category: string;
  skillTitle: string;
  choices?: { id: string; label: string; text: string; isCorrect: boolean }[];
  correctAnswer: any;
  hints: [{ level: 1; text: string }, { level: 2; text: string }];
  explanation: {
    resultSummary: string;
    keyTakeaway: string;
    reasoning: string;
    detailedMarkdown?: string;
  };
  data?: any; // Next Step stages, ordering items, diagram touch points, matching pairs, etc.
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  // --- 理科 (5問) ---
  // 1. Recall Card (理科)
  {
    id: 'sample-rika-01',
    subject: 'rika',
    format: 'recall_card',
    prompt: '【植物】葉の葉脈において、根から吸い上げた水分が通る管を何といいますか？',
    category: '植物のつくり',
    skillTitle: '維管束の構造',
    correctAnswer: '道管',
    hints: [
      { level: 1, text: '「水」の通り道です。' },
      { level: 2, text: '「道」の文字がつきます。' },
    ],
    explanation: {
      resultSummary: '道管は根から吸収した水や肥料分を全身に送る管です。',
      keyTakeaway: '内側が道管（水）、外側が師管（栄養）。',
      reasoning: '「内道外師（うちどう・そとし）」と覚えましょう。',
    },
  },
  // 2. Delayed Choice (理科)
  {
    id: 'sample-rika-02',
    subject: 'rika',
    format: 'delayed_choice',
    prompt: '【気体】石灰水を白く濁らせる性質をもつ気体は何ですか？',
    category: '気体の性質',
    skillTitle: '二酸化炭素の性質',
    choices: [
      { id: 'a', label: 'ア', text: '酸素', isCorrect: false },
      { id: 'b', label: 'イ', text: '二酸化炭素', isCorrect: true },
      { id: 'c', label: 'ウ', text: '窒素', isCorrect: false },
      { id: 'd', label: 'エ', text: '水素', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '呼吸や有機物の燃焼によって発生する気体です。' },
      { level: 2, text: '炭酸飲料にも溶け込んでいる気体です。' },
    ],
    explanation: {
      resultSummary: '二酸化炭素は水酸化カルシウム水溶液（石灰水）と反応して炭酸カルシウムの白い沈殿を生じます。',
      keyTakeaway: '二酸化炭素＋石灰水＝白濁。',
      reasoning: '固体はドライアイスです。',
    },
  },
  // 3. Why Choice (理科)
  {
    id: 'sample-rika-03',
    subject: 'rika',
    format: 'why_choice',
    prompt: '【浮力】氷が水に浮く理由として最も適切な説明を選びなさい。',
    category: '浮力と密度',
    skillTitle: '氷と水の密度関係',
    choices: [
      { id: 'a', label: 'ア', text: '水は凍ると体積が増加し、密度が水より小さくなるから', isCorrect: true },
      { id: 'b', label: 'イ', text: '氷には目に見えない泡がたくさん詰まっているから', isCorrect: false },
      { id: 'c', label: 'ウ', text: '冷たい水は常に上に集まる性質があるから', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '凍ったときのペットボトルの体積変化を思い出しましょう。' },
      { level: 2, text: '同じ重さで体積が増えると、密度（重さ÷体積）は小さくなります。' },
    ],
    explanation: {
      resultSummary: '水の密度は1.0g/cm3ですが、氷の密度は約0.92g/cm3と小さいため浮きます。',
      keyTakeaway: '水が氷になると体積増加・密度減少。',
      reasoning: '水分子の結晶構造の間にすき間ができるためです。',
    },
  },
  // 4. Diagram Touch (理科)
  {
    id: 'sample-rika-04',
    subject: 'rika',
    format: 'diagram_touch',
    prompt: '【顕微鏡】下の顕微鏡の模式図で、ピントを合わせるために回す「調節ねじ」をタップしてください。',
    category: '実験器具',
    skillTitle: '顕微鏡の各部名称と操作',
    correctAnswer: 'region-focus-knob',
    hints: [
      { level: 1, text: '鏡筒やステージを上下させる大きなねじです。' },
      { level: 2, text: 'アームの側面についている丸いダイヤル部分です。' },
    ],
    explanation: {
      resultSummary: '調節ねじをゆっくり回してピントを合わせます。',
      keyTakeaway: 'ピント合わせは遠ざけながら行う。',
      reasoning: '対物レンズとプレパラートの衝突を防ぐためです。',
    },
    data: {
      regions: [
        { id: 'region-eyepiece', name: '接眼レンズ' },
        { id: 'region-barrel', name: '鏡筒' },
        { id: 'region-objective-lens', name: '対物レンズ・レボルバー' },
        { id: 'region-stage', name: 'ステージ' },
        { id: 'region-arm', name: 'アーム' },
        { id: 'region-focus-knob', name: '調節ねじ' },
        { id: 'region-mirror', name: '反射鏡' },
        { id: 'region-base', name: '鏡台（ベース）' },
      ],
      targetRegionId: 'region-focus-knob',
      imageSvg: `
        <svg viewBox="0 0 400 300" width="100%" height="100%">
          <rect width="400" height="300" fill="#f8fafc" rx="8"/>
          <!-- 接眼レンズ -->
          <g id="region-eyepiece" data-region-id="region-eyepiece" style="cursor: pointer;">
            <rect x="180" y="20" width="40" height="30" fill="#64748b" rx="4"/>
            <rect x="175" y="15" width="50" height="8" fill="#475569" rx="2"/>
            <title>接眼レンズ</title>
          </g>
          <!-- 鏡筒 -->
          <g id="region-barrel" data-region-id="region-barrel" style="cursor: pointer;">
            <rect x="185" y="50" width="30" height="85" fill="#94a3b8"/>
            <title>鏡筒</title>
          </g>
          <!-- レボルバーと対物レンズ -->
          <g id="region-objective-lens" data-region-id="region-objective-lens" style="cursor: pointer;">
            <ellipse cx="200" cy="135" rx="28" ry="10" fill="#475569"/>
            <rect x="190" y="145" width="20" height="40" fill="#334155" rx="2"/>
            <rect x="172" y="143" width="15" height="30" fill="#475569" rx="2" transform="rotate(15 172 143)"/>
            <title>対物レンズ・レボルバー</title>
          </g>
          <!-- アーム -->
          <g id="region-arm" data-region-id="region-arm" style="cursor: pointer;">
            <path d="M200 70 Q275 110 255 240 L215 240" fill="none" stroke="#64748b" stroke-width="24" stroke-linecap="round"/>
            <title>アーム</title>
          </g>
          <!-- ステージ -->
          <g id="region-stage" data-region-id="region-stage" style="cursor: pointer;">
            <rect x="130" y="190" width="140" height="14" fill="#1e293b" rx="3"/>
            <rect x="140" y="185" width="20" height="5" fill="#94a3b8" rx="1"/>
            <title>ステージ</title>
          </g>
          <!-- 反射鏡 / 光源 -->
          <g id="region-mirror" data-region-id="region-mirror" style="cursor: pointer;">
            <ellipse cx="200" cy="225" rx="18" ry="10" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
            <line x1="200" y1="235" x2="200" y2="250" stroke="#475569" stroke-width="6"/>
            <title>反射鏡</title>
          </g>
          <!-- 調節ねじ (ターゲット) -->
          <g id="region-focus-knob" data-region-id="region-focus-knob" style="cursor: pointer;">
            <circle cx="240" cy="180" r="22" fill="#475569" stroke="#334155" stroke-width="3"/>
            <circle cx="240" cy="180" r="14" fill="#64748b"/>
            <circle cx="240" cy="180" r="6" fill="#94a3b8"/>
            <line x1="240" y1="159" x2="240" y2="164" stroke="#94a3b8" stroke-width="2"/>
            <line x1="240" y1="196" x2="240" y2="201" stroke="#94a3b8" stroke-width="2"/>
            <line x1="219" y1="180" x2="224" y2="180" stroke="#94a3b8" stroke-width="2"/>
            <line x1="256" y1="180" x2="261" y2="180" stroke="#94a3b8" stroke-width="2"/>
            <title>調節ねじ</title>
          </g>
          <!-- ベース（台） -->
          <g id="region-base" data-region-id="region-base" style="cursor: pointer;">
            <rect x="100" y="250" width="200" height="30" fill="#0f172a" rx="6"/>
            <title>鏡台（ベース）</title>
          </g>
        </svg>
      `,
    },
  },
  // 5. Numeric Answer (理科)
  {
    id: 'sample-rika-05',
    subject: 'rika',
    format: 'numeric_answer',
    prompt: '【浮力計算】体積400cm3の物体をすべて水（密度1g/cm3）に沈めたとき、水から受ける浮力は何gですか？',
    category: '浮力と密度',
    skillTitle: 'アルキメデスの原理',
    correctAnswer: '400',
    hints: [
      { level: 1, text: '物体が押しのけた水の重さに等しい浮力を受けます。' },
      { level: 2, text: '水400cm3の重さは何gでしょうか。' },
    ],
    explanation: {
      resultSummary: '浮力は 400g です。',
      keyTakeaway: '浮力(g) ＝ 沈んだ体積(cm3) × 液体の密度(g/cm3)。',
      reasoning: '水の密度が1g/cm3なので、体積の数値がそのまま浮力の数値になります。',
    },
  },

  // --- 社会 (5問) ---
  // 6. Multiple Choice (社会)
  {
    id: 'sample-shakai-01',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【歴史】1582年、本能寺の変で織田信長を倒した武将はだれですか？',
    category: '日本の歴史（安土桃山）',
    skillTitle: '織田信長と天下統一の流れ',
    choices: [
      { id: 'a', label: 'ア', text: '豊臣秀吉', isCorrect: false },
      { id: 'b', label: 'イ', text: '明智光秀', isCorrect: true },
      { id: 'c', label: 'ウ', text: '徳川家康', isCorrect: false },
      { id: 'd', label: 'エ', text: '柴田勝家', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '信長の家臣で、丹波の亀山城から出陣しました。' },
      { level: 2, text: '「敵は本能寺にあり」という言葉で有名です。' },
    ],
    explanation: {
      resultSummary: '明智光秀が本能寺の変を起こし、その後山崎の戦いで豊臣秀吉に敗れました。',
      keyTakeaway: '1582年：本能寺の変（明智光秀）。',
      reasoning: '直後に秀吉が中国大返しを行い光秀を討ちました。',
    },
  },
  // 7. Ordering (社会)
  {
    id: 'sample-shakai-02',
    subject: 'shakai',
    format: 'ordering',
    prompt: '【歴史・並べ替え】次の出来事を古い年代順に正しく並べ替えなさい。',
    category: '日本の歴史',
    skillTitle: '武家政権の推移',
    correctAnswer: ['c', 'a', 'd', 'b'],
    hints: [
      { level: 1, text: '飛鳥・奈良 → 平安 → 鎌倉 → 室町 → 江戸の順序です。' },
      { level: 2, text: '中大兄皇子らの政治改革（飛鳥）から、江戸幕府が政権を返上する（幕末）までの順序を考えましょう。' },
    ],
    explanation: {
      resultSummary: '大化の改新(645年) → 平安京遷都(794年) → 鎌倉幕府成立(1192/1185年) → 大政奉還(1867年) の順です。',
      keyTakeaway: '古代から近代への流れを世紀・年代で把握する。',
      reasoning: '各政権の誕生順序を確認しましょう。',
    },
    data: {
      items: [
        { id: 'a', text: '平安京への遷都' },
        { id: 'b', text: '大政奉還' },
        { id: 'c', text: '大化の改新' },
        { id: 'd', text: '鎌倉幕府の成立' },
      ],
    },
  },
  // 8. Matching (社会)
  {
    id: 'sample-shakai-03',
    subject: 'shakai',
    format: 'matching',
    prompt: '【地理・組み合わせ】都道府県とそれぞれの県庁所在地を正しくペアに結びつけなさい。',
    category: '日本の地理',
    skillTitle: '都道府県と県庁所在地',
    correctAnswer: { 'a': '1', 'b': '2', 'c': '3' },
    hints: [
      { level: 1, text: '県名と市名が異なる県庁所在地に注意しましょう。' },
      { level: 2, text: '南部藩の城下町（岩手）、加賀百万石（石川）、道後温泉（愛媛）とゆかりの深い都市を思い浮かべましょう。' },
    ],
    explanation: {
      resultSummary: '岩手県＝盛岡市、愛媛県＝松山市、石川県＝金沢市です。',
      keyTakeaway: '県名と異なる県庁所在地は中学受験の頻出ポイント。',
      reasoning: '地図帳で位置も一緒に確認しておきましょう。',
    },
    data: {
      leftItems: [
        { id: 'a', text: '岩手県' },
        { id: 'b', text: '愛媛県' },
        { id: 'c', text: '石川県' },
      ],
      rightItems: [
        { id: '1', text: '盛岡市' },
        { id: '2', text: '松山市' },
        { id: '3', text: '金沢市' },
      ],
    },
  },
  // 9. Delayed Choice (社会)
  {
    id: 'sample-shakai-04',
    subject: 'shakai',
    format: 'delayed_choice',
    prompt: '【公民】日本国憲法の三大原則にあてはまらないものはどれですか？',
    category: '現代社会・公民',
    skillTitle: '日本国憲法の基本原則',
    choices: [
      { id: 'a', label: 'ア', text: '国民主権', isCorrect: false },
      { id: 'b', label: 'イ', text: '基本的人権の尊重', isCorrect: false },
      { id: 'c', label: 'ウ', text: '平和主義', isCorrect: false },
      { id: 'd', label: 'エ', text: '自由放任主義', isCorrect: true },
    ],
    correctAnswer: 'd',
    hints: [
      { level: 1, text: '「主権」「人権」「平和」の3つが原則です。' },
      { level: 2, text: '国の最高法規としての3本柱ではなく、経済活動の自由を指す用語が1つ混ざっています。' },
    ],
    explanation: {
      resultSummary: '三大原則は「国民主権」「基本的人権の尊重」「平和主義」です。',
      keyTakeaway: '憲法の根幹をなす3つの柱を正確に覚える。',
      reasoning: '前文および第1条・第9条・第11条などに規定されています。',
    },
  },
  // 10. Recall Card (社会)
  {
    id: 'sample-shakai-05',
    subject: 'shakai',
    format: 'recall_card',
    prompt: '【地理】日本で最も長い川は何川ですか？',
    category: '日本の地理',
    skillTitle: '日本の河川と地形',
    correctAnswer: '信濃川',
    hints: [
      { level: 1, text: '長野県から新潟県へと流れて日本海に注ぐ川です。' },
      { level: 2, text: '長野県内では「千曲川（ちくまがわ）」と呼ばれます。' },
    ],
    explanation: {
      resultSummary: '信濃川の長さは 367km で日本最長です。',
      keyTakeaway: '日本最長＝信濃川（367km）、流域面積最大＝利根川。',
      reasoning: '長さと流域面積の違いに気をつけましょう。',
    },
  },

  // --- 算数 (5問) ---
  // 11. Next Step (算数)
  {
    id: 'sample-sansu-01',
    subject: 'sansu',
    format: 'next_step',
    prompt: '【旅人算】周囲の長さが1200mの池のまわりを、分速70mのA君と分速50mのB君が同じ場所から反対向きに同時に歩き出しました。2人が初めて出会うのは何分後ですか？',
    category: '速さと比',
    skillTitle: '出会いの旅人算',
    correctAnswer: 'step-equation',
    hints: [
      { level: 1, text: '反対向きに進むとき、1分間に2人の距離は「速さの和」だけ縮まります。' },
      { level: 2, text: '距離 ÷ (Aの速さ ＋ Bの速さ) で時間を求めます。' },
    ],
    explanation: {
      resultSummary: '1200 ÷ (70 + 50) = 10分後に出会います。',
      keyTakeaway: '反対向きに出会う旅人算 ＝ 距離 ÷ 速さの和。',
      reasoning: '同方向の追いつきは「速さの差」です。',
    },
    data: {
      currentStageIndex: 2,
      stages: [
        { label: 'タイプ認識', description: '池のまわりを反対向きに進む出会い算' },
        { label: '着眼点', description: '1分間で2人が進む合計の距離＝速さの和' },
        { label: '解法選択', description: '距離 ÷ 速さの和 を使う' },
        { label: '式と計算', description: '1200 ÷ (70 + 50) = 10' },
        { label: '検算', description: '70×10 + 50×10 = 1200m で一致' },
      ],
      choices: [
        { id: 'step-diff', text: '1200 ÷ (70 - 50) を計算する（誤り：追いつきの式）', isCorrect: false },
        { id: 'step-equation', text: '1分間に2人が近づく距離 70 + 50 = 120m を求め、1200 ÷ 120 を計算する', isCorrect: true },
        { id: 'step-mult', text: '70 × 50 を計算する', isCorrect: false },
      ],
    },
  },
  // 12. Numeric Answer (算数)
  {
    id: 'sample-sansu-02',
    subject: 'sansu',
    format: 'numeric_answer',
    prompt: '【つるかめ算】ツルとカメが合わせて10匹いて、足の合計が28本あります。カメは何匹いますか？',
    category: '特殊算',
    skillTitle: 'つるかめ算の基本解法',
    correctAnswer: '4',
    hints: [
      { level: 1, text: 'もし10匹すべてがツル（足2本）だったらいくつになるか考えましょう。' },
      { level: 2, text: '実際の足とすべてツルとしたときの足の差を出し、カメとツルの足の差（4 - 2本）で割りましょう。' },
    ],
    explanation: {
      resultSummary: 'カメは 4匹、ツルは 6羽 です。',
      keyTakeaway: 'すべてツルと仮定：(実際の足 - 2×総数) ÷ (4 - 2) ＝ カメの数。',
      reasoning: '8 ÷ 2 = 4匹。',
    },
  },
  // 13. Self Check (算数)
  {
    id: 'sample-sansu-03',
    subject: 'sansu',
    format: 'self_check',
    prompt: '【図形の面積】底辺が12cm、高さが8cmの平行四辺形の面積をノートに計算してください。計算し終えたら自己判定を選びましょう。',
    category: '平面図形',
    skillTitle: '四角形と三角形の求積',
    correctAnswer: 'correct',
    hints: [
      { level: 1, text: '平行四辺形の面積の公式は「底辺 × 高さ」です。' },
      { level: 2, text: '三角形と違って「÷ 2」はしません。' },
    ],
    explanation: {
      resultSummary: '正解は 96 cm2 です（12 × 8 = 96）。',
      keyTakeaway: '平行四辺形の面積 ＝ 底辺 × 高さ。',
      reasoning: '半分にすると三角形になるため、三角形は「÷ 2」をします。',
    },
  },
  // 14. Multiple Choice (算数)
  {
    id: 'sample-sansu-04',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【割合と比】定価2000円の品物を、定価の2割引きで買いました。代金は何円ですか？',
    category: '割合と売買損益',
    skillTitle: '割引計算',
    choices: [
      { id: 'a', label: 'ア', text: '1400円', isCorrect: false },
      { id: 'b', label: 'イ', text: '1600円', isCorrect: true },
      { id: 'c', label: 'ウ', text: '1800円', isCorrect: false },
      { id: 'd', label: 'エ', text: '400円', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '「2割引き」とは、定価を1（または10割）としたとき、定価の何割（何倍）になるかを考えましょう。' },
      { level: 2, text: '定価 × (1 - 0.2) または「定価 － 値引き分」の式を立てて計算しましょう。' },
    ],
    explanation: {
      resultSummary: '代金は 1600円 です。',
      keyTakeaway: '2割引き ＝ 定価 × 0.8。',
      reasoning: '値引き額は 2000 × 0.2 = 400円、代金は 2000 - 400 = 1600円です。',
    },
  },
  // 15. Delayed Choice (算数)
  {
    id: 'sample-sansu-05',
    subject: 'sansu',
    format: 'delayed_choice',
    prompt: '【平均】算数のテストで、1回目が75点、2回目が85点、3回目が92点でした。3回の平均点は何点ですか？',
    category: '平均算',
    skillTitle: '平均の計算',
    choices: [
      { id: 'a', label: 'ア', text: '83点', isCorrect: false },
      { id: 'b', label: 'イ', text: '84点', isCorrect: true },
      { id: 'c', label: 'ウ', text: '85点', isCorrect: false },
      { id: 'd', label: 'エ', text: '86点', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '平均 ＝ 合計点 ÷ 回数 です。まずは3回分の点数をすべて足しましょう。' },
      { level: 2, text: '(75 ＋ 85 ＋ 92) ÷ 3 の式を立てて、3回分の合計を計算してから3で割りましょう。' },
    ],
    explanation: {
      resultSummary: '平均点は 84点 です。',
      keyTakeaway: '平均 ＝ 合計 ÷ 個数。',
      reasoning: '252 ÷ 3 = 84 です。',
    },
  },
];

