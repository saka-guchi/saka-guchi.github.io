export type SchoolId = 'chiyoda' | 'meguro';

export interface AdviceItem {
  id: string;
  text: string;
  highlightText?: string;
  badge?: {
    text: string;
    type: 'priority' | 'bonus' | 'warn';
  };
}

export interface AdviceSubSection {
  title: string;
  items: AdviceItem[];
}

export interface AdviceSection {
  id: string;
  title: string;
  rubyTitle?: { text: string; ruby?: string }[];
  doctorTitle: string;
  doctorAvatar: string;
  themeClass: 'common' | 'kokugo' | 'sansu' | 'rika' | 'shakai' | 'card-warn' | 'card-gold';
  subSections?: AdviceSubSection[];
  directItems?: AdviceItem[];
}

export interface SchoolAdviceData {
  schoolId: SchoolId;
  schoolName: string;
  hospitalName: string;
  headerTitle: string;
  headerSubTitle: string;
  headerGradient: string;
  footerMessage: string;
  sections: AdviceSection[];
}

export const SCHOOL_ADVICE_DATA: Record<SchoolId, SchoolAdviceData> = {
  chiyoda: {
    schoolId: 'chiyoda',
    schoolName: '千代田中学校',
    hospitalName: '🏥 千代田どうぶつ総合病院',
    headerTitle: '✨ 合格（ごうかく）に向けて！毎日やることリスト ✨',
    headerSubTitle: '千代田どうぶつ総合病院（千代田中学校）の指導医ドクター直伝！毎日コツコツ積み重ねてレベルアップしよう！',
    headerGradient: 'linear-gradient(135deg, #74b9ff, #a29bfe)',
    footerMessage: '応援（おうえん）しているよ！自分のペースでがんばろう！📣',
    sections: [
      {
        id: 'chiyoda-common',
        title: '🌟 どの教科でも大切なこと',
        rubyTitle: [
          { text: '🌟 どの' },
          { text: '教科', ruby: 'きょうか' },
          { text: 'でも' },
          { text: '大切', ruby: 'たいせつ' },
          { text: 'なこと' },
        ],
        doctorTitle: '院長ドクターの診察基本心得',
        doctorAvatar: '🦁',
        themeClass: 'common',
        directItems: [
          {
            id: 'chiyoda-common-1',
            text: '「なぜ？どうして？」と考えるクセをつける（丸暗記だけにしない）。',
            highlightText: '「なぜ？どうして？」と考えるクセ',
          },
          {
            id: 'chiyoda-common-2',
            text: '過去問を使って、どの問題から解くか順番と時間配分を決めて練習する。',
            highlightText: '順番と時間配分',
          },
          {
            id: 'chiyoda-common-3',
            text: '新聞やニュースを見て、世の中の出来事に興味をもつ。',
          },
          {
            id: 'chiyoda-common-4',
            text: '書く問題（記述）では、途中まででも自分の考えを言葉にして書く練習をする。',
            highlightText: '自分の考えを言葉にして書く',
          },
        ],
      },
      {
        id: 'chiyoda-kokugo',
        title: '📕 国語（こくご）',
        rubyTitle: [
          { text: '📕 ' },
          { text: '国語', ruby: 'こくご' },
          { text: '（こくご）' },
        ],
        doctorTitle: 'こころ・問診指導医',
        doctorAvatar: '🐱',
        themeClass: 'kokugo',
        subSections: [
          {
            title: '📅 毎日のれんしゅう',
            items: [
              {
                id: 'chiyoda-kokugo-daily-1',
                text: '3日に1回、週に1回など定期的に文章問題を解く（間をあけない）。',
                highlightText: '定期的に文章問題',
              },
              {
                id: 'chiyoda-kokugo-daily-2',
                text: 'いろいろなテーマの文章を読む。',
              },
              {
                id: 'chiyoda-kokugo-daily-3',
                text: 'おうちの人との会話で、自分の考えをわかりやすく説明する練習をする。',
              },
            ],
          },
          {
            title: '💡 問題を解くときのコツ',
            items: [
              {
                id: 'chiyoda-kokugo-tip-1',
                text: '「国語って楽しい！」と思い込んで集中して読む。',
                highlightText: '「国語って楽しい！」',
              },
              {
                id: 'chiyoda-kokugo-tip-2',
                text: '線が引いてある場所のすぐ前にヒントがないか確認する。',
                highlightText: 'すぐ前',
              },
              {
                id: 'chiyoda-kokugo-tip-3',
                text: '書く問題（記述）は、聞かれていることと大事な言葉を確かめて、指定された文字数の8割以上書く。',
                highlightText: '指定された文字数の8割以上',
              },
            ],
          },
        ],
      },
      {
        id: 'chiyoda-sansu',
        title: '📘 算数（さんすう）',
        rubyTitle: [
          { text: '📘 ' },
          { text: '算数', ruby: 'さんすう' },
          { text: '（さんすう）' },
        ],
        doctorTitle: 'バイタル・精密検査指導医',
        doctorAvatar: '🦉',
        themeClass: 'sansu',
        subSections: [
          {
            title: '📅 毎日のれんしゅう',
            items: [
              {
                id: 'chiyoda-sansu-daily-1',
                text: '筋トレのように、毎日計算練習をする（1日3問でもOK！）。',
                highlightText: '毎日計算練習',
              },
              {
                id: 'chiyoda-sansu-daily-2',
                text: '「どうしてこの式になるのか？」を考えながら解く。',
              },
              {
                id: 'chiyoda-sansu-daily-3',
                text: '文章を読んで、自分で式を作る練習をする。',
              },
            ],
          },
          {
            title: '💡 問題を解くときのコツ',
            items: [
              {
                id: 'chiyoda-sansu-tip-1',
                text: '円周率（3.14）などのややこしい計算は、式をまとめて一番最後に計算してミスを防ぐ。',
                highlightText: '一番最後に計算',
              },
              {
                id: 'chiyoda-sansu-tip-2',
                text: 'きまりを見つける問題では、最初の(1)番をヒントにしてルールを探す。',
                highlightText: '最初の(1)番をヒント',
              },
            ],
          },
        ],
      },
      {
        id: 'chiyoda-rika',
        title: '📗 理科（りか）',
        rubyTitle: [
          { text: '📗 ' },
          { text: '理科', ruby: 'りか' },
          { text: '（りか）' },
        ],
        doctorTitle: 'ラボ・生体研究指導医',
        doctorAvatar: '🐬',
        themeClass: 'rika',
        subSections: [
          {
            title: '📅 毎日のれんしゅう',
            items: [
              {
                id: 'chiyoda-rika-daily-1',
                text: '4つの分野（物質・エネルギー・生命・地球）をバランスよく復習する。',
              },
              {
                id: 'chiyoda-rika-daily-2',
                text: '教科書に載っている実験の内容と結果をしっかり確認する。',
                highlightText: '実験の内容と結果',
              },
              {
                id: 'chiyoda-rika-daily-3',
                text: '食塩水の濃さなどの割合・計算問題を復習する。',
                highlightText: '割合・計算問題',
              },
            ],
          },
          {
            title: '💡 問題を解くときのコツ',
            items: [
              {
                id: 'chiyoda-rika-tip-1',
                text: 'グラフや表を見るときは、たて軸・よこ軸が何を表しているかを最初に確認する。',
                highlightText: 'たて軸・よこ軸が何を表しているか',
              },
              {
                id: 'chiyoda-rika-tip-2',
                text: '見たことがない長い実験の問題でもあきらめず、問題文に書かれたヒントと知識を組み合わせて考える。',
              },
            ],
          },
        ],
      },
      {
        id: 'chiyoda-shakai',
        title: '📙 社会（しゃかい）',
        rubyTitle: [
          { text: '📙 ' },
          { text: '社会', ruby: 'しゃかい' },
          { text: '（しゃかい）' },
        ],
        doctorTitle: '環境・往診調査指導医',
        doctorAvatar: '🐕',
        themeClass: 'shakai',
        subSections: [
          {
            title: '📅 毎日のれんしゅう',
            items: [
              {
                id: 'chiyoda-shakai-daily-1',
                text: '教科書の音読（声に出して読むこと）をする。',
                highlightText: '教科書の音読（声に出して読むこと）',
              },
              {
                id: 'chiyoda-shakai-daily-2',
                text: '地理：地図帳で気候や地形を確かめ、特産物を調べる。',
              },
              {
                id: 'chiyoda-shakai-daily-3',
                text: '歴史：「なぜその出来事が起きたのか」という背景や理由を意識し、資料集も見る。',
              },
              {
                id: 'chiyoda-shakai-daily-4',
                text: '公民：ニュースで日本や世界の新しい出来事（昨年10月〜今年9月）をチェックする。',
              },
            ],
          },
          {
            title: '💡 問題を解くときのコツ',
            items: [
              {
                id: 'chiyoda-shakai-tip-1',
                text: '一問一答のような基本の言葉を確実に答えられるようにする。',
              },
              {
                id: 'chiyoda-shakai-tip-2',
                text: '並び替え問題は、時代の流れやつながりを整理して解く。',
              },
              {
                id: 'chiyoda-shakai-tip-3',
                text: '書く問題（記述）では、「自分の考え」と「その理由」をセットにして筋道が通るように書く。',
                highlightText: '「自分の考え」と「その理由」',
              },
            ],
          },
        ],
      },
    ],
  },
  meguro: {
    schoolId: 'meguro',
    schoolName: '多摩大学目黒中学校',
    hospitalName: '🏥 多摩目黒どうぶつ医療センター',
    headerTitle: '🚀 合格（ごうかく）大作戦！算数＆テスト攻略リスト 🚀',
    headerSubTitle: '多摩目黒どうぶつ医療センター（多摩大目黒中学校）指導医直伝！基本をバッチリかためて確実に合格を引き寄せよう！',
    headerGradient: 'linear-gradient(135deg, #0984e3, #00cec9)',
    footerMessage: '基礎・基本の積み重ねが合格への一番の近道！自信をもってがんばろう！✨',
    sections: [
      {
        id: 'meguro-warn',
        title: '🔥 テスト本番＆ふだんの絶対ルール',
        rubyTitle: [
          { text: '🔥 テスト本番＆ふだんの' },
          { text: '絶対', ruby: 'ぜったい' },
          { text: 'ルール' },
        ],
        doctorTitle: '救急救命・緊急オペ統括指導医',
        doctorAvatar: '🦅',
        themeClass: 'card-warn',
        directItems: [
          {
            id: 'meguro-rule-1',
            text: '解答用紙の書きうつしミス（欄のズレ）を絶対にしない！途中式を書く場所はなく「答えだけ」なので、見直しを徹底する。',
            highlightText: '解答用紙の書きうつしミス（欄のズレ）',
            badge: { text: '超重要', type: 'warn' },
          },
          {
            id: 'meguro-rule-2',
            text: '大問1（計算）と大問2（一行問題）だけで100点中65点分！まずはこの基本問題を落とさないことが一番大事。',
            highlightText: '大問1（計算）と大問2（一行問題）だけで100点中65点分！',
            badge: { text: '配点戦略', type: 'priority' },
          },
          {
            id: 'meguro-rule-3',
            text: 'みんなが解けない超むずかしい問題ができなくても、落ちこまなくて大丈夫！「自分が取れる問題」を確実に正解しよう。',
            highlightText: '「自分が取れる問題」',
            badge: { text: 'メンタル', type: 'bonus' },
          },
        ],
      },
      {
        id: 'meguro-sansu',
        title: '📐 算数：問題ごとのやることリスト',
        rubyTitle: [
          { text: '📐 ' },
          { text: '算数', ruby: 'さんすう' },
          { text: '：問題ごとのやることリスト' },
        ],
        doctorTitle: '臨床検査・精密オペ指導医',
        doctorAvatar: '🐺',
        themeClass: 'sansu',
        subSections: [
          {
            title: '① 計算問題（大問1）',
            items: [
              {
                id: 'meguro-sansu-q1-1',
                text: '四則計算の順番、分数・小数が混ざった計算を毎日練習する。',
                badge: { text: '最優先', type: 'priority' },
              },
              {
                id: 'meguro-sansu-q1-2',
                text: '単位の変換（km・cm・mm、時間、面積のa・ha、体積のL・dLなど）を完璧にする。',
                highlightText: '単位の変換',
              },
              {
                id: 'meguro-sansu-q1-3',
                text: '工夫して計算する問題（同じ数でくくる計算や、先に約分する分数のかけ算）に慣れておく。',
                highlightText: '先に約分する',
              },
            ],
          },
          {
            title: '② 一行文章題（大問2）',
            items: [
              {
                id: 'meguro-sansu-q2-1',
                text: '毎年ほぼ必ず出る「食塩水（濃さ）」と「規則性」を重点的に練習する（パターンが決まっているので得点源にしやすい！）。',
                highlightText: '「食塩水（濃さ）」と「規則性」',
                badge: { text: '最優先', type: 'priority' },
              },
              {
                id: 'meguro-sansu-q2-2',
                text: 'つるかめ算・分配算・仕事算・流水算・図形（角度・面積・長さ）の基本問題を解けるようにする。',
                badge: { text: '合格へ前進', type: 'bonus' },
              },
            ],
          },
          {
            title: '③ グラフ・図形（大問3・4）',
            items: [
              {
                id: 'meguro-sansu-q3-1',
                text: '長い文章やグラフの中から、「必要な数字や情報だけ」を抜き出す練習をする。',
                highlightText: '「必要な数字や情報だけ」を抜き出す',
              },
              {
                id: 'meguro-sansu-q3-2',
                text: '抜き出した情報をもとに整理して、答えにつなげる手順を意識する。',
              },
            ],
          },
          {
            title: '④ 会話文の問題（大問5）',
            items: [
              {
                id: 'meguro-sansu-q5-1',
                text: '身近なテーマの長い会話文から、「いらない話」を読み飛ばして大事なルールだけ見つける練習をする。',
                highlightText: '「いらない話」を読み飛ばして大事なルールだけ見つける',
              },
              {
                id: 'meguro-sansu-q5-2',
                text: '大問5の(1)は半分の人が正解できる問題なので、あきらめずに必ずチャレンジする！',
                badge: { text: '得点チャンス', type: 'bonus' },
              },
            ],
          },
        ],
      },
    ],
  },
};
