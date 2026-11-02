/**
 * こころの休憩室 学習＆ケアデータ
 * 
 * 小学生（中学受験生）が1人で安心して使えるように、
 * 専門用語（迷走神経、オキシトシン、一次感情等）や断定表現を排除し、
 * 受験期のリアルな悩み（偏差値、塾の席順、親の言葉等）に対応。
 */

import { SortingBoxType, CopingCategoryKey, ParentRequestType } from '../utils/mental-care/types';

// ==================================================================
// 1. モヤモヤ仕分け（3つの箱）
// ==================================================================

export interface SortingCardItem {
  id: string;
  text: string;
  box: SortingBoxType; // myself: じぶんで変えられる, help: だれかに手伝ってもらう, uncontrollable: 変えられない
  hint: string;
  explanation: string;
  icon: string;
  // 後方互換プロパティ
  category?: 'self' | 'others';
}

export const INITIAL_SORTING_CARDS: SortingCardItem[] = [
  {
    id: 'sort-exam-0',
    text: '先生が男子ばかり褒めたり贔屓（ひいき）すること',
    box: 'uncontrollable',
    hint: '相手の行動や態度は、相手の領域だよ',
    explanation: '先生が誰をどう扱うかは「相手の課題」です。あなたがどれだけ悩んでも先生の心は変えられません。あなたの価値とは無関係なので、そっと手放してOK！',
    icon: '👨‍🏫',
    category: 'others',
  },
  {
    id: 'sort-exam-1',
    text: '模試の時間が足りなくて、最後まで解けなかったように感じること',
    box: 'myself',
    hint: '解く順番や時間配分の作戦は、じぶんで工夫できるよ',
    explanation: '「次は大問1の計算を先に終わらせて見直そう」「分からない問題は一度飛ばそう」と、じぶんの作戦を立て直すことができます。',
    icon: '⏱️',
    category: 'self',
  },
  {
    id: 'sort-exam-2',
    text: '塾の席順やクラスが下がって悔しいこと',
    box: 'uncontrollable',
    hint: '今回の結果そのものは過去のこと。いまは変えられないよ',
    explanation: '出てしまった点数や順位は変えられません。悔しがるのは頑張った証拠。「過去の結果」はいったん横に置いて、深呼吸して今日の1問に向き合おう。',
    icon: '📊',
    category: 'others',
  },
  {
    id: 'sort-exam-3',
    text: '算数の分からない問題を、先生や親に質問すること',
    box: 'help',
    hint: 'ひとりで悩まず「教えて」と頼むのは、とても賢い行動！',
    explanation: '「ここまでは分かったけれど、ここから先が分かりません」と大人に聞くことで、あっという間に解決することがあります。',
    icon: '🙋',
    category: 'self',
  },
  {
    id: 'sort-exam-4',
    text: 'おうちの人から「勉強しなさい」と言われてイライラすること',
    box: 'help',
    hint: 'おうちの人と「何時に始めるか」あらかじめ約束できるよ',
    explanation: '親も心配で言ってしまうことがあります。「〇時になったら始めるから、それまで見守ってて」と自分から伝えてみよう。',
    icon: '🗣️',
    category: 'others',
  },
  {
    id: 'sort-exam-5',
    text: '友だちが遊んでいるのを見て、羨ましく感じること',
    box: 'uncontrollable',
    hint: '友だちが何をして過ごすかは、友だちの自由だよ',
    explanation: '他人の過ごし方は変えられません。「自分はいま、行きたい学校のためにこれを選んでいるんだ」と、自分の目標を思い出してみよう。',
    icon: '🎮',
    category: 'others',
  },
  {
    id: 'sort-exam-6',
    text: '疲れたときに、温かいお茶を飲んで10分目を閉じること',
    box: 'myself',
    hint: 'じぶんの体と心をいたわることは、いつでもじぶんで決められるよ',
    explanation: 'エネルギーが切れたら休むのは、受験生として一番大切な自己管理です。',
    icon: '🍵',
    category: 'self',
  },
  {
    id: 'sort-exam-7',
    text: '入試本番の日の天気や電車の混み具合',
    box: 'uncontrollable',
    hint: '天気や電車は、誰にもコントロールできないよ',
    explanation: '変えられないことを心配するより、「少し早めに出発する」「防寒着を用意する」など、じぶんでできる準備に目を向けよう。',
    icon: '🌨️',
    category: 'others',
  },
  {
    id: 'sort-exam-8',
    text: '先生が特定の子ばかり当てて贔屓（ひいき）しているように感じること',
    box: 'uncontrollable',
    hint: '先生の態度や行動は、先生自身のクセだよ',
    explanation: '先生がどう振る舞うかは相手の課題です。あなたの価値とはまったく無関係なので、「先生も大変なんだな」と心の中で切り離してOK。',
    icon: '👨‍🏫',
    category: 'others',
  },
];

