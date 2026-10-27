import { describe, it, expect } from 'vitest';
import spec from './spec.json';

describe('Layout Specification Tests (第22〜24章)', () => {
  it('has valid coordinates defined for L1, L2, P1, S1', () => {
    expect(spec.L1.viewport).toEqual({ width: 1024, height: 768 });
    expect(spec.L2.viewport).toEqual({ width: 1366, height: 1024 });
    expect(spec.P1.viewport).toEqual({ width: 834, height: 1194 });
    expect(spec.S1.viewport).toEqual({ width: 390, height: 844 });
  });

  it('matches L1 key component specifications', () => {
    const l1 = spec.L1.elements;
    expect(l1.header.height).toBe(72);
    expect(l1['bottom-control-bar'].height).toBe(80);
    expect(l1['question-area'].width).toBe(604);
    expect(l1['answer-area'].width).toBe(352);
    // 604 + 352 + 20(gap) = 976 (メインエリア幅)
    expect(l1['question-area'].width + l1['answer-area'].width + 20).toBe(976);
  });
});

