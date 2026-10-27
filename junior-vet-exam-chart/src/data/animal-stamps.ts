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
    vetFact: '💡 獣医師プチ知識: ワンちゃんは汗をかけないので、ハァハァと息（パンティング）をして体の熱を逃がすんだよ。',
  },
  {
    id: 'stamp-cat-mike',
    name: 'ミケネコのタマ',
    animal: 'ネコ',
    icon: '🐱',
    patientTitle: 'ゴロゴロのどを鳴らして全快！',
    cheerMessage: '「毛並みがツヤツヤに戻ったよ。やさしい手当てをありがとう！」',
    vetFact: '💡 獣医師プチ知識: ネコちゃんのヒゲはセンサーになっていて、暗いところでも狭い隙間を通れるんだよ。',
  },
  {
    id: 'stamp-rabbit-white',
    name: '白うさぎのミミ',
    animal: 'ウサギ',
    icon: '🐰',
    patientTitle: '元気にピョンピョン！',
    cheerMessage: '「長いお耳をピンと立てて、元気にごはんを食べはじめたよ！」',
    vetFact: '💡 獣医師プチ知識: ウサギの長い耳は、遠くの音を聞くだけでなく、血液の熱を逃がして体温を下げる役割もあるよ。',
  },
  {
    id: 'stamp-hamster-koro',
    name: 'ハムスターのチョコ',
    animal: 'ハムスター',
    icon: '🐹',
    patientTitle: '回し車をグルグル完走！',
    cheerMessage: '「ほっぺにヒマワリの種をいっぱいためて、元気に動き回っているよ！」',
    vetFact: '💡 獣医師プチ知識: ハムスターの歯（切歯）は一生伸び続けるため、硬いものをかじって削る習性があるんだ。',
  },
  {
    id: 'stamp-penguin-pico',
    name: 'ペンギンのピコ',
    animal: 'ペンギン',
    icon: '🐧',
    patientTitle: 'プールでスイスイ泳ぎ！',
    cheerMessage: '「羽のお手入れが終わって、元気いっぱいにジャンプしたよ！」',
    vetFact: '💡 獣医師プチ知識: ペンギンは鳥のなかまだけど空は飛べず、そのぶん水中で素早く泳げるように翼がヒレに進化したよ。',
  },
  {
    id: 'stamp-owl-huku',
    name: 'ふくろうのホー先生',
    animal: 'フクロウ',
    icon: '🦉',
    patientTitle: 'カルテチェック完了！',
    cheerMessage: '「ホーホー！今日のきみの集中力は素晴らしい。立派な獣医さんになれるぞ！」',
    vetFact: '💡 獣医師プチ知識: フクロウの首はなんと左右に約270度も回るんだ。目が正面についているため首がよく回るよ。',
  },
  {
    id: 'stamp-bear-kuma',
    name: 'コグマのモコ',
    animal: 'クマ',
    icon: '🐻',
    patientTitle: 'おいしくハチミツをペロリ！',
    cheerMessage: '「おなかの調子がすっかり良くなって、ぐっすりお昼寝できたよ！」',
    vetFact: '💡 獣医師プチ知識: クマの冬眠中は、体温を少しだけ下げてエネルギーを節約しながら春を待つんだよ。',
  },
  {
    id: 'stamp-dolphin-lulu',
    name: 'イルカのルル',
    animal: 'イルカ',
    icon: '🐬',
    patientTitle: '青い海原へダイブ！',
    cheerMessage: '「頭の呼吸孔から元気よく潮を吹いて、仲間たちと合流できたよ！」',
    vetFact: '💡 獣医師プチ知識: イルカは魚ではなく哺乳類！右脳と左脳を交互に眠らせることで、泳ぎながら呼吸ができるよ。',
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

