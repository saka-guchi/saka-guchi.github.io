import { ALL_PROGRESS_SKILLS } from './all-skills';

/**
 * 過去問の設問ID（slot.id）と症例スタディの単元ID（skillId）の確実な紐づけ辞書
 * 既存の questions.json の primarySkillId のうち、ALL_PROGRESS_SKILLS の ID と完全一致する28設問のみを定義する。
 * （推測や部分一致によるマッピングは含めない）
 */
export const EXAM_SLOT_SKILL_MAP: Readonly<Record<string, string>> = {
  // 2024年度 理科（21問）
  'rika-2024-01-01-a': 'skill-rika-plant-dicot-monocot',
  'rika-2024-01-01-b': 'skill-rika-plant-dicot-monocot',
  'rika-2024-01-01-c': 'skill-rika-plant-vascular',
  'rika-2024-01-01-d': 'skill-rika-plant-vascular',
  'rika-2024-01-01-e': 'skill-rika-plant-vascular',
  'rika-2024-01-02': 'skill-rika-plant-dicot-monocot',
  'rika-2024-01-03': 'skill-rika-plant-dicot-monocot',
  'rika-2024-01-04-c': 'skill-rika-plant-vascular',
  'rika-2024-01-04-d': 'skill-rika-plant-vascular',
  'rika-2024-01-05': 'skill-rika-plant-root-hair',
  'rika-2024-01-06': 'skill-rika-plant-root-hair',
  'rika-2024-02-01': 'skill-rika-gas-co2',
  'rika-2024-02-02': 'skill-rika-gas-co2',
  'rika-2024-02-03': 'skill-rika-env-greenhouse',
  'rika-2024-02-04': 'skill-rika-env-greenhouse',
  'rika-2024-02-05': 'skill-rika-env-greenhouse',
  'rika-2024-02-06': 'skill-rika-env-ocean-acidification',
  'rika-2024-02-07': 'skill-rika-env-ocean-acidification',
  'rika-2024-03-01': 'skill-rika-physics-buoyancy-principle',
  'rika-2024-03-02': 'skill-rika-physics-density-floating',
  'rika-2024-03-03-text': 'skill-rika-physics-galileo-thermometer',

  // 2024年度 算数（7問）
  'sansu-2024-01-01': 'skill-sansu-calc-order',
  'sansu-2024-01-02': 'skill-sansu-fraction-calc',
  'sansu-2024-01-03': 'skill-sansu-geom-area-diff',
  'sansu-2024-01-04': 'skill-sansu-consecutive-integers',
  'sansu-2024-01-05': 'skill-sansu-tsurukame-elimination',
  'sansu-2024-01-06': 'skill-sansu-triangle-inequality',
  'sansu-2024-01-10': 'skill-sansu-newton-pump',
};

const validSkillIds = new Set(ALL_PROGRESS_SKILLS.map((s) => s.id));

/**
 * 設問IDから対応する単元IDを解決する（辞書にない、またはALL_PROGRESS_SKILLSに存在しない場合は null）
 */
export function resolveSlotSkillId(
  slotId: string,
  skillMap: Readonly<Record<string, string>> = EXAM_SLOT_SKILL_MAP
): string | null {
  if (!slotId || typeof slotId !== 'string') return null;
  const mappedId = skillMap[slotId];
  if (!mappedId) return null;
  return validSkillIds.has(mappedId) ? mappedId : null;
}

