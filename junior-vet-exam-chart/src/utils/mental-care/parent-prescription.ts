/**
 * 保護者向け声かけ処方箋・見守りヒント (parent-prescription)
 * 
 * 【重要規約】
 * - private なデータ（自由記述メモ、話題名、お守り名）は一切参照しない。
 * - shared なデータ（天気記号、お子さんからのお願い、大分類集計）のみからルールベースで生成。
 * - 断定表現（「絶望になります」「鉄則です」等）や専門用語（迷走神経、オキシトシン、一次感情等）を完全排除。
 * - お子さんを「娘さん/息子さん」ではなく「お子さん」で統一。
 */

import { WeatherType, ParentRequestType } from './types';

export interface ParentAdviceItem {
  id: string;
  phrase: string;
  situation: string;
  intent: string;
  title: string;
  detail: string;
}

export interface ParentCareAction {
  id: string;
  title: string;
  desc: string;
  detail: string;
}

export interface ParentGuidance {
  weatherLabel: string;
  statusSummary: string;
  recommendedPhrases: ParentAdviceItem[];
  careActions: ParentCareAction[];
  avoidPhrases: string[];
  expertConsultationSignals: string[];
}

export function generateParentGuidance(
  weather: WeatherType | null,
  request?: ParentRequestType
): ParentGuidance {
  // 1. お願いがある場合の優先考慮
  let requestNotice = '';
  if (request === 'listen') {
    requestNotice = 'お子さんから「話を聞いてほしい」というサインが届いています。アドバイスより、まず「うん、そうなんだね」と聴く時間を大切にしてみてください。';
  } else if (request === 'quiet') {
    requestNotice = 'お子さんから「少しそっとしておいてほしい」というサインが届いています。静かに休める環境を作り、遠くから温かく見守ってあげてください。';
  } else if (request === 'refresh') {
    requestNotice = 'お子さんから「いっしょに気分転換したい」というサインが届いています。美味しいおやつや散歩など、勉強から離れる時間を共有してみてください。';
  }

  // 2. 天気ごとのヒント
  switch (weather) {
    case 'storm':
      return {
        weatherLabel: 'あらし（限界・とてもつらいサイン）',
        statusSummary: requestNotice || '心も体もエネルギーが大きく減っている状態かもしれません。いまは勉強の成果を求めるより、安全と休息を最優先にしてあげてください。',
        recommendedPhrases: [
          {
            id: 'storm-1',
            phrase: '「いま一番つらいことは何かな？ 言えることだけでいいよ」',
            situation: 'お子さんが落ち込んでいるとき',
            intent: 'すべてを話さなくても大丈夫という安心感を与えます。',
            title: '安心感を与える声かけ',
            detail: '「いま一番つらいことは何かな？ 言えることだけでいいよ」（すべて話さなくても大丈夫と伝えます）',
          },
          {
            id: 'storm-2',
            phrase: '「今日はもうテキストを閉じて、温かいお風呂に入って寝よう」',
            situation: '勉強が進まず焦っているとき',
            intent: '親から休む許可を出すことで、罪悪感を軽くします。',
            title: '休息を促す声かけ',
            detail: '「今日はもうテキストを閉じて、温かいお風呂に入って寝よう」（休む許可を出して安心させます）',
          },
        ],
        careActions: [
          {
            id: 'care-1',
            title: '温かい食事と早めの就寝環境を整える',
            desc: '睡眠不足は気持ちを不安定にする大きな要因です。何より睡眠時間を確保してあげてください。',
            detail: '睡眠不足は気持ちを不安定にする大きな要因です。何より睡眠時間を確保してあげてください。',
          },
          {
            id: 'care-2',
            title: '「味方だよ」と短い言葉やハグで伝える',
            desc: '結果がどうあれ、あなたの存在をまるごと肯定していることを伝えます。',
            detail: '結果がどうあれ、あなたの存在をまるごと肯定していることを伝えます。',
          },
        ],
        avoidPhrases: [
          '「みんな同じようにつらいんだから我慢しなさい」（孤立感を深めてしまいます）',
          '「そんなことで本番大丈夫なの？」（焦りと不安を煽ってしまいます）',
          '「どうしてあんな点数取ったの？」（自分を責めて口を閉ざしてしまいます）',
        ],
        expertConsultationSignals: [
          '睡眠（眠れない、夜中に何度も起きる）や食欲の極端な低下が数日続く',
          '「学校や塾に行きたくない」と激しく拒絶する状態が続く',
          '何を見ても笑わない、以前好きだったことにも無反応になる',
          'あらしのサインが1週間以上継続している',
        ],
      };

    case 'rainy':
      return {
        weatherLabel: 'あめ（つらい・心が雨降り）',
        statusSummary: requestNotice || '模試の結果や塾での出来事で、自信を少し失っている時期かもしれません。「頑張っていること」そのものを認めてあげてください。',
        recommendedPhrases: [
          {
            id: 'rain-1',
            phrase: '「悔しいのは、それだけ真剣に努力してきた証拠だね」',
            situation: 'テスト結果を見て落ち込んでいるとき',
            intent: '結果ではなく、これまでの努力の姿勢を肯定します。',
            title: '悔しさに寄り添う声かけ',
            detail: '「悔しいのは、それだけ真剣に努力してきた証拠だね」（努力の姿勢そのものを肯定します）',
          },
          {
            id: 'rain-2',
            phrase: '「今日できた問題、どれだったか教えて？」',
            situation: '失点ばかりに目がいっているとき',
            intent: 'できた部分に目を向けさせ、自己肯定感を回復させます。',
            title: 'できた部分を見つける声かけ',
            detail: '「今日できた問題、どれだったか教えて？」（失点ではなく前進に光を当てます）',
          },
        ],
        careActions: [
          {
            id: 'care-1',
            title: '間違えた問題ではなく「解き直し」を褒める',
            desc: '間違いは宝物。解き直しに向き合った勇気を讃えてあげてください。',
            detail: '間違いは宝物。解き直しに向き合った勇気を讃えてあげてください。',
          },
          {
            id: 'care-2',
            title: '好きなおやつを用意して、勉強以外の雑談をする',
            desc: '受験の話から完全に離れる時間を意図的に作ります。',
            detail: '受験の話から完全に離れる時間を意図的に作ります。',
          },
        ],
        avoidPhrases: [
          '「あの子はあんなに伸びているのに」（他人との比較は自信を奪います）',
          '「もっと早くからやっていればよかったのに」（過去を責めても前には進めません）',
        ],
        expertConsultationSignals: [
          '朝起きられない、頭痛や腹痛を毎朝訴える',
          '小さなことで激しく泣き出したり、部屋に閉じこもる',
        ],
      };

    case 'cloudy':
      return {
        weatherLabel: 'くもり（ちょっとモヤモヤ・考え中）',
        statusSummary: requestNotice || '塾の席順や友だちとの関係、宿題の進み具合などで少しモヤモヤしている状態かもしれません。焦らず見守りましょう。',
        recommendedPhrases: [
          {
            id: 'cloud-1',
            phrase: '「何か手伝えることがあれば、いつでも言ってね」',
            situation: '一人で悩んでいそうなとき',
            intent: 'いつでも頼れる安心基地があることを伝えます。',
            title: 'いつでも味方であることを伝える声かけ',
            detail: '「何か手伝えることがあれば、いつでも言ってね」（頼れる安心基地の存在を伝えます）',
          },
          {
            id: 'cloud-2',
            phrase: '「今日のスケジュール、何時から始めるか決めたら教えて」',
            situation: 'やる気がなかなか起きないとき',
            intent: '自分で決める余白（自己決定）を持たせます。',
            title: '自己決定を促す声かけ',
            detail: '「今日のスケジュール、何時から始めるか決めたら教えて」（自分で決める余白を尊重します）',
          },
        ],
        careActions: [
          {
            id: 'care-1',
            title: '親からあれこれ口出しせず、少し待ってみる',
            desc: '自分で立て直す力を信じて、少し距離を置いて見守ります。',
            detail: '自分で立て直す力を信じて、少し距離を置いて見守ります。',
          },
        ],
        avoidPhrases: [
          '「早くしなさい！ 時間がないよ！」（指示命令はやる気を失わせます）',
        ],
        expertConsultationSignals: [
          '元気がなく口数が少ない状態が2週間以上続く',
        ],
      };

    case 'sunny':
    default:
      return {
        weatherLabel: weather === 'sunny' ? 'はれ（前向き・調子が良い状態）' : '記録なし（使わなかった日、または伝えない日）',
        statusSummary: requestNotice || (weather === 'sunny'
          ? '良いリズムで学習に向き合えている状態です。いまのペースを優しく見守りましょう。'
          : '記録がない日は、「アプリを使わなかった日」または「今日はお子さんが伝えないことを選んだ日」です。どちらの場合も、無理に聞き出さず静かに見守りましょう。'),
        recommendedPhrases: [
          {
            id: 'sun-1',
            phrase: '「最近、集中して取り組めていて頼もしいね！」',
            situation: '良い調子で進んでいるとき',
            intent: '前向きな努力のプロセスを認めます。',
            title: 'プロセスを認める声かけ',
            detail: '「最近、集中して取り組めていて頼もしいね！」（結果ではなく集中している姿を承認します）',
          },
        ],
        careActions: [
          {
            id: 'care-1',
            title: '健康的なリズムを一緒にキープする',
            desc: '睡眠と食事の基本生活リズムを大切に整えましょう。',
            detail: '睡眠と食事の基本生活リズムを大切に整えましょう。',
          },
        ],
        avoidPhrases: [
          '「この調子ならもっと上の学校も狙えるよ！」（過度な期待はプレッシャーになります）',
        ],
        expertConsultationSignals: [
          '急激な様子の変化や、睡眠・食欲の極端な乱れがある場合',
        ],
      };
  }
}
