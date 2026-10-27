import fs from 'node:fs';
import path from 'node:path';
import type {
  Question,
  Skill,
  PracticeQuestion,
  TransferQuestion,
  IntegratedQuestion,
  Stage2Question,
} from '../src/types';

const rootDir = process.cwd();
const authoringDir = path.join(rootDir, 'content-private', 'authoring', 'sansu');

if (!fs.existsSync(authoringDir)) {
  fs.mkdirSync(authoringDir, { recursive: true });
}

// 1. スキル定義 (sansu)
export const sansuSkills: Skill[] = [
  {
    id: 'skill-sansu-calc-order',
    subject: 'sansu',
    title: '計算の順序と四則混合計算',
    description: 'かっこ（中かっこ・小かっこ）と掛け算・割り算を先に行う四則演算の確実な遂行力。',
    level: 'core',
    category: '数と計算',
  },
  {
    id: 'skill-sansu-fraction-calc',
    subject: 'sansu',
    title: '分数の加減乗除と通分・約分',
    description: '異分母分数の通分と約分、帯分数・仮分数の処理と正確な乗除計算。',
    level: 'core',
    category: '数と計算',
  },
  {
    id: 'skill-sansu-geom-area-diff',
    subject: 'sansu',
    title: '等積変形と共通部分を利用した面積計算',
    description: 'おうぎ形と直角三角形の共通部分に着目し、面積の差から未知の長さを求める力。',
    level: 'core',
    category: '平面図形',
  },
  {
    id: 'skill-sansu-consecutive-integers',
    subject: 'sansu',
    title: '連続する整数の和と平均の性質',
    description: '連続する整数の和から中央値（平均）を求め、最小または最大の整数を導く。',
    level: 'primary',
    category: '数の性質・規則性',
  },
  {
    id: 'skill-sansu-tsurukame-elimination',
    subject: 'sansu',
    title: 'つるかめ算と消去算の条件整理',
    description: '固定の追加費用（箱代など）を差し引き、単価の差から個数を求める特殊算。',
    level: 'core',
    category: '特殊算・文章題',
  },
  {
    id: 'skill-sansu-triangle-inequality',
    subject: 'sansu',
    title: '三角形の成立条件と場合の数',
    description: '「最も長い辺 < 他の2辺の和」の条件を満たす組み合わせを漏れなく数え上げる力。',
    level: 'primary',
    category: '平面図形・場合の数',
  },
  {
    id: 'skill-sansu-inverse-operation',
    subject: 'sansu',
    title: '逆算と割合のかけ算・割り算の過誤算',
    description: '「× A/B」と「÷ A/B」の差に着目し、方程式的に元の数を特定する。',
    level: 'core',
    category: '数と計算・割合',
  },
  {
    id: 'skill-sansu-solid-water-tilt',
    subject: 'sansu',
    title: '直方体・立方体の傾けと水の体積',
    description: '傾けたときの水（三角すい）の体積を求め、水平に戻したときの底面積と深さの関係を解く。',
    level: 'core',
    category: '立体図形・水そう',
  },
  {
    id: 'skill-sansu-divisor-condition',
    subject: 'sansu',
    title: '整数の積と等差数列の条件整理',
    description: '等差関係（B-A=C-B）にある整数の積から約数分解を用いて整数を決定する力。',
    level: 'primary',
    category: '数の性質',
  },
  {
    id: 'skill-sansu-newton-pump',
    subject: 'sansu',
    title: 'ニュートン算（湧水と排出ポンプ）',
    description: '一定速度の流入がある池から複数台のポンプで水を抜く仕事量計算。',
    level: 'core',
    category: '特殊算・仕事算',
  },
  {
    id: 'skill-sansu-moving-point-area',
    subject: 'sansu',
    title: '動点と台形の面積変化',
    description: '図形の線上を動く点Pの位置に応じた三角形の底辺・高さの把握と等積条件の逆算。',
    level: 'core',
    category: '平面図形と動点',
  },
  {
    id: 'skill-sansu-irreducible-fraction',
    subject: 'sansu',
    title: '約分・既約分数と素因数分解（互いに素）',
    description: '分母の約数と分子の関係から、単位分数になる個数や互いに素な整数の個数を数える。',
    level: 'core',
    category: '数の性質・分数',
  },
  {
    id: 'skill-sansu-cube-slice',
    subject: 'sansu',
    title: '立方体の切断と立体の体積',
    description: '立方体を複数平面で切断したときの切断面の延長と分割立体の求積（断頭三角柱・すい体）。',
    level: 'core',
    category: '立体図形・切断',
  },
];