// ==================================================================
// 2. こころのお守り図鑑（安全な15個）
// ==================================================================

export type CopingLocation = 'anywhere' | 'classroom' | 'home';

export interface CopingRecipe {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  durationMinutes: number; // 0.5 (30秒), 1, 3, 5
  location: CopingLocation;
  locationLabel: string;
  category: CopingCategoryKey;
  categoryLabel: string;
  steps: string[];
  whyItHelps: string; // 断定を排した平易な説明
  guideVoice: string; // ミケちゃんの声かけ
}

export const COPING_RECIPES: CopingRecipe[] = [
  {
    id: 'breathing_478',
    title: '4-7-8 ゆっくり深呼吸',
    icon: '🌬️',
    tagline: '息を吐ききることで、体がふっとゆるむよ',
    durationMinutes: 1,
    location: 'anywhere',
    locationLabel: 'どこでも',
    category: 'body',
    categoryLabel: 'からだ',
    steps: [
      '口から息をふーっと全部吐き出します。',
      '鼻から静かに息を吸います（4秒数えてね）。',
      '息をそっと止めます（7秒数えてね）。',
      '口から細く長く息を吐き出します（8秒かけてふーっ）。',
      'これを2〜3回繰り返してみよう。',
    ],
    whyItHelps: '息を長く吐くと、体の緊張がほぐれて、心臓のドキドキが落ち着きやすくなると言われているよ。',
    guideVoice: 'すーっと吸って…止めて…ゆっくり吐いていこうね🐾',
  },
  {
    id: 'breathing_count',
    title: '5つ数える深呼吸',
    icon: '🫧',
    tagline: '30秒でできる！テスト前にもおすすめ',
    durationMinutes: 0.5,
    location: 'classroom',
    locationLabel: '教室・テスト前',
    category: 'body',
    categoryLabel: 'からだ',
    steps: [
      '目を軽く閉じるか、机の木目をぼんやり見ます。',
      '1、2、3で息を吸って、4、5で長く吐きます。',
      '頭の中で数字を数えることにだけ意識を向けてみよう。',
    ],
    whyItHelps: '数を数えることに集中すると、焦りや不安な考えから頭をいったん休ませることができるよ。',
    guideVoice: '数字をゆっくり数えながら、息を吐いてみよう。',
  },
  {
    id: 'grounding_5things',
    title: '教室で見えるものを5つ探す',
    icon: '👀',
    tagline: 'いま、ここに意識をもどす魔法',
    durationMinutes: 1,
    location: 'classroom',
    locationLabel: '教室・自習室',
    category: 'sensory',
    categoryLabel: '五感',
    steps: [
      '周りを見渡して「青いもの」を5つ心の中で探してみよう。',
      '次は「四角いもの」を3つ探してみよう。',
      '最後に、いま耳に聞こえる音を2つ聴いてみよう（ペンの音、風の音など）。',
    ],
    whyItHelps: '頭の中のモヤモヤから、目や耳の感覚にスイッチを切り替えることで、気持ちが現実の安心に戻ってくるよ。',
    guideVoice: 'どんなものが見えるかな？ ゆっくり探してみてね。',
  },
  {
    id: 'finger_trace',
    title: '手のひら・指の形をなぞる',
    icon: '✋',
    tagline: 'ペンを置いて、じぶんの手をなぞってみよう',
    durationMinutes: 0.5,
    location: 'classroom',
    locationLabel: '教室でこっそり',
    category: 'sensory',
    categoryLabel: '五感',
    steps: [
      '片方の手をパーに広げます。',
      'もう片方の手の人差し指で、親指の付け根から指先へスーッとなぞります。',
      '山を登るときに息を吸い、下るときに息を吐きます。',
      '親指から小指まで、ゆっくり指をなぞってみよう。',
    ],
    whyItHelps: '肌の触れあう感覚と呼吸のリズムが合わさると、不思議と落ち着きやすくなるよ。',
    guideVoice: '指の形にそって、ゆっくりなぞっていこう。',
  },
  {
    id: 'muscle_relax',
    title: 'ギュッ・パッ 筋肉ゆるめ',
    icon: '✊',
    tagline: 'ぎゅーっと力を入れて、パッと手放す',
    durationMinutes: 1,
    location: 'anywhere',
    locationLabel: 'どこでも',
    category: 'body',
    categoryLabel: 'からだ',
    steps: [
      '両手をグーにして、肩を耳に近づけるようにギュッと力を入れます（5秒間キープ！）。',
      '「脱力！」と心の中で言って、ストンと力を抜いて手をパーに広げます（10秒ぼーっと味わう）。',
      'これを2回やってみよう。',
    ],
    whyItHelps: 'わざと強く力を入れてから抜くと、普段気づかない体のこわばりが一気にゆるみやすくなるよ。',
    guideVoice: 'ぎゅーっと力を入れて…ストン！ 脱力〜🐾',
  },
  {
    id: 'kind_self_talk',
    title: '友だちにかける優しい言葉',
    icon: '💬',
    tagline: '大好きな友だちなら、なんて言ってあげる？',
    durationMinutes: 1,
    location: 'anywhere',
    locationLabel: 'どこでも',
    category: 'mind',
    categoryLabel: 'こころ',
    steps: [
      'もし大切な友だちが同じように落ち込んでいたら、どんな言葉をかけるか思い浮かべてみます。',
      '「すごく頑張ってるの知ってるよ」「大丈夫、次があるよ」。',
      'その温かい言葉を、そのまま自分自身に心の中で言ってあげよう。',
    ],
    whyItHelps: 'じぶんを責める声をお休みさせて、優しい味方の声をかけると、心がほっと安心できるよ。',
    guideVoice: 'じぶんの一番の味方は、あなた自身だよ。優しい言葉をかけてあげてね。',
  },
  {
    id: 'break_into_one',
    title: 'やることを「小さな1問」に区切る',
    icon: '🧩',
    tagline: '山のような宿題も、目の前の1問から',
    durationMinutes: 1,
    location: 'home',
    locationLabel: '家・自習室',
    category: 'action',
    categoryLabel: '行動',
    steps: [
      'テキストを開いて、いまから解く「最初の1問だけ」に付箋を貼るか指で指します。',
      '他の問題や全体のページは見ないように隠します。',
      '「この1問だけ解いたら休憩してOK」と決めて、取りかかろう。',
    ],
    whyItHelps: 'やることが多すぎると脳が圧倒されて動けなくなります。極小の1歩にすると始めやすくなるよ。',
    guideVoice: 'ぜんぶやらなくて大丈夫。目の前の1問だけ、ちょこんと解いてみよう。',
  },
  {
    id: 'warm_drink',
    title: '温かい飲み物を一口味わう',
    icon: '🍵',
    tagline: 'マグカップの温もりを両手で包もう',
    durationMinutes: 3,
    location: 'home',
    locationLabel: '家',
    category: 'sensory',
    categoryLabel: '五感',
    steps: [
      '白湯、麦茶、ココアなど、温かい飲み物を用意します。',
      '両手でマグカップを持って、じんわり伝わる温かさを感じます。',
      '一口ふくんで、喉を通っていく温かさをじっくり味わってみよう。',
    ],
    whyItHelps: '胃やお腹が温まると、体が自然と「休んでいいよ」というリラックスモードに入りやすくなるよ。',
    guideVoice: 'ふーふーしながら、一口ずつゆっくり飲んでね。',
  },
  {
    id: 'cope-1',
    title: '冷たいお水をゆっくり一口飲む',
    icon: '💧',
    tagline: 'コップ1杯の冷たいお水を飲んで、喉と胃をすっきりリフレッシュ',
    durationMinutes: 0.5,
    location: 'anywhere',
    locationLabel: 'どこでも',
    category: 'body',
    categoryLabel: 'からだ',
    steps: [
      'コップ1杯のお水をゆっくり一口ずつ飲みます。',
      '喉を通っていく冷たさと、胃がすっきりする感覚を味わおう。',
    ],
    whyItHelps: '水分を摂ることで、緊張した喉や体のこわばりがリフレッシュされやすくなるよ。',
    guideVoice: 'お水を一口ずつ、ゆっくり味わってみよう。',
  },
  {
    id: 'cope-2',
    title: 'いらない紙を思いっきりビリビリ破く',
    icon: '🗑️',
    tagline: 'いらないチラシや裏紙を、思いっきりビリビリ！',
    durationMinutes: 1,
    location: 'home',
    locationLabel: '家',
    category: 'action',
    categoryLabel: '行動',
    steps: [
      'いらない裏紙やチラシを用意します。',
      '両手で思いっきりビリビリに破いてみよう！',
      '細かく破いたらゴミ箱へポイ！',
    ],
    whyItHelps: '手を使って紙を破くアクションで、体の中に溜まったモヤモヤエネルギーを外に逃がせるよ。',
    guideVoice: 'ビリビリ破いて、スッキリしよう！',
  },
  {
    id: 'favorite_scent',
    title: '好きな香りをかぐ',
    icon: '🍊',
    tagline: 'みかんの皮、ハンドクリーム、せっけんの香り',
    durationMinutes: 1,
    location: 'home',
    locationLabel: '家',
    category: 'sensory',
    categoryLabel: '五感',
    steps: [
      '好きな香りのリップ、ハンドクリーム、柑橘の皮などを用意します。',
      '目を閉じて、スーッと深くその香りを吸い込みます。',
      '「いい匂いだなあ」と感じる時間を味わおう。',
    ],
    whyItHelps: '香りの刺激は、考える脳（思考）を通さずに、感情や記憶をつかさどる部分にダイレクトに届いて気分を変えてくれるよ。',
    guideVoice: 'いい香りで、心をふわっと包んであげよう。',
  },
  {
    id: 'pet_or_favorite_photo',
    title: '好きな動物や推しの写真を見る',
    icon: '🐾',
    tagline: '見ているだけで笑顔になれるお守り写真',
    durationMinutes: 1,
    location: 'home',
    locationLabel: '家',
    category: 'distraction',
    categoryLabel: '気分転換',
    steps: [
      '飼っているペットや、好きな動物、大好きなキャラクターの写真を見ます。',
      '「可愛いな」「癒されるな」という気持ちをたっぷり感じてみよう。',
    ],
    whyItHelps: '「可愛い」「大好き」と感じると、緊張や不安が自然と和らぐホルモンが心を満たしてくれるよ。',
    guideVoice: '可愛い動物たちも、いつでもあなたの応援団だよ！',
  },
  {
    id: 'one_favorite_song',
    title: '好きな曲を1曲集中して聴く',
    icon: '🎵',
    tagline: 'イヤホンをつけて、音楽の世界にひたる4分間',
    durationMinutes: 4,
    location: 'home',
    locationLabel: '家',
    category: 'distraction',
    categoryLabel: '気分転換',
    steps: [
      'いま一番聴きたい大好きな曲を1曲だけ選びます。',
      '目を閉じて、メロディや歌詞、楽器の音に全集中して聴きます。',
      '曲が終わったら「よし！」と目を開けよう。',
    ],
    whyItHelps: '勉強やプレッシャーから完全に別の世界に浸ることで、脳の疲れをリセットできるよ。',
    guideVoice: '好きな音に包まれて、思いっきりリフレッシュしてね。',
  },
  {
    id: 'write_and_crumple',
    title: '紙に書いて丸めてゴミ箱へポイ！',
    icon: '🗑️',
    tagline: '嫌な気持ちを紙に吐き出して、ゴミ箱へ',
    durationMinutes: 2,
    location: 'home',
    locationLabel: '家',
    category: 'action',
    categoryLabel: '行動',
    steps: [
      'いらない裏紙とペンを用意します。',
      'モヤモヤしたこと、悔しいこと、嫌だったことを殴り書きで紙に書きます（誰にも見せなくてOK！）。',
      '書き終わったら、その紙をぐしゃぐしゃに丸めて「えいっ！」とゴミ箱に投げ捨てよう。',
    ],
    whyItHelps: '頭の中の黒いモヤモヤを目に見える形にして捨てることで、気持ちの区切りがつきやすくなるよ。',
    guideVoice: '思いっきり丸めて、ゴミ箱にポイって捨てちゃおう！',
  },
  {
    id: 'eyes_closed_timer',
    title: '5分間タイマーで目を閉じる',
    icon: '⏳',
    tagline: '寝なくてもOK！目と脳を休ませるプチ休憩',
    durationMinutes: 5,
    location: 'home',
    locationLabel: '家・自習室',
    category: 'body',
    categoryLabel: 'からだ',
    steps: [
      'タイマーを5分にセットします。',
      '椅子にもたれるか机に伏せて、目を閉じます。',
      '眠れなくても構いません。光を遮断して、暗闇の中でぼーっと息をします。',
      'ピピッとなったら、ゆっくり目を開けよう。',
    ],
    whyItHelps: '人間の脳の情報の8割以上は「目」から入っています。目を閉じるだけで脳の疲労回復になるよ。',
    guideVoice: '目を閉じて、静かな暗闇でひとやすみしよう。',
  },
  {
    id: 'look_at_clouds',
    title: '窓の外の雲や遠くの景色を眺める',
    icon: '☁️',
    tagline: '窓辺に行って、一番遠くの建物や空を見る',
    durationMinutes: 1,
    location: 'anywhere',
    locationLabel: 'どこでも',
    category: 'sensory',
    categoryLabel: '五感',
    steps: [
      '窓の近くに行きます。',
      '一番遠くにある雲や山の稜線、ビルのてっぺんをぼーっと見つめます。',
      '雲がどんな形に見えるか、空が何色か、のんびり観察してみよう。',
    ],
    whyItHelps: '近くのノートばかり見て縮こまっていた目のピントが合い、視野が広がることで心にもゆとりが生まれるよ。',
    guideVoice: '空は広くて大きいね。遠くをぼんやり眺めてみよう。',
  },
];

