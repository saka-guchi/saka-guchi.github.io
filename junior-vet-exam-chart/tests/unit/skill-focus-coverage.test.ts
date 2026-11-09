import { describe, it, expect } from 'vitest';
import { THEME_ENHANCEMENTS } from '../../src/data/vet-curriculum-enhancement';
import { ALL_PROGRESS_SKILLS } from '../../src/data/all-skills';
import { useAppStore } from '../../src/store/appStore';

describe('Check all THEME_ENHANCEMENTS focus sessions', () => {
  it('every enhancement skillId produces at least 1 focus question', () => {
    const store = useAppStore.getState();
    const failures: string[] = [];

    for (const [key, enhancement] of Object.entries(THEME_ENHANCEMENTS)) {
      store.startSkillFocusSession(enhancement.skillId);
      const qs = useAppStore.getState().currentSessionQuestions;
      if (!qs || qs.length === 0) {
        failures.push(`Key: ${key}, skillId: ${enhancement.skillId}`);
      }
    }

    if (failures.length > 0) {
      console.error('Failed skillIds:', failures);
    }
    expect(failures).toEqual([]);
  });

  it('every ALL_PROGRESS_SKILLS produces at least 1 focus question', () => {
    const store = useAppStore.getState();
    const failures: string[] = [];

    for (const skill of ALL_PROGRESS_SKILLS) {
      store.startSkillFocusSession(skill.id);
      const qs = useAppStore.getState().currentSessionQuestions;
      if (!qs || qs.length === 0) {
        failures.push(`Skill ID: ${skill.id}, Title: ${skill.title}`);
      }
    }

    if (failures.length > 0) {
      console.error('Failed skills:', failures);
    }
    expect(failures).toEqual([]);
  });
});
