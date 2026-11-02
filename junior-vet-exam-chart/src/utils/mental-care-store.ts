/**
 * こころの相談室（メンタルケア）の永続化管理ユーティリティ
 */
import { INITIAL_SORTING_CARDS, COPING_RECIPES, PHILOSOPHY_TOPICS } from '../data/mental-care-data';

const STORAGE_KEY_SAVED_COPINGS = 'junior_vet_mental_saved_copings';
const STORAGE_KEY_CUSTOM_SORT_CARDS = 'junior_vet_mental_custom_sort_cards';
const STORAGE_KEY_COMPLETED_TOPICS = 'junior_vet_mental_completed_topics';
const STORAGE_KEY_TODAY_CHECKIN = 'junior_vet_mental_today_checkin';
const STORAGE_KEY_PARENT_CHECKLIST = 'junior_vet_parent_action_checklist';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'storm';

export interface TodayCheckin {
  date: string; // YYYY-MM-DD
  weather: WeatherType;
  weatherLabel: string;
  memo?: string;
}

export function getSavedCopingIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_COPINGS);
    if (!raw) return ['cope-1', 'cope-3', 'cope-12']; // 初期おすすめお守り
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return ['cope-1', 'cope-3', 'cope-12'];
  }
}

export function toggleSavedCopingId(id: string): string[] {
  try {
    const current = getSavedCopingIds();
    const next = current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id];
    localStorage.setItem(STORAGE_KEY_SAVED_COPINGS, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export interface CustomSortingCard {
  id: string;
  text: string;
  category: 'self' | 'others';
  createdAt: string;
}

export function getCustomSortingCards(): CustomSortingCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SORT_CARDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomSortingCard(card: Omit<CustomSortingCard, 'id' | 'createdAt'>): CustomSortingCard[] {
  try {
    const current = getCustomSortingCards();
    const newCard: CustomSortingCard = {
      ...card,
      id: `custom-sort-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const next = [newCard, ...current];
    localStorage.setItem(STORAGE_KEY_CUSTOM_SORT_CARDS, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function deleteCustomSortingCard(id: string): CustomSortingCard[] {
  try {
    const current = getCustomSortingCards();
    const next = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_SORT_CARDS, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function getCompletedTopicIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_TOPICS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markTopicCompleted(topicId: string): string[] {
  try {
    const current = getCompletedTopicIds();
    if (!current.includes(topicId)) {
      const next = [...current, topicId];
      localStorage.setItem(STORAGE_KEY_COMPLETED_TOPICS, JSON.stringify(next));
      return next;
    }
    return current;
  } catch {
    return [];
  }
}

export function getTodayCheckin(): TodayCheckin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODAY_CHECKIN);
    if (!raw) {
      // デフォルトは雲（モヤモヤ・ひとやすみ中を想定）
      const today = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()).replace(/\//g, '-');
      return {
        date: today,
        weather: 'cloudy',
        weatherLabel: 'くもり（すこしモヤモヤ・休憩中）',
      };
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveTodayCheckin(checkin: TodayCheckin): void {
  try {
    localStorage.setItem(STORAGE_KEY_TODAY_CHECKIN, JSON.stringify(checkin));
  } catch {
    // ignore
  }
}

// =================================================================
// 親向けアクション処方箋（Parent Action Prescription）
// =================================================================

export interface ParentActionItem {
  id: string;
  category: 'phrase' | 'care' | 'ng';
  title: string;
  detail: string;
  isDone?: boolean;
}

export interface ParentMentalPrescription {
  childWeather: TodayCheckin;
  statusSummary: string;
  childSignalHint: string;
  recommendedPhrases: ParentActionItem[];
  homeCareActions: ParentActionItem[];
  ngWordsToAvoid: ParentActionItem[];
  savedCopingTitles: string[];
  completedTopicTitles: string[];
}

export function getParentActionChecklist(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARENT_CHECKLIST);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function toggleParentActionCheck(actionId: string): Record<string, boolean> {
  try {
    const current = getParentActionChecklist();
    const next = { ...current, [actionId]: !current[actionId] };
    localStorage.setItem(STORAGE_KEY_PARENT_CHECKLIST, JSON.stringify(next));
    return next;
  } catch {
    return {};
  }
}

export function generateParentPrescription(): ParentMentalPrescription {
  const checkin = getTodayCheckin() || {
    date: new Date().toISOString().slice(0, 10),
    weather: 'cloudy',
    weatherLabel: 'くもり（すこしモヤモヤ・休憩中）',
  };

  const savedIds = getSavedCopingIds();
  const savedCopingTitles = COPING_RECIPES.filter(c => savedIds.includes(c.id)).map(c => c.title);

  const completedIds = getCompletedTopicIds();
  const completedTopicTitles = PHILOSOPHY_TOPICS.filter(t => completedIds.includes(t.id)).map(t => t.title);

  // 子どもの状態のサインを分析
  const isFavoritismTopicRead = completedIds.includes('topic-favoritism');
  const isAbsenceTopicRead = completedIds.includes('topic-school-absence');
  const isAngerShieldRead = completedIds.includes('topic-anger-shield');
  const isRainOrStorm = checkin.weather === 'rainy' || checkin.weather === 'storm';

  let statusSummary = '今はエネルギーを充電しながら、自分の心を守る作戦を練っている大切なタイミングです。';
  let childSignalHint = '「自分の頑張りや正当性を認めてほしい」「理不尽な大人への違和感を抱えている」サインが見られます。';

  if (isAngerShieldRead) {
    statusSummary = '「怒りの奥にある本当の気持ち（一次感情：悲しさ・寂しさ）」と「ぐるぐる思考（Why）から抜け出す方法」を学びました。';
    childSignalHint = '強がったり怒ったりしている裏で、「悲しかった」「認めてほしかった」というSOSを出しています。怒りを叱らず、奥にある悲しみに寄り添うことが最大の癒やしになります。';
  } else if (isFavoritismTopicRead) {
    statusSummary = '「先生の贔屓や不公平さ」について深く考え、客観的に大人の未熟さと自分の価値を切り分けるレッスンを受けました。';
    childSignalHint = '不公平さへの憤りや、「自分は大切にされていないのではないか」という寂しさが根底にあります。家庭内での絶対的な承認が最高の特効薬です。';
  } else if (isAbsenceTopicRead) {
    statusSummary = '「学校を休んだこと」を緊急ピットイン（給油）として捉え直し、自分を守る勇気を学んでいます。';
    childSignalHint = '休んだことに対する罪悪感や、明日への不安を抱えやすい状態です。「休んで正解だった」という親の肯定が安心感につながります。';
  } else if (isRainOrStorm) {
    statusSummary = '心の中に強い雨や嵐が降っており、刺激に敏感で心が疲れ切っている状態です。';
    childSignalHint = '無理に理由を問い質さず、まずは温かい食事と静かな休息で身体の緊張を解くことが最優先です。';
  }

  // 1. 今すぐかけたい言葉（魔法のフレーズ・アクティブリスニング）
  const recommendedPhrases: ParentActionItem[] = [
    {
      id: 'phrase-1',
      category: 'phrase',
      title: '感情のオウム返し（情緒的共感・リフレクション）',
      detail: '「そっか、先生が男子ばかり贔屓して、すごく嫌だったしモヤモヤしたんだね」（アドバイスせず、子どもの感情の言葉をそのまま鏡のように繰り返す）',
    },
    {
      id: 'phrase-2',
      category: 'phrase',
      title: '怒りの奥にある「一次感情」への声かけ',
      detail: '「怒りたくなるくらい、一生懸命がんばってたんだよね。悲しかったし悔しかったよね。その気持ち、痛いほどわかるよ」',
    },
    {
      id: 'phrase-3',
      category: 'phrase',
      title: '家庭内での絶対的な存在承認（安全基地の保証）',
      detail: '「学校の先生がどう見ているかに関係なく、お母さん/お父さんは〇〇ちゃんが毎日一生懸命やってるの、一番近くでずっと知ってるよ」',
    },
    {
      id: 'phrase-4',
      category: 'phrase',
      title: '休む勇気への肯定と自律性の尊重',
      detail: '「つらいときに『休む』って自分でSOSを出せたの、実はすごく立派な自己管理なんだよ。明日どうするかは、今日ゆっくり休んでから自分で決めていいからね」',
    },
  ];

  // 2. 家庭でできる具体的なケア行動
  const homeCareActions: ParentActionItem[] = [
    {
      id: 'care-1',
      category: 'care',
      title: '温かいココアや好きなスープを一緒に入れて飲む（身体的リセット）',
      detail: '胃腸を温めることで自律神経が副交感神経優位になり、緊張した心と体がほぐれます。',
    },
    {
      id: 'care-2',
      category: 'care',
      title: '夕方まで「学校の話」を一切出さない時間を作る（心理的シェルター）',
      detail: '好きな読書、イラスト、ゲーム、動物の動画など、娘さんが完全に没頭できる「安全基地」を家庭内に確保します。',
    },
    {
      id: 'care-3',
      category: 'care',
      title: '「人と問題を切り離す」サポート（大人の客観視）',
      detail: '娘さんが話し始めたら、「先生が嫌い！」という感情を否定せず、「先生の『誰かを特別扱いする対応』が嫌だったんだね」と人と行動を分離して整理を手伝います。',
    },
    {
      id: 'care-4',
      category: 'care',
      title: '寝る前に「ギュッとハグ」または背中をさする（安心ホルモンの分泌）',
      detail: '皮膚接触によってオキシトシンが分泌され、学校で受けた孤独感や否定感を上書きします。',
    },
  ];

  // 3. 言ってはいけないNGワード（反芻の誘発や否定の根絶）
  const ngWordsToAvoid: ParentActionItem[] = [
    {
      id: 'ng-1',
      category: 'ng',
      title: '❌「なんで学校行きたくないの？理由は？」（Whyの尋問）',
      detail: '「なぜ？」と聞かれると子どもは責められているように感じ、反芻（ぐるぐる思考）に陥ります。聞くときは「どんなことが嫌だったか、話せることだけ教えて？」とWhat/Howで優しく尋ねましょう。',
    },
    {
      id: 'ng-2',
      category: 'ng',
      title: '❌「先生だって大変なんだから理解してあげなさい」（先生の弁護）',
      detail: '子どもの味方であるべき親に先生をかばわれると、子どもは「私のつらさは誰にも理解されない」と強い孤立感を抱きます。大人の事情を子どもに押し付けないことが鉄則です。',
    },
    {
      id: 'ng-3',
      category: 'ng',
      title: '❌「そんなの社会に出たら普通だよ」（悩みの矮小化）',
      detail: '正論ですが、今まさに傷ついている小学生にとっては「絶望」にしかなりません。まずは100%の受容が先です。',
    },
    {
      id: 'ng-4',
      category: 'ng',
      title: '❌「明日はどうするの？行けそう？」（早期の決断迫り）',
      detail: '日中から明日を意識させると、心の回復がストップします。自己決定理論に基づき、明日のことは夜ぐっすり寝てから、または明日の朝に子ども自身に選ばせましょう。',
    },
  ];

  return {
    childWeather: checkin,
    statusSummary,
    childSignalHint,
    recommendedPhrases,
    homeCareActions,
    ngWordsToAvoid,
    savedCopingTitles,
    completedTopicTitles,
  };
}
