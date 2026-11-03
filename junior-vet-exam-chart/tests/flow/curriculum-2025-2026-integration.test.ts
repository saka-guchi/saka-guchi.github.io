import { describe, it, expect } from "vitest";
import {
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT,
  SUPPORTED_EXAM_YEARS,
} from "../../src/data/final-challenge-data";
import { STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT } from "../../src/data/final-challenge-pages";

describe("2025年度・2026年度 安田学園過去問データ統合テスト", () => {
  it("SUPPORTED_EXAM_YEARS に 2026, 2025 が含まれていること", () => {
    expect(SUPPORTED_EXAM_YEARS).toContain(2026);
    expect(SUPPORTED_EXAM_YEARS).toContain(2025);
  });

  describe("2025年度 データ整合性", () => {
    const data2025 = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2025];
    const pages2025 = STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[2025];

    it("理科・算数・社会・国語の4教科が定義されていること", () => {
      expect(data2025.rika).toBeDefined();
      expect(data2025.sansu).toBeDefined();
      expect(data2025.shakai).toBeDefined();
      expect(data2025.kokugo).toBeDefined();

      expect(pages2025.rika).toBeDefined();
      expect(pages2025.sansu).toBeDefined();
      expect(pages2025.shakai).toBeDefined();
      expect(pages2025.kokugo).toBeDefined();
    });

    it("各科目の大問数とスロット数が正しく定義されていること", () => {
      expect(data2025.rika.sections.length).toBe(3);
      expect(data2025.sansu.sections.length).toBe(3);
      expect(data2025.shakai.sections.length).toBe(3);
      expect(data2025.kokugo.sections.length).toBe(3);

      const rikaSlots = data2025.rika.sections.flatMap(s => s.slots);
      const sansuSlots = data2025.sansu.sections.flatMap(s => s.slots);
      const shakaiSlots = data2025.shakai.sections.flatMap(s => s.slots);
      const kokugoSlots = data2025.kokugo.sections.flatMap(s => s.slots);

      expect(rikaSlots.length).toBe(29);
      expect(sansuSlots.length).toBe(16);
      expect(shakaiSlots.length).toBe(23);
      expect(kokugoSlots.length).toBe(20);

      // 全スロットに正解とStage 2問題・正解が設定されていること
      for (const slot of [...rikaSlots, ...sansuSlots, ...shakaiSlots, ...kokugoSlots]) {
        expect(slot.correctAnswer).toBeTruthy();
        expect(slot.stage2Prompt).toBeTruthy();
        expect(slot.stage2CorrectAnswer).toBeTruthy();
      }
    });
  });

  describe("2026年度 データ整合性", () => {
    const data2026 = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2026];
    const pages2026 = STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[2026];

    it("理科・算数・社会・国語の4教科が定義されていること", () => {
      expect(data2026.rika).toBeDefined();
      expect(data2026.sansu).toBeDefined();
      expect(data2026.shakai).toBeDefined();
      expect(data2026.kokugo).toBeDefined();

      expect(pages2026.rika).toBeDefined();
      expect(pages2026.sansu).toBeDefined();
      expect(pages2026.shakai).toBeDefined();
      expect(pages2026.kokugo).toBeDefined();
    });

    it("各科目の大問数とスロット数が正しく定義されていること", () => {
      expect(data2026.rika.sections.length).toBe(3);
      expect(data2026.sansu.sections.length).toBe(4);
      expect(data2026.shakai.sections.length).toBe(3);
      expect(data2026.kokugo.sections.length).toBe(3);

      const rikaSlots = data2026.rika.sections.flatMap(s => s.slots);
      const sansuSlots = data2026.sansu.sections.flatMap(s => s.slots);
      const shakaiSlots = data2026.shakai.sections.flatMap(s => s.slots);
      const kokugoSlots = data2026.kokugo.sections.flatMap(s => s.slots);

      expect(rikaSlots.length).toBe(16);
      expect(sansuSlots.length).toBe(16);
      expect(shakaiSlots.length).toBe(23);
      expect(kokugoSlots.length).toBe(20);

      // 全スロットに正解とStage 2問題・正解が設定されていること
      for (const slot of [...rikaSlots, ...sansuSlots, ...shakaiSlots, ...kokugoSlots]) {
        expect(slot.correctAnswer).toBeTruthy();
        expect(slot.stage2Prompt).toBeTruthy();
        expect(slot.stage2CorrectAnswer).toBeTruthy();
      }
    });
  });
});