// 2. 本番過去問 (全16問)
export const sansuQuestions: Question[] = [
  // 大問1 (1)
  {
    id: 'sansu-2024-01-01',
    subject: 'sansu',
    section: '1',
    questionNumber: '(1)',
    pageNumber: 2,
    prompt: '次の計算をしなさい。\n123 - {45 - (6 + 54 ÷ 3) ÷ 2} + 10',
    answerType: 'numeric',
    correctAnswer: '100',
    primarySkillId: 'skill-sansu-calc-order',
  },
  // 大問1 (2)
  {
    id: 'sansu-2024-01-02',
    subject: 'sansu',
    section: '1',
    questionNumber: '(2)',
    pageNumber: 2,
    prompt: '次の計算をしなさい。\n(1 + 1/2 - 1/4 - 1/5 + 1/7 - 1/10) × 1/3',
    answerType: 'numeric',
    correctAnswer: '51/140',
    primarySkillId: 'skill-sansu-fraction-calc',
  },
  // 大問1 (3)
  {
    id: 'sansu-2024-01-03',
    subject: 'sansu',
    section: '1',
    questionNumber: '(3)',
    pageNumber: 2,
    prompt: '直角三角形ABCと点Cを中心とする半径10cmのおうぎ形を組み合わせた図があります。そのおうぎ形とBCとの交点をDとします。斜線部分①とおうぎ形②の面積が等しいとき、BDの長さを求めなさい。（円周率は3.14）',
    answerType: 'numeric',
    correctAnswer: '5.7',
    figureIds: ['fig-sansu-01-fan'],
    primarySkillId: 'skill-sansu-geom-area-diff',
  },
  // 大問1 (4)
  {
    id: 'sansu-2024-01-04',
    subject: 'sansu',
    section: '1',
    questionNumber: '(4)',
    pageNumber: 3,
    prompt: '連続する4つの整数の和が230のとき、最小の整数を求めなさい。',
    answerType: 'numeric',
    correctAnswer: '56',
    primarySkillId: 'skill-sansu-consecutive-integers',
  },
  // 大問1 (5)
  {
    id: 'sansu-2024-01-05',
    subject: 'sansu',
    section: '1',
    questionNumber: '(5)',
    pageNumber: 3,
    prompt: 'あるケーキ屋さんで、1個350円のショートケーキと1個420円のモンブランを合わせて14個買い、100円の箱に詰めてもらったところ、代金は5560円でした。モンブランはいくつ買ったか求めなさい。',
    answerType: 'numeric',
    correctAnswer: '8',
    primarySkillId: 'skill-sansu-tsurukame-elimination',
  },
  // 大問1 (6)
  {
    id: 'sansu-2024-01-06',
    subject: 'sansu',
    section: '1',
    questionNumber: '(6)',
    pageNumber: 3,
    prompt: '1cm, 2cm, 3cm, 4cm, 5cmの5本の棒があります。これらの中から3本を選んで、それを3辺とする三角形を作るとき、棒の選び方は何通りあるか求めなさい。',
    answerType: 'numeric',
    correctAnswer: '3',
    primarySkillId: 'skill-sansu-triangle-inequality',
  },
  // 大問1 (7)
  {
    id: 'sansu-2024-01-07',
    subject: 'sansu',
    section: '1',
    questionNumber: '(7)',
    pageNumber: 4,
    prompt: 'ある数に 2/3 をかけるところを、誤って割ってしまったため、正しい答えより45大きくなりました。ある数を求めなさい。',
    answerType: 'numeric',
    correctAnswer: '54',
    primarySkillId: 'skill-sansu-inverse-operation',
  },
  // 大問1 (8)
  {
    id: 'sansu-2024-01-08',
    subject: 'sansu',
    section: '1',
    questionNumber: '(8)',
    pageNumber: 4,
    prompt: '1辺が24cmの立方体の容器を図1のように傾けて3点A, B, Cを通る平面まで水を入れます。この状態から図2のように、水平な机の上に立方体の容器を置いたとき、水面の高さは何cmになるか求めなさい。',
    answerType: 'numeric',
    correctAnswer: '4',
    figureIds: ['fig-sansu-01-cube-tilt'],
    primarySkillId: 'skill-sansu-solid-water-tilt',
  },
  // 大問1 (9)
  {
    id: 'sansu-2024-01-09',
    subject: 'sansu',
    section: '1',
    questionNumber: '(9)',
    pageNumber: 5,
    prompt: '3つの整数A, B, Cについて、次のことがわかっています。\n① Aが最も小さく、Cが最も大きい\n② BとAの差はCとBの差に等しい\n③ AとBとCの積は28である\nこのとき、整数Bを求めなさい。',
    answerType: 'numeric',
    correctAnswer: '4',
    primarySkillId: 'skill-sansu-divisor-condition',
  },
  // 大問1 (10)
  {
    id: 'sansu-2024-01-10',
    subject: 'sansu',
    section: '1',
    questionNumber: '(10)',
    pageNumber: 5,
    prompt: '一定の割合で水が入ってきている池があります。この池の水を抜くためにポンプを用意しました。池の水をすべて抜くのに、ポンプ6台ではちょうど65日かかり、ポンプ8台ではちょうど45日かかります。使用するすべてのポンプは同じ割合で水をくみ出すとします。25日以内で池の水をすべて抜くには、最も少ない場合で何台のポンプが必要か求めなさい。',
    answerType: 'numeric',
    correctAnswer: '14',
    primarySkillId: 'skill-sansu-newton-pump',
  },

  // 大問2 (1)
  {
    id: 'sansu-2024-02-01',
    subject: 'sansu',
    section: '2',
    questionNumber: '(1)',
    pageNumber: 6,
    prompt: '図のようなABが7cm, BCが6cm, CDが3cmで、角Bと角Cがともに90度の台形ABCDがあります。点PはAを出発し、A→B→C→Dの順にDまで毎秒1cmで動きます。15秒後の三角形ABPの面積を求めなさい。',
    answerType: 'numeric',
    correctAnswer: '21',
    figureIds: ['fig-sansu-02-trapezoid'],
    primarySkillId: 'skill-sansu-moving-point-area',
  },
  // 大問2 (2)
  {
    id: 'sansu-2024-02-02',
    subject: 'sansu',
    section: '2',
    questionNumber: '(2)',
    pageNumber: 6,
    prompt: '点Pが辺BC上にあるとき、三角形ADPの面積が台形ABCDの面積の半分になるのは、点PがAを出発してから何秒後か求めなさい。',
    answerType: 'numeric',
    correctAnswer: '10',
    figureIds: ['fig-sansu-02-trapezoid'],
    primarySkillId: 'skill-sansu-moving-point-area',
  },

  // 大問3 (1)
  {
    id: 'sansu-2024-03-01',
    subject: 'sansu',
    section: '3',
    questionNumber: '(1)',
    pageNumber: 8,
    prompt: '251/252, 250/252, 249/252, 248/252, ..., 2/252 のように250個の分数が並んでいます。約分したときに分子が1となる分数は何個あるか求めなさい。',
    answerType: 'numeric',
    correctAnswer: '16',
    primarySkillId: 'skill-sansu-irreducible-fraction',
  },
  // 大問3 (2)
  {
    id: 'sansu-2024-03-02',
    subject: 'sansu',
    section: '3',
    questionNumber: '(2)',
    pageNumber: 8,
    prompt: '251/252, 250/252, 249/252, 248/252, ..., 2/252 のうち、これ以上約分できない分数（既約分数）は何個あるか求めなさい。',
    answerType: 'numeric',
    correctAnswer: '71',
    primarySkillId: 'skill-sansu-irreducible-fraction',
  },

  // 大問4 (1)
  {
    id: 'sansu-2024-04-01',
    subject: 'sansu',
    section: '4',
    questionNumber: '(1)',
    pageNumber: 10,
    prompt: '1辺が12cmの立方体があります。辺ABと辺ADの中点をそれぞれP, Qとします。3点P, Q, Fを通る平面で立方体を切ったとき、頂点Aを含む立体の体積を求めなさい。',
    answerType: 'numeric',
    correctAnswer: '504',
    figureIds: ['fig-sansu-04-cube-cut'],
    primarySkillId: 'skill-sansu-cube-slice',
  },
  // 大問4 (2)
  {
    id: 'sansu-2024-04-02',
    subject: 'sansu',
    section: '4',
    questionNumber: '(2)',
    pageNumber: 10,
    prompt: 'さらに、3点P, C, Gを通る平面で切りました。このとき、頂点Dを含む立体の体積を求めなさい。',
    answerType: 'numeric',
    correctAnswer: '840',
    figureIds: ['fig-sansu-04-cube-cut'],
    primarySkillId: 'skill-sansu-cube-slice',
  },
];

