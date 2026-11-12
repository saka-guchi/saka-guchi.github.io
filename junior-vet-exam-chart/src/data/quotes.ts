/**
 * 中学受験生向け 世界の名言集 & 小学生向けやる気・心のお守り解説
 * 
 * ・中学入試（社会・歴史・国語・理科）で頻出の偉人
 * ・マイペースな受験生にガツンと渇を入れる名言
 * ・大人の理不尽や不公平（男子ひいき・登校拒否など）に負けず、自分の力で未来を切り開く心のお守りメッセージ
 */

export type QuoteCategory = 'grit' | 'empower' | 'exam_figure' | 'perseverance';

export interface InspirationalQuote {
  id: string;
  category: QuoteCategory;
  categoryLabel: string;
  author: string;
  authorRole: string;
  quote: string;
  kidsExplanation: string;
}

export const EXAM_INSPIRATIONAL_QUOTES: InspirationalQuote[] = [
  // ----------------------------------------------------
  // 【🌸 心のお守り・理不尽を跳ね返すエンパワーメント】
  // 学校の不公平や理不尽に傷ついている子どもの心を守り、外の世界へ羽ばたく勇気を授ける
  // ----------------------------------------------------
  {
    id: 'raicho-sun-inside',
    category: 'empower',
    categoryLabel: '🌸 心のお守り・入試頻出',
    author: '平塚らいてう（ひらつからいてう）',
    authorRole: '📜 女性解放運動の先駆者・『青鞜』創刊（中学入試歴史の超重要人物）',
    quote: '元始、女性は実に太陽であった。真性の人であった。私どもは隠された太陽を取り戻さなければならない。',
    kidsExplanation: '学校の先生が男子ばかりひいきしたり、君の意見を聞いてくれなくても、君の価値は1ミリも下がらないよ！ 君は誰かの顔色をうかがって光る月じゃない。自分自身でまぶしく輝く「太陽」なんだ。狭い教室の理不尽なんて飛び越えて、君が胸を張って主役になれる最高の志望校をつかみ取ろう！',
  },
  {
    id: 'ryoma-what-others-say',
    category: 'empower',
    categoryLabel: '🌸 心のお守り・入試頻出',
    author: '坂本龍馬（さかもとりょうま）',
    authorRole: '⚔️ 幕末の志士・薩長同盟の立役者（中学入試歴史の超頻出人物）',
    quote: '世の人は我を何とも言わば言え、我が成す事は我のみぞ知る。',
    kidsExplanation: '学校の先生や周りの大人が君をちゃんと見てくれなくても、君の本当の頑張りや悔しさは君自身が一番知っているよ！ たった一つの教室のゆがんだ評価なんて気にしなくていい。君にはもっと広い世界と明るい未来が待っているよ！',
  },
  {
    id: 'katsu-kaishu-my-way',
    category: 'empower',
    categoryLabel: '🌸 心のお守り・入試頻出',
    author: '勝海舟（かつかいしゅう）',
    authorRole: '🚢 江戸城無血開城の立役者・海軍の父（中学入試歴史頻出）',
    quote: '行蔵は我に存す、毀誉は他人の主張、我に与からず我に関せずと存じ候。',
    kidsExplanation: '「自分がどう生きるかは自分の自由。他人が勝手に悪口を言おうがひいきしようが、そんなの知ったことじゃない！」という意味だよ。理不尽な先生の機嫌なんて、君の人生には関係ない！ 自分の信じる勉強の道を堂々と進もう！',
  },
  {
    id: 'eleanor-inferiority-consent',
    category: 'empower',
    categoryLabel: '🌸 心のお守り',
    author: 'エレノア・ルーズベルト',
    authorRole: '🕊️ 国連人権委員会初代委員長・女性運動家',
    quote: 'あなたの同意なしに、誰もあなたに劣等感を抱かせることはできない。',
    kidsExplanation: '学校の先生がどんなに不公平な態度をとっても、君が「自分はダメなんだ」と受け入れる必要は絶対にないよ！ 相手の不公平さに付き合ってあげる義理なんてない。君の堂々としたプライドをしっかり守ってね。',
  },
  {
    id: 'malala-books-and-pens',
    category: 'empower',
    categoryLabel: '🌸 心のお守り',
    author: 'マララ・ユサフザイ',
    authorRole: '📚 史上最年少ノーベル平和賞受賞者（女子教育の権利を訴えた）',
    quote: '1人の子ども、1人の教師、1冊の本、そして1本のペンが、世界を変えることができる。',
    kidsExplanation: '理不尽に声を無視されても、学ぶ力は誰にも奪えない君だけの最強の武器だよ！ 今ここで実力をつけておけば、君を軽んじた大人たちを将来アッと言わせることができるんだ！',
  },
  {
    id: 'chanel-create-life',
    category: 'empower',
    categoryLabel: '🌸 心のお守り',
    author: 'ココ・シャネル',
    authorRole: '👗 世界のファッションを変えた孤児院出身の革命的デザイナー',
    quote: '私の人生は楽しくなかった。だからこそ、私は自分の人生を自分で創造したの。',
    kidsExplanation: '今いる学校が理不尽で息苦しいなら、自分で勉強して、自分が心から笑顔になれる新しい居場所（志望校）を自分の手で作り出せばいいんだよ！ 悔しさをエネルギーに変えて合格を勝ち取ろう！',
  },

  // ----------------------------------------------------
  // 【🔥 渇！気合・追い込み・マイペース脱却】
  // 「明日やればいいや」「マイペースだから」と甘えがちな受験生の背筋を伸ばす
  // ----------------------------------------------------
  {
    id: 'noguchi-study-five-times',
    category: 'grit',
    categoryLabel: '🔥 渇！気合・入試頻出',
    author: '野口英世（のぐちひでよ）',
    authorRole: '🔬 黄熱病研究・旧千円札の偉人（中学入試歴史・伝記頻出）',
    quote: '誰よりも3倍、4倍、5倍勉強する者、それが天才だ。',
    kidsExplanation: '「マイペース」を言い訳にして、のんびり逃げてないかな？ 本気で合格を狙うライバルたちは、今この瞬間も1分1秒を惜しんでペンを走らせているよ！ 本番で悔し涙を流さないために、今すぐギアをトップに入れて自分を追い込もう！',
  },
  {
    id: 'franklin-never-delay',
    category: 'grit',
    categoryLabel: '🔥 渇！気合・入試頻出',
    author: 'ベンジャミン・フランクリン',
    authorRole: '⚡ アメリカ建国の父・科学者（避雷針を発明）',
    quote: '今日できることを、明日に延ばすな。',
    kidsExplanation: '「あとでやろう」「明日から本気出す」は一番の毒薬だよ！ 入試本番までの日数は毎日確実に減っているんだ。今日の1問、今日のノルマは絶対に今日やり切る！ その厳しさだけが合格を連れてくるよ！',
  },
  {
    id: 'fukuzawa-gakumon',
    category: 'grit',
    categoryLabel: '🔥 渇！気合・入試頻出',
    author: '福沢諭吉（ふくざわゆきち）',
    authorRole: '📖 慶應義塾創設者・『学問のすすめ』（中学入試歴史の超重要人物）',
    quote: '天は人の上に人を造らず人の下に人を造らず…ただ学問を勤めて物事をよく知る者は貴人となり、無学なる者は貧人となる。',
    kidsExplanation: '生まれつきの頭の良さの差なんてないんだよ！ 差がつくのは「今、どれだけ自分に厳しく机に向かったか」だけ。のんびり過ごして入試本番で後悔するのは君自身だよ。今すぐ机に向かって渇を入れよう！',
  },
  {
    id: 'shoin-will-and-action',
    category: 'grit',
    categoryLabel: '🔥 渇！気合・入試頻出',
    author: '吉田松陰（よしだしょういん）',
    authorRole: '🔥 松下村塾で維新の志士を育てた熱血教育者（中学入試歴史頻出）',
    quote: '志を立てても、行動しなければ志がないのと同じだ。',
    kidsExplanation: '「あの学校に行きたいな〜」と頭で考えるだけなら誰でもできるよ！ 本当に合格したいなら、今すぐスマホや遊びを置いて、目の前の1問を解く「行動」で見せてごらん！',
  },
  {
    id: 'churchill-grit-never-give-up',
    category: 'grit',
    categoryLabel: '🔥 渇！気合',
    author: 'ウィンストン・チャーチル',
    authorRole: '🎖️ 逆境を不屈の闘志で乗り越えたイギリスの名首相',
    quote: '地獄の真っ只中にいるなら、そのまま歩き続けろ。決して立ち止まるな。',
    kidsExplanation: '「過去問が解けなくてつらい」「模試の判定が悪い」と立ち止まってマイペースに休んでちゃダメだ！ 苦しいときこそ足を止めずに前へ進んだ者だけが、トンネルを抜けて合格の光をつかめるんだよ！',
  },
  {
    id: 'lincoln-sharpen-axe',
    category: 'grit',
    categoryLabel: '🔥 渇！気合・入試頻出',
    author: 'エイブラハム・リンカーン',
    authorRole: '🎩 アメリカ第16代大統領（奴隷解放宣言、ゲティスバーグ演説）',
    quote: 'もし木を切り倒すのに6時間与えられたら、私は最初の4時間を斧を研ぐのに費やすだろう。',
    kidsExplanation: '「本番で奇跡が起きないかな」なんて甘い期待は通用しないよ！ 入試直前の今こそ、計算や重要語句という「斧」を誰よりも鋭く研ぎ澄ます猛特訓をするんだ！',
  },

  // ----------------------------------------------------
  // 【📚 中学入試頻出の偉人・知恵と粘り強さ】
  // ----------------------------------------------------
  {
    id: 'edison-failure-discovery',
    category: 'exam_figure',
    categoryLabel: '📚 入試頻出・知恵',
    author: 'トーマス・エジソン',
    authorRole: '💡 発明王（電球や蓄音機を発明・理科頻出）',
    quote: '失敗したわけではない。うまくいかない方法を1万通り見つけただけだ。',
    kidsExplanation: '過去問や模試で間違えた問題は決して「失敗」じゃないよ！「このやり方だと解けないんだ」という大発見をした証拠なんだ。間違いを見つけるたびに、入試本番で正解できる確率がグングン上がっているよ！',
  },
  {
    id: 'einstein-keep-thinking',
    category: 'exam_figure',
    categoryLabel: '📚 入試頻出・知恵',
    author: 'アルベルト・アインシュタイン',
    authorRole: '🧪 天才物理学者（相対性理論の発見者・ノーベル物理学賞）',
    quote: '私は天才ではありません。ただ、人より長くひとつの問題と付き合ってきただけです。',
    kidsExplanation: '難しい算数の問題も、すぐに解けなくて大丈夫。「どうしてこうなるんだろう？」と粘り強く考えた時間そのものが、君の頭を一番大きく成長させてくれているよ！',
  },
  {
    id: 'ichiro-small-steps',
    category: 'perseverance',
    categoryLabel: '⚡ 継続の力',
    author: 'イチロー',
    authorRole: '⚾ レジェンド野球選手（メジャー通算3000安打・日米通算4367安打）',
    quote: '小さいことを重ねることが、とんでもないところへ行くただひとつの道。',
    kidsExplanation: '今日の1問の計算、1つの漢字、1つのカルテ学習。どんなに小さな一歩でも、毎日コツコツ続けた積み重ねこそが、入試本番で誰も届かない大きな奇跡を起こすよ！',
  },
  {
    id: 'disney-courage-to-dream',
    category: 'perseverance',
    categoryLabel: '⚡ 夢を追う勇気',
    author: 'ウォルト・ディズニー',
    authorRole: '🏰 ディズニー創業者（ミッキーマウスの生みの親）',
    quote: '夢を求め続ける勇気さえあれば、すべての夢は必ずかなう。',
    kidsExplanation: '「あの中学校に行きたい！」「合格したい！」というワクワクした気持ちをずっと大切にしよう。あきらめずに進む勇気があれば、未来の扉は必ず開くよ！',
  },
  {
    id: 'helen-keller-face-the-sun',
    category: 'perseverance',
    categoryLabel: '🌸 心のお守り',
    author: 'ヘレン・ケラー',
    authorRole: '🌻 奇跡の人・教育家（目や耳の障がいを乗り越えた）',
    quote: '顔をいつも太陽のほうに向けていれば、影は見えなくなる。',
    kidsExplanation: 'テストの結果で落ち込んだり不安になったときは、できたことや楽しい未来に目を向けよう！ 前を向いて笑顔でいれば、不安の影なんて吹き飛んじゃうよ。',
  },
  {
    id: 'mandela-impossible-until-done',
    category: 'perseverance',
    categoryLabel: '⚡ 不可能を可能に',
    author: 'ネルソン・マンデラ',
    authorRole: '🕊️ ノーベル平和賞受賞者（南アフリカ元大統領）',
    quote: '何事も達成するまでは、いつも不可能に見えるものだ。',
    kidsExplanation: '志望校の過去問を見て「こんなの難しすぎて無理…」って思うのは当たり前！ でも、毎日1問ずつ攻略していけば、最後には「できた！」に変わるから安心してね。',
  },
];

/**
 * 日本標準時（JST: Asia/Tokyo）に基づいて当日の名言を1件決定論的に取得する。
 */
export function getDailyQuote(date: Date = new Date()): InspirationalQuote {
  const jstString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // 例: "2026-11-12"

  let hash = 0;
  for (let i = 0; i < jstString.length; i++) {
    hash = (hash << 5) - hash + jstString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % EXAM_INSPIRATIONAL_QUOTES.length;
  return EXAM_INSPIRATIONAL_QUOTES[index];
}

/**
 * カテゴリを指定して、または現在とは異なる名言をランダムに取得する。
 */
export function getRandomQuote(currentId?: string, categoryFilter?: QuoteCategory | 'all'): InspirationalQuote {
  let pool = EXAM_INSPIRATIONAL_QUOTES;
  if (categoryFilter && categoryFilter !== 'all') {
    pool = pool.filter(q => q.category === categoryFilter);
  }
  const filtered = currentId ? pool.filter(q => q.id !== currentId) : pool;
  const target = filtered.length > 0 ? filtered : pool;
  const randomIndex = Math.floor(Math.random() * target.length);
  return target[randomIndex];
}
