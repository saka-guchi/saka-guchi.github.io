/**
 * 中学受験生向け 世界の名言集 & 小学生向け解説
 * 
 * 偉人たちの名言と、ナース猫ミケちゃんによる「小学生受験生のやる気が湧く温かい解説」。
 * 日本時間（JST）ベースの日替わり取得、およびランダム切り替えに対応。
 */

export interface InspirationalQuote {
  id: string;
  author: string;
  authorRole: string;
  quote: string;
  kidsExplanation: string;
}

export const EXAM_INSPIRATIONAL_QUOTES: InspirationalQuote[] = [
  {
    id: 'edison-failure-discovery',
    author: 'トーマス・エジソン',
    authorRole: '💡 発明王（電球や蓄音機を発明）',
    quote: '失敗したわけではない。うまくいかない方法を1万通り見つけただけだ。',
    kidsExplanation: '過去問や模試で間違えた問題は、決して「失敗」じゃないよ！「このやり方だと解けないんだ」という大発見をした証拠なんだ。間違いを見つけるたびに、入試本番で正解できる確率がグングン上がっているよ！',
  },
  {
    id: 'einstein-keep-thinking',
    author: 'アルベルト・アインシュタイン',
    authorRole: '🧪 天才物理学者（相対性理論の発見者）',
    quote: '私は天才ではありません。ただ、人より長くひとつの問題と付き合ってきただけです。',
    kidsExplanation: '難しい算数の問題も、すぐに解けなくて大丈夫。「どうしてこうなるんだろう？」と粘り強く考えた時間そのものが、君の頭を一番大きく成長させてくれているよ！',
  },
  {
    id: 'ichiro-small-steps',
    author: 'イチロー',
    authorRole: '⚾ レジェンド野球選手（メジャー通算3000安打）',
    quote: '小さいことを重ねることが、とんでもないところへ行くただひとつの道。',
    kidsExplanation: '今日の1問の計算、1つの漢字、1つのカルテ学習。どんなに小さな一歩でも、毎日コツコツ続けた積み重ねこそが、入試本番で誰も届かない大きな奇跡を起こすよ！',
  },
  {
    id: 'disney-courage-to-dream',
    author: 'ウォルト・ディズニー',
    authorRole: '🏰 ディズニー創業者（ミッキーマウスの生みの親）',
    quote: '夢を求め続ける勇気さえあれば、すべての夢は必ずかなう。',
    kidsExplanation: '「あの中学校に行きたい！」「合格したい！」というワクワクした気持ちをずっと大切にしよう。あきらめずに進む勇気があれば、未来の扉は必ず開くよ！',
  },
  {
    id: 'helen-keller-face-the-sun',
    author: 'ヘレン・ケラー',
    authorRole: '🌻 奇跡の人・教育家（目や耳の障がいを乗り越えた）',
    quote: '顔をいつも太陽のほうに向けていれば、影は見えなくなる。',
    kidsExplanation: 'テストの結果で落ち込んだり不安になったときは、できたことや楽しい未来に目を向けよう！ 前を向いて笑顔でいれば、不安の影なんて吹き飛んじゃうよ。',
  },
  {
    id: 'mandela-impossible-until-done',
    author: 'ネルソン・マンデラ',
    authorRole: '🕊️ ノーベル平和賞受賞者（南アフリカ元大統領）',
    quote: '何事も達成するまでは、いつも不可能に見えるものだ。',
    kidsExplanation: '志望校の過去問を見て「こんなの難しすぎて無理…」って思うのは当たり前！ でも、毎日1問ずつ攻略していけば、最後には「できた！」に変わるから安心してね。',
  },
  {
    id: 'mother-teresa-great-love',
    author: 'マザー・テレサ',
    authorRole: '🤝 ノーベル平和賞受賞者（愛と奉仕の人）',
    quote: '私たちは大きなことはできません。小さなことを大きな愛をもって行うだけです。',
    kidsExplanation: '1日で一気に全部をやろうと焦らなくて大丈夫。今日の目の前の1問を、「よし、丁寧に解こう」と心をこめて取り組むことが合格への一番の近道だよ！',
  },
  {
    id: 'goethe-believe-in-yourself',
    author: 'ヨハン・ヴォルフガング・フォン・ゲーテ',
    authorRole: '📖 世界的大詩人・自然科学者',
    quote: '魔法とは、自分を信じることだ。それができれば、なんだってできる。',
    kidsExplanation: '一番強力な合格の味方は、「自分ならできる！」と信じる君自身の心だよ。これまで頑張ってきたノートやカルテの努力は、絶対に嘘をつかないよ！',
  },
  {
    id: 'marie-curie-understand-fear',
    author: 'マリー・キュリー（キュリー夫人）',
    authorRole: '🔬 ノーベル賞を2度受賞した偉大な科学者',
    quote: '人生において恐れるべきものは何もない。ただ理解すべきものがあるだけだ。',
    kidsExplanation: '苦手な単元や難問も、怖がらなくて大丈夫。「どうしてこの答えになるのかな？」と仕組みが分かった瞬間、怖さは「面白い！」に早変わりするよ！',
  },
  {
    id: 'churchill-never-give-up',
    author: 'ウィンストン・チャーチル',
    authorRole: '🎖️ 逆境を乗り越えたイギリスの名首相',
    quote: '成功とは、失敗を重ねてもやる気を失わないことだ。',
    kidsExplanation: 'バツがついてもガッカリしなくていいんだよ。「次は絶対正解するぞ！」と前を向いて何度でもチャレンジできる君は、すでに合格する力を持っているよ！',
  },
  {
    id: 'confucius-never-stop',
    author: '孔子',
    authorRole: '📜 古代の偉大な学者・思想家',
    quote: '止まりさえしなければ、どんなにゆっくり進んでも問題はない。',
    kidsExplanation: 'まわりの友だちと進むスピードを比べなくていいよ。たとえゆっくり亀の歩みでも、歩みを止めなければ、ゴールには必ずたどり着けるんだ！',
  },
  {
    id: 'galileo-discover-by-yourself',
    author: 'ガリレオ・ガリレイ',
    authorRole: '🔭 天文学・現代科学の父',
    quote: '人にものを教えることはできない。自ら気づくのを手助けできるだけだ。',
    kidsExplanation: '答えを丸暗記するより、「あ！そういうことか！」と自分でひらめいた感動が一番頭に残るよ。カルテのヒントを使って、自分で気づく楽しさをたくさん味わおう！',
  },
  {
    id: 'beethoven-overcome-hardship',
    author: 'ルートヴィヒ・ヴァン・ベートーヴェン',
    authorRole: '🎵 苦難を乗り越えた大作曲家（『第九』『運命』）',
    quote: '努力した者がすべて成功するとは限らない。しかし、成功した者は皆すべからく努力している。',
    kidsExplanation: '勉強した時間は、決して消えない「君だけの力」になるよ。今日流した汗と鉛筆の芯の減り具合が、本番の君を一番強い勇者にしてくれるよ！',
  },
  {
    id: 'lincoln-prepare-and-ready',
    author: 'エイブラハム・リンカーン',
    authorRole: '🎩 アメリカ第16代大統領（「人民の、人民による…」）',
    quote: 'もし木を切り倒すのに6時間与えられたら、私は最初の4時間を斧を研ぐのに費やすだろう。',
    kidsExplanation: '入試本番という本番をむかえる前に、基礎の計算や言葉をしっかり鍛えておくことが大事だよ。今やっている毎日の準備こそが、本番で一撃で勝つための「斧研ぎ」なんだ！',
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

  // 日付文字列を数値ハッシュ化
  let hash = 0;
  for (let i = 0; i < jstString.length; i++) {
    hash = (hash << 5) - hash + jstString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % EXAM_INSPIRATIONAL_QUOTES.length;
  return EXAM_INSPIRATIONAL_QUOTES[index];
}

/**
 * 現在表示中の名言とは異なる名言をランダムに取得する。
 */
export function getRandomQuote(currentId?: string): InspirationalQuote {
  const filtered = currentId
    ? EXAM_INSPIRATIONAL_QUOTES.filter(q => q.id !== currentId)
    : EXAM_INSPIRATIONAL_QUOTES;
  const target = filtered.length > 0 ? filtered : EXAM_INSPIRATIONAL_QUOTES;
  const randomIndex = Math.floor(Math.random() * target.length);
  return target[randomIndex];
}
