import type { SampleQuestion } from './sample-data';

// 2023年度過去問から抽出した9テーマ×各2問＝全18問の特訓・演習問題
export const CURRICULUM_2023_QUESTIONS: SampleQuestion[] = [
  // ==================== 理科 (6問) ====================
  // 1. ミツバチの日齢分業と完全変態
  {
    id: 'curriculum-2023-rika-bee-1',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【昆虫の生態】ミツバチの成長様式（変態）と日齢分業について、正しい説明を選びなさい。',
    category: '昆虫の生態',
    skillTitle: 'ミツバチの日齢分業と完全変態',
    skillId: 'skill-rika-2023-bee-division',
    choices: [
      { id: 'a', label: 'ア', text: 'さなぎの時期を経ない不完全変態で、若い蜂が外で蜜を集める。', isCorrect: false },
      { id: 'b', label: 'イ', text: '卵・幼虫・さなぎ・成虫と育つ完全変態で、若い蜂は安全な巣の中で掃除・育児を行い、年老いた蜂が危険な巣の外で蜜を集める。', isCorrect: true },
      { id: 'c', label: 'ウ', text: '卵から直接成虫になり、生まれた時から死ぬまで同じ仕事だけを担当する。', isCorrect: false },
      { id: 'd', label: 'エ', text: '完全変態を行うが、危険な巣の外の仕事はすべて生まれたばかりの若い蜂が担当する。', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: 'ミツバチは卵からかえると「幼虫」になり、その後「さなぎ」の時期をへて羽化します。' },
      { level: 2, text: '若い働き蜂が早く死ぬと巣の労働力が減るため、危険な外回り仕事は年上の蜂が担当します。' },
    ],
    explanation: {
      resultSummary: 'ミツバチは完全変態を行う昆虫で、羽化後は巣の内側から外側へと担当する仕事が移り変わります。',
      keyTakeaway: '完全変態（卵→幼虫→さなぎ→成虫）＋ 若い蜂＝巣内（掃除・育児）、年上の蜂＝巣外（蜜集め）。',
      reasoning: '外敵や天候の危険がある外の仕事を後回しにすることで、巣全体の生存率を高めています。',
    },
  },
  {
    id: 'curriculum-2023-rika-bee-2',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【昆虫の育ち方】昆虫の変態について、ミツバチと同じように「卵→幼虫→さなぎ→成虫」の段階（完全変態）をへて育つ昆虫の組み合わせとして正しいものを選びなさい。',
    category: '昆虫の生態',
    skillTitle: 'ミツバチの日齢分業と完全変態',
    skillId: 'skill-rika-2023-bee-division',
    choices: [
      { id: 'a', label: 'ア', text: 'アリ・カブトムシ・チョウ', isCorrect: true },
      { id: 'b', label: 'イ', text: 'バッタ・トンボ・セミ', isCorrect: false },
      { id: 'c', label: 'ウ', text: 'カマキリ・コオロギ・ハエ', isCorrect: false },
      { id: 'd', label: 'エ', text: 'シロアリ・ゴキブリ・ハチ', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '「さなぎ」の時期がある昆虫を選びましょう。' },
      { level: 2, text: 'バッタやトンボ、セミ、カマキリは幼虫から直接成虫になる「不完全変態」です。' },
    ],
    explanation: {
      resultSummary: 'アリ、カブトムシ、チョウ、ハチ、ハエ、カ、カイコなどはすべて完全変態の昆虫です。',
      keyTakeaway: '完全変態＝チョウ・カブトムシ・ハチ・アリ ／ 不完全変態＝バッタ・トンボ・セミ・カマキリ。',
      reasoning: '幼虫と成虫で形や食べるものが大きく異なる昆虫の多くが完全変態を行います。',
    },
  },

  // 2. 銅の加熱実験と定比例の法則
  {
    id: 'curriculum-2023-rika-copper-1',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【化学変化】ステンレス皿に銅の粉末4.0gを広げて十分に加熱したところ、黒色の酸化銅が5.0g得られました。このとき銅と化合した酸素の質量と、銅と酸素が化合する質量の比（銅:酸素）として正しいものはどれですか。',
    category: '化学変化と金属',
    skillTitle: '銅の加熱実験と定比例の法則',
    skillId: 'skill-rika-2023-copper-oxidation',
    choices: [
      { id: 'a', label: 'ア', text: '酸素 1.0g ／ 銅:酸素 ＝ 4:1', isCorrect: true },
      { id: 'b', label: 'イ', text: '酸素 1.0g ／ 銅:酸素 ＝ 5:1', isCorrect: false },
      { id: 'c', label: 'ウ', text: '酸素 0.8g ／ 銅:酸素 ＝ 3:2', isCorrect: false },
      { id: 'd', label: 'エ', text: '酸素 2.0g ／ 銅:酸素 ＝ 2:1', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '増えた重さが結びついた酸素の重さです。5.0g － 4.0g ＝ ？' },
      { level: 2, text: '銅4.0gに対して酸素1.0gが結びついているので、4.0 : 1.0 を最も簡単な整数比にします。' },
    ],
    explanation: {
      resultSummary: '銅が酸素と化合すると酸化銅になります。銅:酸素:酸化銅 ＝ 4 : 1 : 5 の一定比率で反応します。',
      keyTakeaway: '銅の加熱：銅 : 酸素 : 酸化銅 ＝ 4 : 1 : 5（定比例の法則）。',
      reasoning: 'マグネシウムの加熱（Mg:酸素:酸化マグネシウム＝3:2:5）と区別して覚えましょう。',
    },
  },
  {
    id: 'curriculum-2023-rika-copper-2',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【金属の加熱】銅の粉末6.0gを十分に加熱したとき、できる酸化銅の質量は何gですか。（銅:酸素＝4:1）',
    category: '化学変化と金属',
    skillTitle: '銅の加熱実験と定比例の法則',
    skillId: 'skill-rika-2023-copper-oxidation',
    choices: [
      { id: 'a', label: 'ア', text: '6.5g', isCorrect: false },
      { id: 'b', label: 'イ', text: '7.5g', isCorrect: true },
      { id: 'c', label: 'ウ', text: '8.0g', isCorrect: false },
      { id: 'd', label: 'エ', text: '9.0g', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '銅:酸化銅 ＝ 4:5 の比率を利用します。' },
      { level: 2, text: '銅6.0g × (5/4) ＝ 7.5g と計算できます。結びつく酸素は 6.0 × (1/4) ＝ 1.5g です。' },
    ],
    explanation: {
      resultSummary: '銅4gから酸化銅5gができるので、銅6.0gからは 6.0 × 5 ÷ 4 ＝ 7.5g の酸化銅が生成します。',
      keyTakeaway: '酸化銅の質量 ＝ 銅の質量 × 5/4。',
      reasoning: '加熱が不十分な場合、未反応の銅が残って全体の重さが計算値より小さくなります。',
    },
  },

  // 3. 電磁誘導とうず電流
  {
    id: 'curriculum-2023-rika-induction-1',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【電流と磁界】検流計につないだコイルの近くで棒磁石のN極をすばやく近づけたところ、検流計の針が右に振れました。針をより大きく振らせる（より大きな誘導電流を流す）方法として誤っているものはどれですか。',
    category: '電流と磁界',
    skillTitle: '電磁誘導とうず電流（IH調理器の仕組み）',
    skillId: 'skill-rika-2023-electromagnetic-induction',
    choices: [
      { id: 'a', label: 'ア', text: 'コイルの巻き数を増やす。', isCorrect: false },
      { id: 'b', label: 'イ', text: 'より強い磁石を使う。', isCorrect: false },
      { id: 'c', label: 'ウ', text: '棒磁石をより速く動かす。', isCorrect: false },
      { id: 'd', label: 'エ', text: '棒磁石をコイルの内部で静止させておく。', isCorrect: true },
    ],
    correctAnswer: 'd',
    hints: [
      { level: 1, text: '誘導電流は、コイルの中の磁界が「変化」するときだけに流れます。' },
      { level: 2, text: '磁石が静止していると磁界の変化がないため、電流はまったく流れません（0A）。' },
    ],
    explanation: {
      resultSummary: '電磁誘導による電流を大きくするには、「磁石を速く動かす」「強い磁石を使う」「コイルの巻き数を増やす」必要があります。',
      keyTakeaway: '磁石を止めているときは電流は流れない（磁界の変化がないため）。',
      reasoning: '磁石の動かす向きや極を逆にすると、流れる誘導電流の向きも逆になります。',
    },
  },
  {
    id: 'curriculum-2023-rika-induction-2',
    subject: 'rika',
    format: 'multiple_choice',
    prompt: '【電磁誘導】IH調理器（電磁誘導加熱調理器）が鍋を温める仕組みとして正しいものを選びなさい。',
    category: '電流と磁界',
    skillTitle: '電磁誘導とうず電流（IH調理器の仕組み）',
    skillId: 'skill-rika-2023-electromagnetic-induction',
    choices: [
      { id: 'a', label: 'ア', text: '内部のヒーターの炎がトッププレートを直接熱している。', isCorrect: false },
      { id: 'b', label: 'イ', text: 'コイルに交流電流を流して磁界を急激に変化させ、金属鍋の底にうず電流を発生させて発熱させる。', isCorrect: true },
      { id: 'c', label: 'ウ', text: '鍋の底からマイクロ波（電波）を出して食品中の水分子を直接振動させる。', isCorrect: false },
      { id: 'd', label: 'エ', text: 'コイルの磁力で鍋を高速回転させ、摩擦熱で温める。', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: 'IH調理器のプレート自体は熱くならず、金属鍋の底そのものが発熱します。' },
      { level: 2, text: '交流による磁界変化で金属内に発生する「うず電流」と電気抵抗を利用しています。' },
    ],
    explanation: {
      resultSummary: 'IHは電磁誘導の原理を利用して鍋底にうず電流を起こし、金属の抵抗熱（ジュール熱）で加熱します。',
      keyTakeaway: 'IH調理器＝コイルの磁界変化 → 鍋底にうず電流発生 → 金属自体の抵抗で発熱。',
      reasoning: '鉄やステンレスなど電気を通し磁石にくっつく金属鍋が適しています。',
    },
  },

  // ==================== 算数 (6問) ====================
  // 4. 食塩水の加水と濃度逆算
  {
    id: 'curriculum-2023-sansu-salt-1',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【割合と比】濃度8%の食塩水200gがあります。これに水120gを加えると、何%の食塩水になりますか。',
    category: '割合と比',
    skillTitle: '食塩水の加水と濃度逆算（取り違え算）',
    skillId: 'skill-sansu-2023-saltwater-mix',
    choices: [
      { id: 'a', label: 'ア', text: '4%', isCorrect: false },
      { id: 'b', label: 'イ', text: '5%', isCorrect: true },
      { id: 'c', label: 'ウ', text: '6%', isCorrect: false },
      { id: 'd', label: 'エ', text: '7%', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: 'まず最初の食塩水に含まれる食塩の重さを計算しましょう。200 × 0.08 ＝ ？g' },
      { level: 2, text: '水120gを加えると食塩水全体の重さは 200 + 120 ＝ 320g になります。食塩の重さは変わりません。' },
    ],
    explanation: {
      resultSummary: '食塩の量は 200 × 0.08 ＝ 16g。加水後の全体の重さは 320g なので、16 ÷ 320 × 100 ＝ 5% になります。',
      keyTakeaway: '水を加えても「食塩の重さ」は変わらない！',
      reasoning: '食塩の重さ ＝ 食塩水の重さ × 濃度 ÷ 100 を自在に変形できるようにしましょう。',
    },
  },
  {
    id: 'curriculum-2023-sansu-salt-2',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【食塩水の濃度】10%の食塩水300gと、5%の食塩水200gを混ぜ合わせると、何%の食塩水になりますか。',
    category: '割合と比',
    skillTitle: '食塩水の加水と濃度逆算（取り違え算）',
    skillId: 'skill-sansu-2023-saltwater-mix',
    choices: [
      { id: 'a', label: 'ア', text: '7%', isCorrect: false },
      { id: 'b', label: 'イ', text: '8%', isCorrect: true },
      { id: 'c', label: 'ウ', text: '8.5%', isCorrect: false },
      { id: 'd', label: 'エ', text: '7.5%', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: 'それぞれの食塩水に含まれる食塩の重さを合計してみましょう。' },
      { level: 2, text: '食塩の合計は 300×0.10 + 200×0.05 ＝ 30 + 10 ＝ 40g。食塩水全体は 300 + 200 ＝ 500g です。' },
    ],
    explanation: {
      resultSummary: '全体の食塩水500gの中に食塩が40g溶けているので、40 ÷ 500 × 100 ＝ 8% になります。',
      keyTakeaway: '混ぜた後の濃度 ＝ 食塩の合計 ÷ 食塩水の合計 × 100。',
      reasoning: '天秤法を使えば (10-x) : (x-5) = 200 : 300 = 2 : 3 から x = 8% と瞬時に出せます。',
    },
  },

  // 5. 約数の個数の漸化操作と平方数
  {
    id: 'curriculum-2023-sansu-divisor-1',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【数の性質】1から100までの整数のうち、約数の個数が「ちょうど3個」である整数は全部で何個ありますか。',
    category: '数の性質',
    skillTitle: '約数の個数の漸化操作と平方数',
    skillId: 'skill-sansu-2023-divisor-iteration',
    choices: [
      { id: 'a', label: 'ア', text: '3個', isCorrect: false },
      { id: 'b', label: 'イ', text: '4個', isCorrect: true },
      { id: 'c', label: 'ウ', text: '5個', isCorrect: false },
      { id: 'd', label: 'エ', text: '9個', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '約数が3個の数は、ある決まった数の2乗（平方数）になります。' },
      { level: 2, text: '「素数の2乗」だけが約数を3個もちます（1、その素数、その数自身）。100以下の素数の2乗を探しましょう。' },
    ],
    explanation: {
      resultSummary: '約数が3個になる整数は「素数の2乗」です。2²=4, 3²=9, 5²=25, 7²=49 の4個です。',
      keyTakeaway: '約数が3個 ＝ 素数の2乗（4, 9, 25, 49…）！',
      reasoning: '素数でない平方数（例: 4²=16, 6²=36）は約数が5個以上になるので除外されます。',
    },
  },
  {
    id: 'curriculum-2023-sansu-divisor-2',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【数の性質】ある整数 N の約数の個数を調べたところ、ちょうど「5個」でした。この整数 N について確実にいえることはどれですか。',
    category: '数の性質',
    skillTitle: '約数の個数の漸化操作と平方数',
    skillId: 'skill-sansu-2023-divisor-iteration',
    choices: [
      { id: 'a', label: 'ア', text: 'N は素数である。', isCorrect: false },
      { id: 'b', label: 'イ', text: 'N は偶数である。', isCorrect: false },
      { id: 'c', label: 'ウ', text: 'N は素数の4乗（p⁴）である。', isCorrect: true },
      { id: 'd', label: 'エ', text: 'N は必ず100より小さい。', isCorrect: false },
    ],
    correctAnswer: 'c',
    hints: [
      { level: 1, text: '約数の個数は、素因数分解したときの指数に1を足してかけ算したものです。' },
      { level: 2, text: '約数が5個になるのは、指数+1が5、つまりある素数の4乗（2⁴=16, 3⁴=81など）の形だけです。' },
    ],
    explanation: {
      resultSummary: '5は約数を分解できない素数のため、素数の4乗の形をした数（16や81など）だけが約数を5個もちます。',
      keyTakeaway: '約数の個数が奇数個 ＝ 平方数！ 特に (k+1) 個の約数をもつのは素数のk乗。',
      reasoning: '例えば 16 の約数は 1, 2, 4, 8, 16 の5個です。',
    },
  },

  // 6. 立方体の切断と正四面体の体積
  {
    id: 'curriculum-2023-sansu-cube-cut-1',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【立体図形】体積が60cm³の立方体があります。この立方体の8つの頂点から1つおきに4つの頂点を選び、それらを結んで正四面体を作りました。この正四面体の体積は何cm³ですか。',
    category: '立体図形',
    skillTitle: '立方体の切断と正四面体の体積',
    skillId: 'skill-sansu-2023-tetrahedron-cut',
    choices: [
      { id: 'a', label: 'ア', text: '15cm³', isCorrect: false },
      { id: 'b', label: 'イ', text: '20cm³', isCorrect: true },
      { id: 'c', label: 'ウ', text: '30cm³', isCorrect: false },
      { id: 'd', label: 'エ', text: '40cm³', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '立方体から4隅の合同な三角すいを取り除くことで正四面体ができます。' },
      { level: 2, text: '取り除く三角すい1つの体積は立方体の 1/6。4隅で 4/6 ＝ 2/3 を取り除くので、残る正四面体は 1/3 です。' },
    ],
    explanation: {
      resultSummary: '正四面体の体積は立方体の体積のちょうど 1/3 になります。60 ÷ 3 ＝ 20cm³ です。',
      keyTakeaway: '立方体の中にできる正四面体の体積 ＝ 立方体の体積 × 1/3！',
      reasoning: '取り除く三角すい＝底面が正方形の半分(1/2)×高さ(1)÷3 ＝ 1/6。4つで 2/3 を引くため残りは 1/3。',
    },
  },
  {
    id: 'curriculum-2023-sansu-cube-cut-2',
    subject: 'sansu',
    format: 'multiple_choice',
    prompt: '【立体図形】1辺が6cmの立方体の4隅の三角すいを取り除いてできる正四面体の体積は何cm³ですか。',
    category: '立体図形',
    skillTitle: '立方体の切断と正四面体の体積',
    skillId: 'skill-sansu-2023-tetrahedron-cut',
    choices: [
      { id: 'a', label: 'ア', text: '36cm³', isCorrect: false },
      { id: 'b', label: 'イ', text: '72cm³', isCorrect: true },
      { id: 'c', label: 'ウ', text: '108cm³', isCorrect: false },
      { id: 'd', label: 'エ', text: '144cm³', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: 'まず1辺6cmの立方体の体積を求めましょう。6 × 6 × 6 ＝ 216cm³ です。' },
      { level: 2, text: '正四面体の体積は立方体の 1/3 になります。216 ÷ 3 ＝ ？cm³ です。' },
    ],
    explanation: {
      resultSummary: '立方体の体積は 6×6×6 ＝ 216cm³。正四面体の体積はその 1/3 なので 216 ÷ 3 ＝ 72cm³ です。',
      keyTakeaway: '正四面体の体積 ＝ 立方体の体積 ÷ 3。',
      reasoning: '取り除く三角すい1つは 6×6÷2 × 6 ÷ 3 ＝ 36cm³。4つで 36×4 ＝ 144cm³。216 - 144 ＝ 72cm³。',
    },
  },

  // ==================== 社会 (6問) ====================
  // 7. 島根県・石見銀山と日本の領土
  {
    id: 'curriculum-2023-shakai-shimane-1',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【日本の諸地域】2007年に世界文化遺産に登録され、戦国時代から江戸時代にかけて大量の銀が採掘された島根県の鉱山遺跡と、現在韓国が不法占拠を続けている島根県所属の日本固有の領土の組み合わせとして正しいものはどれですか。',
    category: '日本の諸地域',
    skillTitle: '島根県・石見銀山と日本の領土（竹島）',
    skillId: 'skill-shakai-2023-shimane-territory',
    choices: [
      { id: 'a', label: 'ア', text: '石見銀山 ／ 竹島', isCorrect: true },
      { id: 'b', label: 'イ', text: '佐渡金山 ／ 竹島', isCorrect: false },
      { id: 'c', label: 'ウ', text: '生野銀山 ／ 北方領土', isCorrect: false },
      { id: 'd', label: 'エ', text: '石見銀山 ／ 尖閣諸島', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '島根県の世界遺産は「いわみぎんざん」です（佐渡金山は新潟県）。' },
      { level: 2, text: '竹島は島根県、北方領土は北海道、尖閣諸島は沖縄県に属しています。' },
    ],
    explanation: {
      resultSummary: '島根県には世界遺産の石見銀山があり、竹島は島根県隠岐の島町に属する日本固有の領土です。',
      keyTakeaway: '石見銀山＝島根県世界遺産 ／ 竹島＝島根県所属の日本固有領土。',
      reasoning: '領土問題の島々と所属都道府県（北方領土＝北海道、竹島＝島根県、尖閣＝沖縄県）は中学入試の鉄板です。',
    },
  },
  {
    id: 'curriculum-2023-shakai-shimane-2',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【日本の領土】日本の端の島々の位置と所属する都道府県の組み合わせとして正しいものを選びなさい。',
    category: '日本の諸地域',
    skillTitle: '島根県・石見銀山と日本の領土（竹島）',
    skillId: 'skill-shakai-2023-shimane-territory',
    choices: [
      { id: 'a', label: 'ア', text: '日本最南端の沖ノ鳥島 ＝ 東京都', isCorrect: true },
      { id: 'b', label: 'イ', text: '日本最東端の南鳥島 ＝ 千葉県', isCorrect: false },
      { id: 'c', label: 'ウ', text: '竹島 ＝ 山口県', isCorrect: false },
      { id: 'd', label: 'エ', text: '尖閣諸島 ＝ 鹿児島県', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '最南端の沖ノ鳥島と最東端の南鳥島は、いずれも小笠原諸島と同じ「東京都」に属します。' },
      { level: 2, text: '竹島は島根県、尖閣諸島は沖縄県（石垣市）に属します。' },
    ],
    explanation: {
      resultSummary: '日本の最東端（南鳥島）と最南端（沖ノ鳥島）はどちらも東京都小笠原村に属しています。',
      keyTakeaway: '沖ノ鳥島（最南端）＆南鳥島（最東端）＝東京都！',
      reasoning: '排他的経済水域（EEZ）の基点となるため、護岸工事で島を守っています。',
    },
  },

  // 8. 関東大震災100年と帝都復興事業
  {
    id: 'curriculum-2023-shakai-disaster-1',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【近現代史】1923年9月1日に発生した関東大震災では、大火災によって甚大な被害が出ました。内務大臣兼帝都復興院総裁として、将来の大火災を防ぐために昭和通りなどの広い幹線道路や隅田公園などの防災避難公園を整備した人物は誰ですか。',
    category: '近現代史と防災',
    skillTitle: '関東大震災100年と帝都復興事業（都市防災）',
    skillId: 'skill-shakai-2023-disaster-reconstruction',
    choices: [
      { id: 'a', label: 'ア', text: '後藤新平', isCorrect: true },
      { id: 'b', label: 'イ', text: '大隈重信', isCorrect: false },
      { id: 'c', label: 'ウ', text: '原敬', isCorrect: false },
      { id: 'd', label: 'エ', text: '伊藤博文', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: '東京市長や鉄道院総裁も務め、壮大な帝都復興計画を立てた政治家です。' },
      { level: 2, text: '「大風呂敷」とあだ名されるほどの先見性をもった後藤○○です。' },
    ],
    explanation: {
      resultSummary: '後藤新平は関東大震災後、延焼を防ぐ幅広の道路や不燃化建築、避難公園を組み込んだ都市計画を推進しました。',
      keyTakeaway: '関東大震災の復興事業＝後藤新平（広大な幹線道路・防災公園の整備）。',
      reasoning: '当時の計画が現在の東京の骨格（昭和通り、隅田公園、復興小学校など）となっています。',
    },
  },
  {
    id: 'curriculum-2023-shakai-disaster-2',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【災害と歴史】日本の自然災害とその教訓について正しい説明を選びなさい。',
    category: '近現代史と防災',
    skillTitle: '関東大震災100年と帝都復興事業（都市防災）',
    skillId: 'skill-shakai-2023-disaster-reconstruction',
    choices: [
      { id: 'a', label: 'ア', text: '1995年の阪神・淡路大震災を契機に、津波タワーの建設が全国で初めて法制化された。', isCorrect: false },
      { id: 'b', label: 'イ', text: '1923年の関東大震災の被害の大半は津波であり、防潮堤が全国に建設された。', isCorrect: false },
      { id: 'c', label: 'ウ', text: '1923年9月1日の関東大震災にちなみ、毎年9月1日は「防災の日」と定められている。', isCorrect: true },
      { id: 'd', label: 'エ', text: '関東大震災の直後、復興費用をまかなうために五七五の標語コンクールのみが行われた。', isCorrect: false },
    ],
    correctAnswer: 'c',
    hints: [
      { level: 1, text: '毎年9月1日に全国の学校や地域で防災訓練が行われる理由を考えましょう。' },
      { level: 2, text: '関東大震災の被害の主因は強風による「火災」であり、津波ではありません。' },
    ],
    explanation: {
      resultSummary: '1923年9月1日に発生した関東大震災を教訓として、毎年9月1日は「防災の日」に制定されています。',
      keyTakeaway: '9月1日＝「防災の日」（関東大震災の教訓と台風シーズンの注意喚起）。',
      reasoning: '阪神・淡路大震災（1995年）は直下型地震・建物の倒壊、東日本大震災（2011年）は巨大津波が主被害でした。',
    },
  },

  // 9. 地域交通再生（BRT・LRT）と高齢化社会
  {
    id: 'curriculum-2023-shakai-lrt-1',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【現代社会】高齢化に伴う運転免許返納や環境負荷軽減への対策として、栃木県宇都宮市などで全国で初めて全線新設された、低床で段差がなく乗り降りがしやすい「次世代型路面電車」のアルファベット3文字の略称は何ですか。',
    category: '現代社会と地方自治',
    skillTitle: '地域交通再生（BRT・LRT）と高齢化社会',
    skillId: 'skill-shakai-2023-regional-transit-lrt',
    choices: [
      { id: 'a', label: 'ア', text: 'LRT', isCorrect: true },
      { id: 'b', label: 'イ', text: 'BRT', isCorrect: false },
      { id: 'c', label: 'ウ', text: 'EV', isCorrect: false },
      { id: 'd', label: 'エ', text: 'ETC', isCorrect: false },
    ],
    correctAnswer: 'a',
    hints: [
      { level: 1, text: 'Light Rail Transit（ライト・レール・トランジット）の略です。' },
      { level: 2, text: 'バス専用道路を走る「BRT（Bus Rapid Transit）」と混同しないようにしましょう。' },
    ],
    explanation: {
      resultSummary: '低床式でバリアフリーな次世代型路面電車は「LRT」と呼ばれ、2023年に宇都宮芳賀ライトレールが開業しました。',
      keyTakeaway: '次世代型路面電車＝LRT ／ バス高速輸送システム＝BRT。',
      reasoning: '二酸化炭素の排出抑制や、運転免許を返納した高齢者の移動手段として期待されています。',
    },
  },
  {
    id: 'curriculum-2023-shakai-lrt-2',
    subject: 'shakai',
    format: 'multiple_choice',
    prompt: '【地方の交通】地方都市や東日本大震災の被災地域などにおいて、鉄道の線路跡などを専用道路にしてバスを走らせることで、定時制や速達性を高めた「バス高速輸送システム」の略称はどれですか。',
    category: '現代社会と地方自治',
    skillTitle: '地域交通再生（BRT・LRT）と高齢化社会',
    skillId: 'skill-shakai-2023-regional-transit-lrt',
    choices: [
      { id: 'a', label: 'ア', text: 'LRT', isCorrect: false },
      { id: 'b', label: 'イ', text: 'BRT（Bus Rapid Transit）', isCorrect: true },
      { id: 'c', label: 'ウ', text: 'ETC', isCorrect: false },
      { id: 'd', label: 'エ', text: 'PFI', isCorrect: false },
    ],
    correctAnswer: 'b',
    hints: [
      { level: 1, text: '「Bus」の頭文字「B」から始まる3文字の略称です。' },
      { level: 2, text: '気仙沼線や大船渡線の復旧などで導入されました。' },
    ],
    explanation: {
      resultSummary: '専用レーンを使って渋滞を避け、正確な時間で運行するバス高速輸送システムを「BRT」といいます。',
      keyTakeaway: 'BRT（Bus Rapid Transit）＝専用道路を走る高速バスシステム。',
      reasoning: '一般道路との併用も可能で、鉄道に比べて復旧費用や維持管理費を抑えられるメリットがあります。',
    },
  },
];

