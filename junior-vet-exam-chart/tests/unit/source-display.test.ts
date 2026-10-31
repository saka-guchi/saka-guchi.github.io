import { describe, it, expect } from 'vitest';
import { getQuestionSource, getSubjectJaName } from '../../src/utils/source-helper';
import type { SampleQuestion } from '../../src/data/sample-data';

describe('Question Source Display & Helper Tests', () => {
  it('converts subject code to Japanese subject name accurately', () => {
    expect(getSubjectJaName('kokugo')).toBe('国語');
    expect(getSubjectJaName('sansu')).toBe('算数');
    expect(getSubjectJaName('rika')).toBe('理科');
    expect(getSubjectJaName('shakai')).toBe('社会');
    expect(getSubjectJaName(undefined)).toBe('');
  });

  it('prioritizes explicit source property if defined in question data', () => {
    const customQ: Partial<SampleQuestion> = {
      id: 'custom-q1',
      subject: 'sansu',
      source: '2024年度 安田学園中学校 算数（大問3）',
    };
    expect(getQuestionSource(customQ)).toBe('2024年度 安田学園中学校 算数（大問3）');
  });

  it('correctly attributes kokugo questions to 2022 Yasuda Gakuen Kokugo', () => {
    const kokugoQ: Partial<SampleQuestion> = {
      id: 'focus-kokugo-expository-logic-contrast',
      subject: 'kokugo',
      category: '説明・論説',
      prompt: '【植物と人類の対比】「種子が熟しても地面に落ちない（非脱粒性）」性質は、植物と人間にとってどう違いますか？',
    };
    expect(getQuestionSource(kokugoQ)).toBe('2022年度 安田学園中学校 国語');
  });

  it('correctly attributes 2024 math, science, and social studies questions', () => {
    const mathQ: Partial<SampleQuestion> = {
      id: 'focus-sansu-speed-ratio',
      subject: 'sansu',
    };
    expect(getQuestionSource(mathQ)).toBe('2024年度 安田学園中学校 算数');

    const sciQ: Partial<SampleQuestion> = {
      id: 'sample-rika-01',
      subject: 'rika',
    };
    expect(getQuestionSource(sciQ)).toBe('2024年度 安田学園中学校 理科');

    const shakaiQ: Partial<SampleQuestion> = {
      id: 'sample-shakai-01',
      subject: 'shakai',
    };
    expect(getQuestionSource(shakaiQ)).toBe('2024年度 安田学園中学校 社会');
  });

  it('safely handles missing or empty question objects', () => {
    expect(getQuestionSource(null)).toBe('安田学園中学校 入試問題');
    expect(getQuestionSource(undefined)).toBe('安田学園中学校 入試問題');
  });
});