// ==================================================================
// 3. ホー先生のなるほどノート（全6トピック）
// ==================================================================

export interface DialogChoice {
  id: string;
  label: string;
  mentorFeedback: string; // ホー先生の穏やかな共感と問いかけ
}

export interface DialogStep {
  step: number;
  question: string;
  hint?: string;
  choices: DialogChoice[];
}

export interface PhilosophyTopic {
  id: string;
  title: string;
  tag: string; // 子ども向けタグ（例: 「成績・模試」「塾の席順」「親の言葉」）
  icon: string;
  lead: string;
  steps: DialogStep[];
  closingReflection: string; // 完了時のまとめ
}

export const PHILOSOPHY_TOPICS: PhilosophyTopic[] = [
  {
    id: 'topic_score_deviation',
    title: '「テストの点数や偏差値」ってなんだろう？',
    tag: '成績・模試',
    icon: '📈',
    lead: 'テストが返ってきたとき、点数ばかり気になって落ち込むこと、あるよね。',
    steps: [
      {
        step: 1,
        question: '点数が思い通りじゃなかったとき、一番最初にどんな気持ちが湧いてくる？',
        choices: [
          {
            id: 'c1',
            label: '「あんなに頑張ったのに」と悔しい・悲しい',
            mentorFeedback: '悔しいと感じるのは、それだけ本気で向き合ってきた証拠だよ。その気持ちはとても尊いものじゃ。',
          },
          {
            id: 'c2',
            label: '「怒られるんじゃないか」と怖くなる',
            mentorFeedback: '怒られる心配があると、胸がギュッとなるよね。結果を言うのは誰だって勇気がいることじゃ。',
          },
          {
            id: 'c3',
            label: '「もう自分には無理かも」と投げやりになる',
            mentorFeedback: '心がどっと疲れてしまうと、投げ出したくなるのは当たり前の防衛反応じゃよ。無理もない。',
          },
        ],
      },
      {
        step: 2,
        question: 'テストの点数って、そもそも何を表していると思う？',
        choices: [
          {
            id: 'c4',
            label: '自分の頭の良さや、人間としての価値',
            mentorFeedback: 'そう感じてしまうことがあるよね。でも、テストは「人間性」を測るものじゃないんじゃよ。',
          },
          {
            id: 'c5',
            label: '「その日に、どの単元の問題ができたか」という現在地',
            mentorFeedback: 'まさにその通りじゃ！ テストは「今どこにいるか」を教えてくれる健康診断のようなものなんじゃ。',
          },
          {
            id: 'c6',
            label: '次に入試本番で間違えないための「宝の地図」',
            mentorFeedback: '素晴らしい見方じゃ！ 弱点が見つかったということは、伸びしろが見つかったということじゃな。',
          },
        ],
      },
      {
        step: 3,
        question: 'これから点数とどう付き合っていったら、少し気が楽になるかな？',
        choices: [
          {
            id: 'c7',
            label: '点数ではなく「解き直してできるようになった問題」を数える',
            mentorFeedback: '最高の習慣じゃ。解き直した1問こそが、入試本番であなたを助ける大きな力になるよ。',
          },
          {
            id: 'c8',
            label: '結果が出た日は、まず美味しいものを食べて休む！',
            mentorFeedback: '大賛成じゃ！ 疲れた頭で反省しても落ち込むだけ。しっかりチャージしてから見直そう。',
          },
        ],
      },
    ],
    closingReflection: 'テストの点数はあなたの価値を決めるものじゃない。「次の一歩を見つけるためのカルテ」なんじゃよ。',
  },
  {
    id: 'topic_class_seat',
    title: '「塾の席順やクラス」ってなんだろう？',
    tag: '塾の席順・比較',
    icon: '🪑',
    lead: '席順が下がったりクラスが変わると、まわりの目が気になってしまうこと、あるよね。',
    steps: [
      {
        step: 1,
        question: '席順やクラスが下がったとき、何が一番つらく感じる？',
        choices: [
          {
            id: 'c1',
            label: '周りの友だちやライバルに見られるのが恥ずかしい',
            mentorFeedback: '周りの目が気になって、教室に入りづらくなる気持ち、とてもよく分かるよ。',
          },
          {
            id: 'c2',
            label: '自分のこれまでの努力が全部ムダになった気がする',
            mentorFeedback: '積み重ねたものが崩れたように感じてショックじゃったな。でも、頭に入った知識は消えておらんよ。',
          },
          {
            id: 'c3',
            label: '親をがっかりさせてしまうのが申し訳ない',
            mentorFeedback: 'おうちの人のことを大切に思っているからこそ、そう感じるんじゃな。優しい心を持っておる。',
          },
        ],
      },
      {
        step: 2,
        question: '塾の席順やクラスの仕組みについて、どう捉えてみる？',
        choices: [
          {
            id: 'c4',
            label: 'いまの自分に一番合ったスピードで学ぶための仕組み',
            mentorFeedback: 'その通りじゃ。無理に難しすぎる解説を聞くより、今の自分に必要な問題を固める方が近道なんじゃ。',
          },
          {
            id: 'c5',
            label: '塾のルールであって、入試本番の合否とは関係ない',
            mentorFeedback: '鋭い気づきじゃな！ 塾で前の方に座るのがゴールではなく、入試本番で合格するのがゴールじゃからな。',
          },
        ],
      },
      {
        step: 3,
        question: '教室で少し堂々と座るために、どんな言葉を自分にかけてあげよう？',
        choices: [
          {
            id: 'c6',
            label: '「誰がどこに座っていても、私は私のやるべきことをやる」',
            mentorFeedback: '凛とした素敵な言葉じゃ！ あなたの席こそが、いま一番力を伸ばせる場所なんじゃよ。',
          },
          {
            id: 'c7',
            label: '「いま後ろの席だからこそ、ここから巻き返したらカッコいい！」',
            mentorFeedback: 'その挑戦するエネルギー、とても頼もしいぞ！ 1歩ずつ進んでいこう。',
          },
        ],
      },
    ],
    closingReflection: '席順やクラスはただの「現在の座席」。あなたの目的地（合格）への道は、どこからでも繋がっておる。',
  },
  {
    id: 'topic_parent_words',
    title: '「親の期待や言葉」が重たく感じるとき',
    tag: 'おうちの人・声かけ',
    icon: '🗣️',
    lead: '親からの「もっと頑張って」「大丈夫？」が、プレッシャーに感じてしまうこと、ないかな？',
    steps: [
      {
        step: 1,
        question: 'おうちの人の言葉で、一番心がギュッとなるのはどんなとき？',
        choices: [
          {
            id: 'c1',
            label: '「他の子はもっとやってるよ」と比べられたとき',
            mentorFeedback: '比べられるのは一番つらいよね。自分は自分なりに頑張っているのに、と叫びたくなるな。',
          },
          {
            id: 'c2',
            label: '休んでいるときに「勉強しなくていいの？」と言われたとき',
            mentorFeedback: '「いま休憩してたのに！」とやる気がプツンと切れてしまうこと、よくあるよな。',
          },
          {
            id: 'c3',
            label: '心配そうにため息をつかれたり、顔色をうかがわれたとき',
            mentorFeedback: 'ため息は重たい空気が伝わってくるよな。相手の不安を背負ってしまう優しい子ほど苦しくなる。',
          },
        ],
      },
      {
        step: 2,
        question: 'おうちの人は、どうしてそういう言葉を言ってしまうんだと思う？',
        choices: [
          {
            id: 'c4',
            label: 'あなたのことが心配で、親自身も不安でたまらないから',
            mentorFeedback: '大正解じゃ。実は大人も、受験のサポートで毎日ドキドキして不安なんじゃよ。',
          },
          {
            id: 'c5',
            label: 'あなたを困らせたいわけではなく、声かけが不器用なだけ',
            mentorFeedback: 'そうなんじゃよ。気持ちは応援したいのに、言葉の伝え方が下手になってしまう大人は多いんじゃ。',
          },
        ],
      },
      {
        step: 3,
        question: 'この重たさを少し軽くするために、どうしてみる？',
        choices: [
          {
            id: 'c6',
            label: '「〇時になったらやるから、それまで見守ってて」と言葉で伝える',
            mentorFeedback: 'じぶんの時間を宣言するのはとても大人な対応じゃ。相手も安心して見守れるようになるぞ。',
          },
          {
            id: 'c7',
            label: '「親の不安」を全部じぶんの心に背負い込まず、そっと聞き流す',
            mentorFeedback: '賢いバウンダリー（境界線）じゃな。親の不安は親のもの、あなたの勉強はあなたのものじゃ。',
          },
        ],
      },
    ],
    closingReflection: 'おうちの人の言葉の奥には「応援したい」がある。でも、全部を抱え込まず、じぶんのペースを守っていいんじゃよ。',
  },
  {
    id: 'topic_motivation_zero',
    title: '「どうしてもやる気が出ない日」はどうすればいい？',
    tag: 'やる気・休養',
    icon: '🔋',
    lead: '机に向かってもペンが動かない、頭がぼーっとする…そんな日もあるよね。',
    steps: [
      {
        step: 1,
        question: 'やる気が出ないとき、頭の中でどんな自分責めの声がする？',
        choices: [
          {
            id: 'c1',
            label: '「こんなことで合格できるわけない」と焦る',
            mentorFeedback: '焦る気持ちが募るよな。でも、動けないのは「怠け」ではなく「充電切れ」の合図なんじゃ。',
          },
          {
            id: 'c2',
            label: '「自分は意志が弱くてダメなやつだ」と落ち込む',
            mentorFeedback: '自分を責めてしまうと、余計にエネルギーが奪われてしまうぞ。あなたの意志のせいじゃないよ。',
          },
        ],
      },
      {
        step: 2,
        question: 'スマホのバッテリーが10%のとき、どうする？',
        choices: [
          {
            id: 'c3',
            label: '充電器につないで、画面を暗くして待つ',
            mentorFeedback: 'そうじゃな！ 人間の心と体もまったく同じで、バッテリーが減ったら充電器が必要なんじゃ。',
          },
          {
            id: 'c4',
            label: '「動け！」とスマホを叩いて叱りつける',
            mentorFeedback: '叩いても充電は増えないよな。自分を叱りつけてもバッテリーは戻らないんじゃよ。',
          },
        ],
      },
      {
        step: 3,
        question: '今日の「小さな充電」として、何をしてあげようか？',
        choices: [
          {
            id: 'c5',
            label: '思い切って15分だけ完全に横になって目を閉じる',
            mentorFeedback: '素晴らしい決断じゃ！ 15分の充電で、驚くほど頭がクリアになることがあるよ。',
          },
          {
            id: 'c6',
            label: '一番簡単な計算や漢字を3問だけ解いて「今日のノルマ完了」にする',
            mentorFeedback: 'ハードルをぐっと下げる技じゃな！ 0問より3問できた自分をたっぷり褒めてあげよう。',
          },
        ],
      },
    ],
    closingReflection: 'やる気が出ないのは「少し休もう」という体からの大切なサイン。上手に充電できる人こそ、最後まで走りきれるぞ。',
  },
  {
    id: 'topic_friends_playing',
    title: '「友だちが遊んでいる」のを見たとき',
    tag: '友だち・孤独感',
    icon: '🏃',
    lead: '放課後、みんなが公園やゲームで盛り上がっているのを見ると、寂しくなること、あるよね。',
    steps: [
      {
        step: 1,
        question: '遊んでいる友だちを見たとき、どんな想いが湧いてくる？',
        choices: [
          {
            id: 'c1',
            label: '「なんで自分だけこんなにつらい思いをしなきゃいけないの？」',
            mentorFeedback: '不公平に感じて悔しくなるよね。自分だけ別の世界にいるような寂しさもあるな。',
          },
          {
            id: 'c2',
            label: '「受験なんてやめちゃいたいな」とふと思う',
            mentorFeedback: 'そう思うのはごく自然なことじゃ。小学生が毎日何時間も勉強するのは本当にすごいことなんじゃから。',
          },
        ],
      },
      {
        step: 2,
        question: 'あなたが中学受験をしようと決めた「最初のワクワク」は何だった？',
        choices: [
          {
            id: 'c3',
            label: '行きたい学校の部活や文化祭が楽しそうだったこと',
            mentorFeedback: 'あの時のキラキラした気持ち、覚えているかい？ その未来があなたを待っているよ。',
          },
          {
            id: 'c4',
            label: '面白い理科の実験や、難しい算数を解く楽しさ',
            mentorFeedback: '学ぶ楽しさを知っているのは、あなたの大きな才能じゃな。',
          },
          {
            id: 'c5',
            label: '新しい世界で、自分に合う友だちをたくさん作りたいこと',
            mentorFeedback: '同じ目標を持った仲間が集まる場所で過ごす日々は、かけがえのない宝物になるぞ。',
          },
        ],
      },
      {
        step: 3,
        question: 'いまの我慢や努力は、未来のどんな自分に繋がっていると思う？',
        choices: [
          {
            id: 'c6',
            label: '「自分で目標を決めて最後までやり遂げた」という大きな自信',
            mentorFeedback: 'まさに一生モノの自信じゃ！ 入試が終わったあと、思いっきり遊ぶ時間も待っておるぞ。',
          },
          {
            id: 'c7',
            label: 'いまは種まきの時期。春に満開の花を咲かせるための時間',
            mentorFeedback: '土の中でしっかり根を張っている最中なんじゃな。その努力をホー先生はずっと見ておるよ。',
          },
        ],
      },
    ],
    closingReflection: 'いま選んでいる道は、あなたが自分の意志で未来を掴むための特別な冒険なんじゃよ。',
  },
  {
    id: 'topic_teacher_bias',
    title: '「先生のえこひいき」を感じたとき',
    tag: '学校・先生',
    icon: '👨‍🏫',
    lead: '学校や塾の先生が特定の子ばかり可愛がっているように見えて、モヤモヤすること、あるよね。',
    steps: [
      {
        step: 1,
        question: 'その場面を見たとき、胸の奥でどんな感情が動いた？',
        choices: [
          {
            id: 'c1',
            label: '「不公平だ！ ずるい！」という強い怒り',
            mentorFeedback: '公平さを大切に思う正義感があるからこそ、強く怒りを感じたんじゃな。',
          },
          {
            id: 'c2',
            label: '「自分は大切にされていないのかな」という悲しさ',
            mentorFeedback: '認めてもらえなかったように感じて、胸がチクチク痛んだんじゃな。つらかったね。',
          },
        ],
      },
      {
        step: 2,
        question: '先生の態度について、事実と感情を分けて考えてみよう',
        choices: [
          {
            id: 'c3',
            label: '先生も完璧な人間ではなく、無意識のクセや未熟さがある',
            mentorFeedback: '大人も完璧ではないんじゃよ。先生の対応の偏りは、先生自身の課題であってあなたのせいじゃない。',
          },
          {
            id: 'c4',
            label: '先生にどう見られるかより、自分がやるべき学びに集中する',
            mentorFeedback: '見事な切り離しじゃ！ 先生の好かれ役にエネルギーを使わなくていいんじゃよ。',
          },
        ],
      },
      {
        step: 3,
        question: 'このモヤモヤをすっきり手放すために、どうする？',
        choices: [
          {
            id: 'c5',
            label: '「先生も大変なんだな」と心の中でスルーして、自分の勉強に戻る',
            mentorFeedback: '一番スマートな大人の対応じゃ。あなたの時間はあなたの大切な夢のために使おう。',
          },
          {
            id: 'c6',
            label: '信頼できるおうちの人や別の先生に「こんなことがあって嫌だった」と話す',
            mentorFeedback: '安心できる人に気持ちを吐き出すのはとても良いことじゃ。ひとりで溜め込まないでね。',
          },
        ],
      },
    ],
    closingReflection: '先生の態度であなたの価値は1ミリも変わりません。あなたの本当の良さを知ってくれている味方が必ずおるよ。',
  },
];

