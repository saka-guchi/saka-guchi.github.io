import { describe, it, expect } from 'vitest';
import { selectNextStepRecommendation } from '../../src/utils/exam-review-helper';
import { EXAM_SLOT_SKILL_MAP, resolveSlotSkillId } from '../../src/data/exam-slot-skill-map';
import type { MasteryStage } from '../../src/types';

describe('つぎの一歩 選定ユーティリティ (selectNextStepRecommendation & resolveSlotSkillId)', () => {
  it('1. 辞書にないIDや不正なIDが来てもエラーにならず null を返す', () => {
    expect(resolveSlotSkillId('unknown-slot-id')).toBeNull();
    expect(resolveSlotSkillId('')).toBeNull();
    expect(resolveSlotSkillId('rika-2024-03-03-num')).toBeNull();
    // 辞書自体に ALL_PROGRESS_SKILLS に存在しないスキルIDが入っていた場合も安全に null
    expect(
      resolveSlotSkillId('custom-slot', { 'custom-slot': 'skill-non-existent-id' })
    ).toBeNull();

    expect(selectNextStepRecommendation([])).toBeNull();
  });

  it('2. 単元の選び方: (1)「もう少し」の件数が多い単元 → (2)レベルが低い単元 → (3)記憶キープ度が低い単元 → (4)出現順', () => {
    const stageMap: Record<string, MasteryStage> = {
      'skill-rika-plant-dicot-monocot': 'M2',
      'skill-rika-plant-vascular': 'M2',
      'skill-rika-gas-co2': 'M1',
      'skill-rika-env-greenhouse': 'M2',
    };
    const retentionMap: Record<string, number> = {
      'skill-rika-plant-dicot-monocot': 80,
      'skill-rika-plant-vascular': 40,
      'skill-rika-gas-co2': 90,
      'skill-rika-env-greenhouse': 40,
    };

    const opts = {
      skillMap: EXAM_SLOT_SKILL_MAP,
      getStageFn: (id: string) => stageMap[id] ?? 'M2',
      getRetentionFn: (id: string) => retentionMap[id] ?? 0,
    };

    // (1) 件数が多い単元が優先される（plant-dicot-monocot: 2問 vs gas-co2: 1問）
    const resByCount = selectNextStepRecommendation(
      [
        { slotId: 'rika-2024-02-01', subject: 'rika' }, // gas-co2 (M1, 1問)
        { slotId: 'rika-2024-01-01-a', subject: 'rika' }, // plant-dicot-monocot (M2, 1問目)
        { slotId: 'rika-2024-01-01-b', subject: 'rika' }, // plant-dicot-monocot (M2, 2問目)
      ],
      opts
    );
    expect(resByCount?.kind).toBe('skill');
    if (resByCount?.kind === 'skill') {
      expect(resByCount.skillId).toBe('skill-rika-plant-dicot-monocot');
      expect(resByCount.needsWorkCount).toBe(2);
      expect(resByCount.subText).toBe('もう少しだった問題:2問');
    }

    // (2) 件数が同数なら、現在のレベルが低い単元が優先される（gas-co2: M1 vs plant-dicot-monocot: M2）
    const resByLevel = selectNextStepRecommendation(
      [
        { slotId: 'rika-2024-01-01-a', subject: 'rika' }, // plant-dicot-monocot (M2)
        { slotId: 'rika-2024-02-01', subject: 'rika' }, // gas-co2 (M1)
      ],
      opts
    );
    expect(resByLevel?.kind).toBe('skill');
    if (resByLevel?.kind === 'skill') {
      expect(resByLevel.skillId).toBe('skill-rika-gas-co2');
    }

    // (3) 件数・レベルが同じなら、記憶キープ度が低い単元が優先される（plant-vascular: 40% vs plant-dicot-monocot: 80%）
    const resByRetention = selectNextStepRecommendation(
      [
        { slotId: 'rika-2024-01-01-a', subject: 'rika' }, // plant-dicot-monocot (M2, 80%)
        { slotId: 'rika-2024-01-01-c', subject: 'rika' }, // plant-vascular (M2, 40%)
      ],
      opts
    );
    expect(resByRetention?.kind).toBe('skill');
    if (resByRetention?.kind === 'skill') {
      expect(resByRetention.skillId).toBe('skill-rika-plant-vascular');
    }

    // (4) 件数・レベル・記憶キープ度がすべて同じなら、設問の出現順で先に出てくる単元が優先される
    const resByOrder = selectNextStepRecommendation(
      [
        { slotId: 'rika-2024-02-03', subject: 'rika' }, // env-greenhouse (M2, 40%, 先に出現)
        { slotId: 'rika-2024-01-01-c', subject: 'rika' }, // plant-vascular (M2, 40%, 後に出現)
      ],
      opts
    );
    expect(resByOrder?.kind).toBe('skill');
    if (resByOrder?.kind === 'skill') {
      expect(resByOrder.skillId).toBe('skill-rika-env-greenhouse');
    }
  });

  it('3. 教科の選び方（第二段フォールバック）: 単元が特定できないとき、件数が多い教科 → 同数なら出現順', () => {
    // 社会2問 vs 国語1問 → 社会が選ばれる
    const resBySubCount = selectNextStepRecommendation([
      { slotId: 'kokugo-2024-01-01', subject: 'kokugo' },
      { slotId: 'shakai-2024-01-01', subject: 'shakai' },
      { slotId: 'shakai-2024-01-02', subject: 'shakai' },
    ]);
    expect(resBySubCount).toEqual({
      kind: 'subject',
      subject: 'shakai',
      subjectLabel: '社会',
      needsWorkCount: 2,
      headlineText: '【社会】の症例スタディで、れんしゅうしよう。',
      subText: 'もう少しだった問題:2問',
      buttonText: '【社会】の症例スタディをひらく ❯',
    });

    // 同数（1問ずつ）なら先に出現した国語が選ばれる
    const resBySubOrder = selectNextStepRecommendation([
      { slotId: 'kokugo-2024-01-01', subject: 'kokugo' },
      { slotId: 'shakai-2024-01-01', subject: 'shakai' },
    ]);
    expect(resBySubOrder?.kind).toBe('subject');
    if (resBySubOrder?.kind === 'subject') {
      expect(resBySubOrder.subject).toBe('kokugo');
      expect(resBySubOrder.headlineText).toBe('【国語】の症例スタディで、れんしゅうしよう。');
    }
  });

  it('4. 単元と教科の両方が候補のとき、第一段（単元）が優先され1件だけ返る', () => {
    const res = selectNextStepRecommendation([
      { slotId: 'shakai-2024-01-01', subject: 'shakai' }, // 単元未特定
      { slotId: 'shakai-2024-01-02', subject: 'shakai' }, // 単元未特定
      { slotId: 'sansu-2024-01-01', subject: 'sansu' }, // 単元特定可能（1問でもこちらが優先）
    ]);
    expect(res?.kind).toBe('skill');
    if (res?.kind === 'skill') {
      expect(res.skillId).toBe('skill-sansu-calc-order');
      expect(res.needsWorkCount).toBe(1);
    }
  });

  it('5. Lv.4以上（M4〜M6）の単元が選ばれたとき、復習用の文言とボタン名に切り替わる', () => {
    const resLv2 = selectNextStepRecommendation(
      [{ slotId: 'sansu-2024-01-01', subject: 'sansu' }],
      { getStageFn: () => 'M2' }
    );
    expect(resLv2?.kind).toBe('skill');
    if (resLv2?.kind === 'skill') {
      expect(resLv2.isMastered).toBe(false);
      expect(resLv2.headlineText).toBe('【計算の順序と四則混合計算】は、もう少しで全快だよ。');
      expect(resLv2.buttonText).toBe('この症例スタディをはじめる ❯');
    }

    const resLv4 = selectNextStepRecommendation(
      [{ slotId: 'sansu-2024-01-01', subject: 'sansu' }],
      { getStageFn: () => 'M4' }
    );
    expect(resLv4?.kind).toBe('skill');
    if (resLv4?.kind === 'skill') {
      expect(resLv4.isMastered).toBe(true);
      expect(resLv4.headlineText).toBe('【計算の順序と四則混合計算】を、もう一度ふり返ろう。');
      expect(resLv4.subText).toBe('もう少しだった問題:1問');
      expect(resLv4.buttonText).toBe('この症例を復習する ❯');
    }
  });
});

