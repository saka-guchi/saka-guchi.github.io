export interface AnimalStamp {
  id: string;
  name: string;
  animal: string;
  icon: string;
  patientTitle: string;
  cheerMessage: string;
  vetFact: string; // 獣医プチ豆知識
}

export const ANIMAL_STAMPS: AnimalStamp[] = [
  {
    id: 'stamp-dog-shiba',
    name: 'シバイヌのコロ',
    animal: 'イヌ',
    icon: '🐕',
    patientTitle: '元気いっぱいにかけっこ！',
    cheerMessage: '「しっぽを振って大よろこび！水分補給のカルテがバッチリだったよ！」',
    vetFact: '💡 獣医師プチ知識: ワンちゃんの鼻のシワ（鼻紋）は人間の指紋と全く同じで、世界に1匹として同じ模様がなく個体認証できるよ！さらに緊張すると足の裏の肉球からだけじっとり汗をかくんだ。',
  },
  {
    id: 'stamp-cat-mike',
    name: 'ミケネコのタマ',
    animal: 'ネコ',
    icon: '🐱',
    patientTitle: 'ゴロゴロのどを鳴らして全快！',
    cheerMessage: '「毛並みがツヤツヤに戻ったよ。やさしい手当てをありがとう！」',
    vetFact: '💡 獣医師プチ知識: ネコちゃんは鎖骨が他の骨とつながっておらず筋肉の中に浮いているよ！だから「頭が入る隙間」なら肩幅に関係なく絶対に通り抜けられるんだ。ちなみに甘味を感じる味覚遺伝子がないよ。',
  },
  {
    id: 'stamp-rabbit-white',
    name: '白うさぎのミミ',
    animal: 'ウサギ',
    icon: '🐰',
    patientTitle: '元気にピョンピョン！',
    cheerMessage: '「長いお耳をピンと立てて、元気にごはんを食べはじめたよ！」',
    vetFact: '💡 獣医師プチ知識: ウサギの骨は鳥のように軽くて、体重のわずか7%ほどしかないよ！そのため強いジャンプのキック力に自分の骨が耐えきれず背骨を折ることがあるので、獣医さんは抱っこに一番気をつかうんだ。',
  },
  {
    id: 'stamp-hamster-koro',
    name: 'ハムスターのチョコ',
    animal: 'ハムスター',
    icon: '🐹',
    patientTitle: '回し車をグルグル完走！',
    cheerMessage: '「ほっぺにヒマワリの種をいっぱいためて、元気に動き回っているよ！」',
    vetFact: '💡 獣医師プチ知識: ハムスターの頬袋には唾液腺が一切なく、中は完全にサラサラ！しかも肩甲骨（背中）の近くまで袋が伸びていて、中に空気をパンパンにためて「浮き輪」代わりにして川を泳ぐこともあるよ。',
  },
  {
    id: 'stamp-penguin-pico',
    name: 'ペンギンのピコ',
    animal: 'ペンギン',
    icon: '🐧',
    patientTitle: 'プールでスイスイ泳ぎ！',
    cheerMessage: '「羽のお手入れが終わって、元気いっぱいにジャンプしたよ！」',
    vetFact: '💡 獣医師プチ知識: ペンギンは足が短く見えるけれど、レントゲンで見ると羽毛の中に長い太ももが隠れていて、実は常に「空気イス（スクワット）」の姿勢で立っているよ！海水の塩分は鼻からピュッと噴射して出すんだ。',
  },
  {
    id: 'stamp-owl-huku',
    name: 'ふくろうのホー先生',
    animal: 'フクロウ',
    icon: '🦉',
    patientTitle: 'カルテチェック完了！',
    cheerMessage: '「ホーホー！今日のきみの集中力は素晴らしい。立派な獣医さんになれるぞ！」',
    vetFact: '💡 獣医師プチ知識: フクロウの耳の穴は、左右で高さと大きさがズレて上下についているよ！左右の耳に音が届くコンマ何秒のズレを脳で計算して、雪の下に隠れた獲物のミリ単位の位置を正確に特定できるんだ。',
  },
  {
    id: 'stamp-bear-kuma',
    name: 'コグマのモコ',
    animal: 'クマ',
    icon: '🐻',
    patientTitle: 'おいしくハチミツをペロリ！',
    cheerMessage: '「おなかの調子がすっかり良くなって、ぐっすりお昼寝できたよ！」',
    vetFact: '💡 獣医師プチ知識: クマは冬眠中の数ヶ月間、一度もトイレをしないよ！体内の老廃物（尿素）をアミノ酸に再利用（リサイクル）して筋肉を作り直す驚異の仕組みを持っていて、宇宙飛行士の筋萎縮を防ぐ医療研究でも注目されているんだ。',
  },
  {
    id: 'stamp-dolphin-lulu',
    name: 'イルカのルル',
    animal: 'イルカ',
    icon: '🐬',
    patientTitle: '青い海原へダイブ！',
    cheerMessage: '「頭の呼吸孔から元気よく潮を吹いて、仲間たちと合流できたよ！」',
    vetFact: '💡 獣医師プチ知識: イルカの皮膚は超高速で新陳代謝していて、なんと「約2時間」ごとに全身の古い皮膚が脱皮して生まれ変わるよ！これによって水の摩擦抵抗をほぼゼロにして時速40km以上で泳げるんだ。',
  },
  {
    id: 'stamp-bee-maya',
    name: 'ミツバチのマヤ',
    animal: 'ミツバチ',
    icon: '🐝',
    patientTitle: '元気に羽ばたいて蜜集め！',
    cheerMessage: '「八の字ダンスで仲間にお知らせ！日齢分業のカルテのおかげで巣は大繁栄だよ！」',
    vetFact: '💡 獣医師プチ知識: ミツバチは太陽の位置を基準にした「8の字ダンス」を踊ることで、花畑の正確な方角と距離（角度と腹部の震わせ時間）を仲間にミリ単位で伝える驚異の言語能力を持っているよ！',
  },
  {
    id: 'stamp-squirrel-puru',
    name: 'リスのプルースト',
    animal: 'リス',
    icon: '🐿️',
    patientTitle: 'ドングリをカリッと完食！',
    cheerMessage: '「定比例の法則カルテで実験大成功！木の実の貯食場所もバッチリ覚えているよ！」',
    vetFact: '💡 獣医師プチ知識: リスの前歯（切歯）は一生伸び続けるため、硬いクルミの殻などをかじって削らないと口が閉じなくなってしまうよ！秋に地面に隠したドングリの約3割は忘れられ、それが立派な森の木に育つんだ。',
  },
  {
    id: 'stamp-turtle-totto',
    name: 'ウミガメのトット',
    animal: 'ウミガメ',
    icon: '🐢',
    patientTitle: '大海原をゆうゆう遊泳！',
    cheerMessage: '「隠岐諸島や日本海をスイスイ旅して、きれいな砂浜に産卵に戻ってきたよ！」',
    vetFact: '💡 獣医師プチ知識: ウミガメが産卵のときに流す「涙」は悲しいからではなく、目の奥にある「塩類腺」という器官から海水の余分な塩分を濃厚な液体として外へ排出している生理現象なんだよ！',
  },
  {
    id: 'stamp-raccoon-ponta',
    name: 'タヌキのポン太',
    animal: 'タヌキ',
    icon: '🦝',
    patientTitle: 'ふかふかの冬毛で元気満点！',
    cheerMessage: '「防災都市カルテで街づくり完了！みんなで安心して暮らせる森になったよ！」',
    vetFact: '💡 獣医師プチ知識: タヌキは驚くと失神して動かなくなる「擬死（たぬき寝入り）」を起こすよ！これは嘘をついているのではなく、極度の恐怖で脳内伝達物質が過剰に出て一時的に仮死状態になる自衛反応なんだ。',
  },
  {
    id: 'stamp-swallow-tsubasa',
    name: 'ツバメのツバサ',
    animal: 'ツバメ',
    icon: '🕊️',
    patientTitle: '大空を軽やかに飛翔！',
    cheerMessage: '「地域交通ナビゲーターとして出発！南の島から数千キロを迷わず帰ってきたよ！」',
    vetFact: '💡 獣医師プチ知識: ツバメの心臓は1分間に600回以上も高速で鼓動しているよ！地球の地磁気を感じる磁気コンパス受容体を体内に持ち、東南アジアから数千キロ旅して毎年同じ軒先の巣に戻ってくるんだ。',
  },
];

const STAMP_STORAGE_KEY = 'junior_vet_earned_stamps';

export function getEarnedStampIds(): string[] {
  try {
    const raw = localStorage.getItem(STAMP_STORAGE_KEY);
    if (!raw) return ['stamp-dog-shiba']; // 初期状態で柴犬を所持
    return JSON.parse(raw);
  } catch {
    return ['stamp-dog-shiba'];
  }
}

export function earnStamp(stampId: string): void {
  try {
    const current = getEarnedStampIds();
    if (!current.includes(stampId)) {
      current.push(stampId);
      localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Failed to save earned stamp', e);
  }
}

export function awardDailyStudyStamp(): AnimalStamp {
  const current = getEarnedStampIds();
  const unearned = ANIMAL_STAMPS.filter(s => !current.includes(s.id));
  
  // 未獲得があればその中から1つ、全部集めていたらランダムに選定
  const target = unearned.length > 0 
    ? unearned[0] 
    : ANIMAL_STAMPS[Math.floor(Math.random() * ANIMAL_STAMPS.length)];
  
  earnStamp(target.id);
  return target;
}

