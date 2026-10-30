import { describe, it, expect } from 'vitest';
import { ALL_PROGRESS_SKILLS } from '../../src/data/all-skills';
import { THEME_ENHANCEMENTS } from '../../src/data/vet-curriculum-enhancement';
import { ANIMAL_STAMPS } from '../../src/data/animal-stamps';
import { ALL_CURRICULUM_QUESTIONS } from '../../src/data/curriculum';
import { CURRICULUM_2023_QUESTIONS } from '../../src/data/curriculum-2023-questions';
import { useAppStore } from '../../src/store/appStore';

describe('2023 Exam Curriculum & Animal Stamps Integration Tests', () => {
  it('guarantees all 46 themes are registered and balanced across 3 subjects', () => {
    expect(ALL_PROGRESS_SKILLS.length).toBe(46);

    const rikaSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'rika');
    const sansuSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'sansu');
    const shakaiSkills = ALL_PROGRESS_SKILLS.filter(s => s.subject === 'shakai');

    expect(rikaSkills.length).toBe(12);
    expect(sansuSkills.length).toBe(17);
    expect(shakaiSkills.length).toBe(17);
  });

  it('guarantees every theme in ALL_PROGRESS_SKILLS has a valid enhancement config', () => {
    for (const skill of ALL_PROGRESS_SKILLS) {
      const enhancement = THEME_ENHANCEMENTS[skill.id];
      expect(enhancement, `Enhancement for ${skill.id} should be defined`).toBeDefined();
      expect(enhancement.patientAnimal.name).toBeTruthy();
      expect(enhancement.patientAnimal.icon).toBeTruthy();
      expect(enhancement.flashCard.question).toBeTruthy();
      expect(enhancement.flashCard.answer).toBeTruthy();
    }
  });

  it('guarantees animal stamps album has 13 stamps with rich cheers and facts', () => {
    expect(ANIMAL_STAMPS.length).toBe(13);

    for (const stamp of ANIMAL_STAMPS) {
      expect(stamp.id).toBeTruthy();
      expect(stamp.name).toBeTruthy();
      expect(stamp.icon).toBeTruthy();
      expect(stamp.cheerMessage).toBeTruthy();
      expect(stamp.vetFact).toBeTruthy();
    }

    // 2023年度新規動物スタンプの存在確認
    const stampIds = ANIMAL_STAMPS.map(s => s.id);
    expect(stampIds).toContain('stamp-bee-maya');
    expect(stampIds).toContain('stamp-squirrel-puru');
    expect(stampIds).toContain('stamp-turtle-totto');
    expect(stampIds).toContain('stamp-raccoon-ponta');
    expect(stampIds).toContain('stamp-swallow-tsubasa');
  });

  it('guarantees ALL_CURRICULUM_QUESTIONS includes all 18 questions from 2023 exam', () => {
    expect(CURRICULUM_2023_QUESTIONS.length).toBe(18);

    const questionIds = ALL_CURRICULUM_QUESTIONS.map(q => q.id);
    for (const q2023 of CURRICULUM_2023_QUESTIONS) {
      expect(questionIds).toContain(q2023.id);
    }
  });

  it('starts skill focus session and properly loads 2023 questions for newly added skill', () => {
    const store = useAppStore.getState();

    // 2023年理科新規スキル: ミツバチの日齢分業
    store.startSkillFocusSession('skill-rika-2023-bee-division');
    const state = useAppStore.getState();

    expect(state.currentSessionQuestions.length).toBeGreaterThanOrEqual(2);
    expect(state.currentSessionQuestions[0].skillId).toBe('skill-rika-2023-bee-division');
    expect(state.currentSessionQuestions[0].prompt).toContain('ミツバチ');
  });

  it('starts daily session with random mix containing potential 2023 questions', () => {
    const store = useAppStore.getState();
    store.startDailySession();
    const state = useAppStore.getState();

    expect(state.currentSessionQuestions.length).toBe(10);
  });
});