// ==================================================================
// 4. おうちの人への連携テンプレート
// ==================================================================

export interface CareCardTemplate {
  id: string;
  title: string;
  icon: string;
  text: string;
}

export const CARE_CARD_TEMPLATES: CareCardTemplate[] = [
  {
    id: 'card_thanks_lunch',
    title: 'いつもありがとう',
    icon: '🍱',
    text: 'いつも美味しいお弁当や送り迎え、サポートをありがとう。照れくさいけど感謝してます！',
  },
  {
    id: 'card_need_listen',
    title: 'ちょっと話を聞いてほしいな',
    icon: '👂',
    text: '最近ちょっとモヤモヤすることがあるんだ。アドバイスじゃなくて、ただうんうんって聞いてくれたら嬉しいな。',
  },
  {
    id: 'card_need_quiet',
    title: '少しそっとしておいてね',
    icon: '🌿',
    text: 'いま頭がいっぱいで少し疲れてます。機嫌が悪いわけじゃないから、少し静かに見守っててね。',
  },
  {
    id: 'card_need_refresh',
    title: 'いっしょに息抜きしたいな',
    icon: '🍦',
    text: '勉強のあいまに、美味しいおやつを食べたり散歩に付き合ってほしいな！',
  },
];

export const PARENT_REQUEST_OPTIONS: Array<{ type: ParentRequestType; label: string; icon: string }> = [
  { type: 'listen', label: '話を聞いてほしいな', icon: '👂' },
  { type: 'quiet', label: 'そっとしておいてほしいな', icon: '🌿' },
  { type: 'refresh', label: 'いっしょに気分転換したいな', icon: '🍦' },
];