// 3. 基礎演習問題 (Practice Questions)
export const sansuPractice: PracticeQuestion[] = [
  {
    id: 'prac-sansu-01',
    skillId: 'skill-sansu-calc-order',
    format: 'numeric_answer',
    prompt: '【四則計算の順序】次の計算をしなさい： 50 - (12 + 18 ÷ 3) × 2',
    correctAnswer: '14',
    hints: [
      { level: 1, text: 'かっこの中の割り算（18 ÷ 3）を最初に計算しましょう。' },
      { level: 2, text: 'かっこの中は 12 + 6 = 18。次に掛け算 18 × 2 = 36 を計算します。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-02',
    skillId: 'skill-sansu-fraction-calc',
    format: 'delayed_choice',
    prompt: '【分数の通分と計算】(1/2 + 1/3 - 1/4) を計算した正しい結果を選びなさい。',
    choices: [
      { id: 'a', label: 'ア', text: '7/12', isCorrect: true },
      { id: 'b', label: 'イ', text: '5/12', isCorrect: false },
      { id: 'c', label: 'ウ', text: '1/2', isCorrect: false },
      { id: 'd', label: 'エ', text: '3/4', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '分母の最小公倍数は 12 です。' },
      { level: 2, text: '6/12 + 4/12 - 3/12 を計算します。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-03',
    skillId: 'skill-sansu-consecutive-integers',
    format: 'numeric_answer',
    prompt: '【連続整数の和】連続する3つの整数の和が72のとき、中央の整数を求めなさい。',
    correctAnswer: '24',
    hints: [
      { level: 1, text: '連続する3整数の和は、中央の整数のちょうど3倍になります。' },
      { level: 2, text: '72 ÷ 3 を計算してみましょう。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-04',
    skillId: 'skill-sansu-tsurukame-elimination',
    format: 'numeric_answer',
    prompt: '【つるかめ算】1本80円の鉛筆と1本120円のボールペンを合わせて10本買い、代金は960円でした。ボールペンは何本買いましたか？',
    correctAnswer: '4',
    hints: [
      { level: 1, text: 'もし10本すべて鉛筆（80円）だったらいくらになるか考えましょう。' },
      { level: 2, text: '800円と960円の差（160円）を、1本あたりの差（120 - 80 = 40円）で割ります。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-05',
    skillId: 'skill-sansu-triangle-inequality',
    format: 'why_choice',
    prompt: '【三角形の成立条件】長さが2cm, 3cm, 5cmの3本の棒で三角形が作れない理由として最も適切なものを選びなさい。',
    choices: [
      { id: 'a', label: 'ア', text: '短い2辺の和（2+3=5）が最も長い辺（5）と等しく、一直線上に重なってしまうから', isCorrect: true },
      { id: 'b', label: 'イ', text: '奇数の長さの棒が2本あるから', isCorrect: false },
      { id: 'c', label: 'ウ', text: 'すべての辺の長さが異なるから', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '三角形ができるには「短い2辺の和 > 最も長い辺」でなければなりません。' },
      { level: 2, text: '和が等しいと、2本の棒が1本の棒の上にぴったり重なってしまい、高さができません。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-06',
    skillId: 'skill-sansu-inverse-operation',
    format: 'numeric_answer',
    prompt: '【過誤算・逆算】ある数から5を引いて3倍するところを、誤って3で割ってから5を足したため答えが11になりました。正しい計算の答えを求めなさい。',
    correctAnswer: '39',
    hints: [
      { level: 1, text: 'まず「誤った計算」から逆算して「ある数」を特定しましょう。(11 - 5) × 3 = 18。' },
      { level: 2, text: 'ある数が18と分かったら、正しい手順（18 - 5）× 3 を計算します。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-07',
    skillId: 'skill-sansu-solid-water-tilt',
    format: 'numeric_answer',
    prompt: '【立体の体積】底面が直角二等辺三角形（直角をはさむ2辺が6cm）で、高さが10cmの三角すいの体積は何cm3ですか？',
    correctAnswer: '60',
    hints: [
      { level: 1, text: 'すい体の体積は「底面積 × 高さ ÷ 3」で求められます。' },
      { level: 2, text: '底面積は 6 × 6 ÷ 2 = 18 cm2。これに 10 をかけて 3 で割ります。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'prac-sansu-08',
    skillId: 'skill-sansu-newton-pump',
    format: 'next_step',
    prompt: '【ニュートン算の手順】湧き水がある池の排水問題で、最初に着目すべき正しい手順を選びなさい。',
    correctAnswer: 'step-rate',
    hints: [
      { level: 1, text: '台数と日数が異なる2つの条件の差に注目します。' },
      { level: 2, text: '1日あたりの湧き水（流入量）を特定することがすべての基本です。' },
    ],
    validationStatus: 'human_verified',
    data: {
      currentStageIndex: 1,
      stages: [
        { label: '全体仕事量比較', description: 'ポンプ台数×日数で全体の排水量を出す' },
        { label: '湧水量の特定', description: '日数差と排水量差から1日あたりの湧水量を計算' },
        { label: '初期水量特定', description: '湧き出る前の池の元の水量を逆算' },
        { label: '指定条件計算', description: '目標日数で排水できる必要台数を割り出す' },
      ],
      choices: [
        { id: 'step-rate', text: '排水量の差と日数の差から「1日あたりの湧水量」を求める', isCorrect: true },
        { id: 'step-blind', text: 'いきなり目標日数で割ってみる', isCorrect: false },
      ],
    },
  },
];

// 4. 応用転用問題 (Transfer Questions)
export const sansuTransfer: TransferQuestion[] = [
  {
    id: 'trans-sansu-01',
    sourceQuestionIds: ['sansu-2024-01-03'],
    requiredSkillIds: ['skill-sansu-geom-area-diff'],
    changedAspects: ['半径を12cmに変更', '直角三角形の縦の長さを変更', '等積条件を維持'],
    expectedReasoning: '直角三角形とおうぎ形の共通部分を差し引くと、直角三角形の面積とおうぎ形の面積が等しくなる。',
    prompt: '直角三角形ABCと、点Cを中心とする半径12cm・中心角90度のおうぎ形があります。三角形ABCとおうぎ形の面積が等しいとき、底辺BCの長さを求めなさい。（円周率は3.14、高さAC=12cm）',
    format: 'numeric_answer',
    correctAnswer: '18.84',
    hints: [
      { level: 1, text: '直角三角形の面積は BC × 12 ÷ 2 = BC × 6。' },
      { level: 2, text: 'おうぎ形の面積は 12 × 12 × 3.14 ÷ 4 = 113.04。BC × 6 = 113.04 から逆算します。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'trans-sansu-02',
    sourceQuestionIds: ['sansu-2024-01-06'],
    requiredSkillIds: ['skill-sansu-triangle-inequality'],
    changedAspects: ['棒の長さを2cm, 4cm, 6cm, 8cm, 10cmに変更'],
    expectedReasoning: '3辺 a < b < c において a + b > c を満たす組み合わせを調べる。',
    prompt: '2cm, 4cm, 6cm, 8cm, 10cmの5本の棒があります。この中から3本を選んで三角形を作るとき、選び方は何通りありますか？',
    format: 'numeric_answer',
    correctAnswer: '3',
    hints: [
      { level: 1, text: '最大の辺 c が 10cm のとき、他の2辺の和が 10 より大きくなる組み合わせを探しましょう。' },
      { level: 2, text: '(4, 8, 10), (6, 8, 10) と、最大の辺が 8cm のときの (4, 6, 8) の計3通りです。' },
    ],
    validationStatus: 'human_verified',
  },
  {
    id: 'trans-sansu-03',
    sourceQuestionIds: ['sansu-2024-03-01'],
    requiredSkillIds: ['skill-sansu-irreducible-fraction'],
    changedAspects: ['分母を120に変更', '単位分数になる条件'],
    expectedReasoning: '分子が分母の約数であれば、約分して分子が1の単位分数になる。',
    prompt: '分母が120で分子が1から119までの分数のうち、約分して分子が1になる分数は何個ありますか？',
    format: 'numeric_answer',
    correctAnswer: '15',
    hints: [
      { level: 1, text: '分子が120の約数であれば約分して 1/n になります。' },
      { level: 2, text: '120の約数の個数は (3+1)×(1+1)×(1+1) = 16個。分子は1から119なので、120自身を除いて15個です。' },
    ],
    validationStatus: 'human_verified',
  },
];

// 5. 統合問題 (Integrated Questions)
export const sansuIntegrated: IntegratedQuestion[] = [
  {
    id: 'integ-sansu-01',
    requiredSkillIds: ['skill-sansu-moving-point-area', 'skill-sansu-tsurukame-elimination'],
    prompt: '【動点と速さの総合問題】点Pが毎秒2cm、点Qが毎秒1cmで正方形の周上を動きます。2点が出会う回数と面積の変化から時刻を割り出す問題では、動点ごとの移動距離の和と差を正確に把握することが決め手になります。',
    format: 'multiple_choice',
    choices: [
      { id: 'a', label: 'ア', text: '出会うときは2点の移動距離の和、追いつくときは移動距離の差に着目する', isCorrect: true },
      { id: 'b', label: 'イ', text: '常に2点の速さの積で距離を割る', isCorrect: false },
      { id: 'c', label: 'ウ', text: '動点の方向に関係なく足し算をする', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '旅人算の原理と同じです。' },
      { level: 2, text: '反対向きは速さの和、同方向は速さの差です。' },
    ],
    validationStatus: 'human_verified',
  },
];

// 6. Stage2 本質理解問題
export const sansuStage2: Stage2Question[] = [
  {
    id: 'stage2-sansu-2024-01-03',
    correspondsToQuestionId: 'sansu-2024-01-03',
    requiredSkillIds: ['skill-sansu-geom-area-diff'],
    prompt: '【面積の本質理解】直角三角形ABCとおうぎ形の共通部分をXとするとき、斜線部分①とおうぎ形②の面積が等しいことから導かれる正しい関係を選びなさい。',
    answerType: 'choice',
    choices: [
      { id: '1', label: 'ア', text: '（直角三角形ABCの面積）＝（おうぎ形全体の面積）', isCorrect: true },
      { id: '2', label: 'イ', text: '（直角三角形ABCの面積）＝ 2 ×（おうぎ形全体の面積）', isCorrect: false },
      { id: '3', label: 'ウ', text: '（斜線部分①の面積）＝（共通部分Xの面積）', isCorrect: false },
    ],
    correctAnswer: '1',
    validationStatus: 'human_verified',
  },
  {
    id: 'stage2-sansu-2024-01-08',
    correspondsToQuestionId: 'sansu-2024-01-08',
    requiredSkillIds: ['skill-sansu-solid-water-tilt'],
    prompt: '【立方体の傾けと体積の本質】立方体の角を下に傾けて3頂点A, B, Cを通る平面まで水を入れたとき、入っている水の立体形状は何ですか？',
    answerType: 'choice',
    choices: [
      { id: '1', label: 'ア', text: '直角をはさむ3辺が24cmの三角すい（体積＝24×24÷2×24÷3）', isCorrect: true },
      { id: '2', label: 'イ', text: '底面が正方形の四角すい', isCorrect: false },
      { id: '3', label: 'ウ', text: '立方体の体積のちょうど半分', isCorrect: false },
    ],
    correctAnswer: '1',
    validationStatus: 'human_verified',
  },
];

function saveAll() {
  fs.writeFileSync(path.join(authoringDir, 'skills.json'), JSON.stringify(sansuSkills, null, 2), 'utf-8');
  fs.writeFileSync(path.join(authoringDir, 'questions.json'), JSON.stringify(sansuQuestions, null, 2), 'utf-8');
  fs.writeFileSync(path.join(authoringDir, 'practice.json'), JSON.stringify(sansuPractice, null, 2), 'utf-8');
  fs.writeFileSync(path.join(authoringDir, 'transfer.json'), JSON.stringify(sansuTransfer, null, 2), 'utf-8');
  fs.writeFileSync(path.join(authoringDir, 'integrated.json'), JSON.stringify(sansuIntegrated, null, 2), 'utf-8');
  fs.writeFileSync(path.join(authoringDir, 'stage2.json'), JSON.stringify(sansuStage2, null, 2), 'utf-8');

  console.log(`Saved sansu authoring files successfully:`);
  console.log(`- Skills: ${sansuSkills.length}`);
  console.log(`- Questions: ${sansuQuestions.length}`);
  console.log(`- Practice: ${sansuPractice.length}`);
  console.log(`- Transfer: ${sansuTransfer.length}`);
  console.log(`- Integrated: ${sansuIntegrated.length}`);
  console.log(`- Stage2: ${sansuStage2.length}`);
}

saveAll();

