import { describe, it, expect } from "vitest";
import {
  FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT,
  SUPPORTED_EXAM_YEARS,
} from "../../src/data/final-challenge-data";
import { STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT } from "../../src/data/final-challenge-pages";

describe("2024〜2026年度 安田学園過去問データ統合テスト", () => {
  it("SUPPORTED_EXAM_YEARS に 2026, 2025 が含まれていること", () => {
    expect(SUPPORTED_EXAM_YEARS).toContain(2026);
    expect(SUPPORTED_EXAM_YEARS).toContain(2025);
  });

  describe("2024年度 データ整合性（国語新収録含む全4教科）", () => {
    const data2024 = FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT[2024];
    const pages2024 = STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[2024];

    it("理科・算数・社会・国語の4教科が定義されていること", () => {
      expect(data2024.rika).toBeDefined();
      expect(data2024.sansu).toBeDefined();
      expect(data2024.shakai).toBeDefined();
      expect(data2024.kokugo).toBeDefined();

      expect(pages2024.rika).toBeDefined();
      expect(pages2024.sansu).toBeDefined();
      expect(pages2024.shakai).toBeDefined();
      expect(pages2024.kokugo).toBeDefined();
    });

    it("2024年度国語の問題用紙（左側）に選択問題の選択肢（ア〜エ）が提示されていること", () => {
      const page6 = pages2024.kokugo[6];
      expect(page6).toBeDefined();
      expect(page6.sections[0].bodyText).toContain("問1 傍線部");
      expect(page6.sections[0].bodyText).toContain("ア 無作為に");
      expect(page6.sections[0].bodyText).toContain("イ 無関心に");
    });

    it("国語が大問3・28スロットで正解・Stage2が設定されていること", () => {
      expect(data2024.kokugo.sections.length).toBe(3);
      const kokugoSlots = data2024.kokugo.sections.flatMap(s => s.slots);
      expect(kokugoSlots.length).toBe(28);

      for (const slot of kokugoSlots) {
        expect(slot.correctAnswer).toBeTruthy();
        expect(slot.stage2Prompt).toBeTruthy();
        expect(slot.stage2CorrectAnswer).toBeTruthy();
      }
    });
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
      expect(data2025.sansu.sections.length).toBe(4);
      expect(data2025.shakai.sections.length).toBe(3);
      expect(data2025.kokugo.sections.length).toBe(3);

      const rikaSlots = data2025.rika.sections.flatMap(s => s.slots);
      const sansuSlots = data2025.sansu.sections.flatMap(s => s.slots);
      const shakaiSlots = data2025.shakai.sections.flatMap(s => s.slots);
      const kokugoSlots = data2025.kokugo.sections.flatMap(s => s.slots);

      expect(rikaSlots.length).toBe(29);
      expect(sansuSlots.length).toBe(16);
      expect(shakaiSlots.length).toBe(23);
      expect(kokugoSlots.length).toBe(27);

      // 全スロットに正解とStage 2問題・正解が設定されていること
      for (const slot of [...rikaSlots, ...sansuSlots, ...shakaiSlots, ...kokugoSlots]) {
        expect(slot.correctAnswer).toBeTruthy();
        expect(slot.stage2Prompt).toBeTruthy();
        expect(slot.stage2CorrectAnswer).toBeTruthy();
      }

      // 2026年度国語: 原本忠実性の検証（AI創作ダミー設問の再発防止）
      const pages2026 = STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[2026];
      expect(pages2026.kokugo).toBeDefined();

      const page6 = pages2026.kokugo[6]; // 大問二設問ページ
      expect(page6).toBeDefined();
      const page6Text = JSON.stringify(page6);
      expect(page6Text).toContain('花開いた');
      expect(page6Text).toContain('縁のある');
      expect(page6Text).toContain('高橋先生');

      const page11 = pages2026.kokugo[11]; // 大問三設問ページ
      expect(page11).toBeDefined();
      const page11Text = JSON.stringify(page11);
      expect(page11Text).toContain('もとの世界にいつもどおりアクセス');

      const page12 = pages2026.kokugo[12]; // 大問三設問ページ
      expect(page12).toBeDefined();
      const page12Text = JSON.stringify(page12);
      expect(page12Text).toContain('同一化');
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

      expect(rikaSlots.length).toBe(19); // 原本解答用紙の全欄（大問2問1/問5、大問3問4の小問分割）と完全一致
      expect(sansuSlots.length).toBe(16);
      expect(shakaiSlots.length).toBe(23);
      expect(kokugoSlots.length).toBe(26);

      // 全スロットに正解とStage 2問題・正解が設定されていること
      for (const slot of [...rikaSlots, ...sansuSlots, ...shakaiSlots, ...kokugoSlots]) {
        expect(slot.correctAnswer).toBeTruthy();
        expect(slot.stage2Prompt).toBeTruthy();
        expect(slot.stage2CorrectAnswer).toBeTruthy();
      }

      // 2026年度国語: 原本忠実性の検証（AI創作ダミー設問の再発防止）
      const pages2026 = STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT[2026];
      expect(pages2026.kokugo).toBeDefined();

      const page6 = pages2026.kokugo[6]; // 大問二設問ページ
      expect(page6).toBeDefined();
      const page6Text = JSON.stringify(page6);
      expect(page6Text).toContain('花開いた');
      expect(page6Text).toContain('縁のある');
      expect(page6Text).toContain('高橋先生');

      const page11 = pages2026.kokugo[11]; // 大問三設問ページ
      expect(page11).toBeDefined();
      const page11Text = JSON.stringify(page11);
      expect(page11Text).toContain('もとの世界にいつもどおりアクセス');

      const page12 = pages2026.kokugo[12]; // 大問三設問ページ
      expect(page12).toBeDefined();
      const page12Text = JSON.stringify(page12);
      expect(page12Text).toContain('同一化');
    });
  });
});
