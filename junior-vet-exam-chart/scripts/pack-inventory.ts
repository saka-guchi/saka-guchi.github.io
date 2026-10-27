import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

const subject = getArg('--subject') || 'rika';
const rootDir = process.cwd();
const inventoryDir = path.join(rootDir, 'content-private', 'inventory');

if (!fs.existsSync(inventoryDir)) {
  fs.mkdirSync(inventoryDir, { recursive: true });
}

const csvFilePath = path.join(inventoryDir, `${subject}.csv`);

// バリデーション用スキーマ
const rowSchema = z.object({
  subject: z.enum(['rika', 'shakai', 'sansu']),
  page: z.number().int().positive(),
  section: z.string().min(1),
  question: z.string().min(1),
  part: z.string(), // 空文字可
  answerSlotLabel: z.string().min(1),
  answerText: z.string().min(1),
  answerType: z.enum(['choice', 'multi_choice', 'term', 'numeric', 'order', 'open']),
  status: z.enum(['ok', 'needs_review']),
  note: z.string(),
});

type InventoryRow = z.infer<typeof rowSchema>;

// 理科の基準データ（2024年度 安田学園中学校 理科）
const rikaData: InventoryRow[] = [
  // 大問1
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '1',
    part: 'ア',
    answerSlotLabel: '1-問1-ア',
    answerText: '主根',
    answerType: 'term',
    status: 'ok',
    note: '図1 植物Aの根の主根',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '1',
    part: 'イ',
    answerSlotLabel: '1-問1-イ',
    answerText: '側根',
    answerType: 'term',
    status: 'ok',
    note: '図1 植物Aの根の側根',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '1',
    part: 'ウ',
    answerSlotLabel: '1-問1-ウ',
    answerText: '師管',
    answerType: 'term',
    status: 'ok',
    note: '図2 茎の外側の維管束内組織',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '1',
    part: 'エ',
    answerSlotLabel: '1-問1-エ',
    answerText: '道管',
    answerType: 'term',
    status: 'ok',
    note: '図2 茎の内側の維管束内組織',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '1',
    part: 'オ',
    answerSlotLabel: '1-問1-オ',
    answerText: '維管束',
    answerType: 'term',
    status: 'ok',
    note: 'ウとエが束になったもの',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '2',
    part: '',
    answerSlotLabel: '1-問2',
    answerText: '葉脈が平行に配置されている。（または 平行脈をもつ。葉脈が根元から先端へまっすぐ伸びている。）',
    answerType: 'open',
    status: 'ok',
    note: '植物B（単子葉類）の葉脈の説明',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '3',
    part: '',
    answerSlotLabel: '1-問3',
    answerText: '①、③',
    answerType: 'multi_choice',
    status: 'ok',
    note: '双子葉類を選択（①ホウセンカ、③アブラナ）',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '4',
    part: 'ウ',
    answerSlotLabel: '1-問4-ウ',
    answerText: '葉の光合成で合成したデンプン（糖・栄養分）を全身へ運ぶ働き。',
    answerType: 'open',
    status: 'ok',
    note: '師管のはたらき説明',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '4',
    part: 'エ',
    answerSlotLabel: '1-問4-エ',
    answerText: '根から吸収した水分や栄養分を全身へ運ぶ働き。',
    answerType: 'open',
    status: 'ok',
    note: '道管のはたらき説明',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '5',
    part: '',
    answerSlotLabel: '1-問5',
    answerText: '根毛',
    answerType: 'term',
    status: 'ok',
    note: '根の表面の毛状構造',
  },
  {
    subject: 'rika',
    page: 2,
    section: '1',
    question: '6',
    part: '',
    answerSlotLabel: '1-問6',
    answerText: '根の表面積を大きくすることで、水分や養分を効率よく吸収できる。',
    answerType: 'open',
    status: 'ok',
    note: '根毛の利点',
  },

  // 大問2
  {
    subject: 'rika',
    page: 3,
    section: '2',
    question: '1',
    part: '',
    answerSlotLabel: '2-問1',
    answerText: 'イ、エ',
    answerType: 'multi_choice',
    status: 'ok',
    note: '二酸化炭素の性質（イ:石灰水白濁、エ:固体はドライアイス）',
  },
  {
    subject: 'rika',
    page: 3,
    section: '2',
    question: '2',
    part: '',
    answerSlotLabel: '2-問2',
    answerText: 'ア',
    answerType: 'choice',
    status: 'ok',
    note: '二酸化炭素の発生法（うすい塩酸に卵の殻）',
  },
  {
    subject: 'rika',
    page: 3,
    section: '2',
    question: '3',
    part: '',
    answerSlotLabel: '2-問3',
    answerText: '温室効果ガス',
    answerType: 'term',
    status: 'ok',
    note: '地球温暖化の原因気体',
  },
  {
    subject: 'rika',
    page: 3,
    section: '2',
    question: '4',
    part: '',
    answerSlotLabel: '2-問4',
    answerText: 'ウ',
    answerType: 'choice',
    status: 'ok',
    note: '温室効果ガス（メタン）',
  },
  {
    subject: 'rika',
    page: 4,
    section: '2',
    question: '5',
    part: '',
    answerSlotLabel: '2-問5',
    answerText: '二酸化炭素（の濃度）が増えたため。',
    answerType: 'open',
    status: 'ok',
    note: '光合成量増加の理由',
  },
  {
    subject: 'rika',
    page: 4,
    section: '2',
    question: '6',
    part: '',
    answerSlotLabel: '2-問6',
    answerText: '50',
    answerType: 'numeric',
    status: 'ok',
    note: '1年間に大気中で増加するCO2量（単位: 億トン。109-(34+25)=50）',
  },
  {
    subject: 'rika',
    page: 4,
    section: '2',
    question: '7',
    part: '',
    answerSlotLabel: '2-問7',
    answerText: 'オ',
    answerType: 'choice',
    status: 'ok',
    note: '海洋酸性化（海水が現在よりも酸性になる）',
  },

  // 大問3
  {
    subject: 'rika',
    page: 5,
    section: '3',
    question: '1',
    part: '',
    answerSlotLabel: '3-問1',
    answerText: '1000',
    answerType: 'numeric',
    status: 'ok',
    note: '浮力の大きさ（単位: g。体積1000cm3分の水の重さ）',
  },
  {
    subject: 'rika',
    page: 5,
    section: '3',
    question: '2',
    part: '',
    answerSlotLabel: '3-問2',
    answerText: '①、④',
    answerType: 'multi_choice',
    status: 'ok',
    note: '図2についての記述',
  },
  {
    subject: 'rika',
    page: 6,
    section: '3',
    question: '3',
    part: '番号',
    answerSlotLabel: '3-問3-番号',
    answerText: '②',
    answerType: 'choice',
    status: 'ok',
    note: '間違っている下線部番号',
  },
  {
    subject: 'rika',
    page: 6,
    section: '3',
    question: '3',
    part: '文章',
    answerSlotLabel: '3-問3-文章',
    answerText: '20℃ 以下',
    answerType: 'open',
    status: 'ok',
    note: '正しい文章への訂正',
  },
];

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(rows: InventoryRow[]) {
  const header = ['subject', 'page', 'section', 'question', 'part', 'answerSlotLabel', 'answerText', 'answerType', 'status', 'note'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const validated = rowSchema.parse(row);
    const line = [
      escapeCsvField(validated.subject),
      escapeCsvField(validated.page),
      escapeCsvField(validated.section),
      escapeCsvField(validated.question),
      escapeCsvField(validated.part),
      escapeCsvField(validated.answerSlotLabel),
      escapeCsvField(validated.answerText),
      escapeCsvField(validated.answerType),
      escapeCsvField(validated.status),
      escapeCsvField(validated.note),
    ].join(',');
    lines.push(line);
  }
  fs.writeFileSync(csvFilePath, lines.join('\n'), 'utf-8');
  console.log(`Wrote ${rows.length} rows to ${csvFilePath}`);
}

function run() {
  if (subject === 'rika') {
    writeCsv(rikaData);
  } else {
    console.error(`Subject ${subject} not yet implemented.`);
    process.exit(1);
  }
}

run();

