import { describe, it, expect } from 'vitest';
import { STAGE1_PAGE_CONTENTS_BY_SUBJECT } from '../../src/data/final-challenge-pages';
import questionsData from '../../src/data/curriculum/questions.json';
import rikaQuestionsData from '../../src/data/curriculum/rika/questions.json';

describe('Prompt Leakage & Fidelity Unit Tests', () => {
  it('does not leak answers in prompts across all subjects in STAGE1_PAGE_CONTENTS', async () => {
    // 答えとして問われる重要用語
    const leakedAnswerPatterns = [
      /\(師管\)|（師管）/,
      /\(道管\)|（道管）/,
      /\(主根\)|（主根）/,
      /\(側根\)|（側根）/,
      /組織[㋐-㋕]\s*[（(]/,
    ];

    const { STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT } = await import('../../src/data/final-challenge-pages');

    Object.entries(STAGE1_PAGE_CONTENTS_BY_YEAR_AND_SUBJECT).forEach(([year, yearPages]) => {
      Object.entries(yearPages).forEach(([subject, pages]) => {
        Object.entries(pages).forEach(([pageNum, page]) => {
          page.sections.forEach((sec, secIdx) => {
            if (sec.questions) {
              sec.questions.forEach((q) => {
                leakedAnswerPatterns.forEach((pattern) => {
                  expect(
                    pattern.test(q.prompt),
                    `Leaked pattern ${pattern} found in year: ${year}, subject: ${subject}, page: ${pageNum}, sec: ${secIdx}, qNum: ${q.qNum}, prompt: "${q.prompt}"`
                  ).toBe(false);
                });
              });
            }
          });
        });
      });
    });
  });

  it('verifies rika question 4 in final challenge matches original exam text', () => {
    const rikaPage2 = STAGE1_PAGE_CONTENTS_BY_SUBJECT.rika[2];
    expect(rikaPage2).toBeDefined();
    const q4 = rikaPage2.sections[0].questions?.find((q) => q.qNum === '問4');
    expect(q4).toBeDefined();
    // 原本: 図２の㋒と㋓のはたらきを簡単に説明しなさい。
    expect(q4?.prompt).toBe('図2の㋒と㋓のはたらきを簡単に説明しなさい。');
    // 問1の範囲指定が㋐〜㋔であること
    const q1 = rikaPage2.sections[0].questions?.find((q) => q.qNum === '問1');
    expect(q1?.prompt).toContain('㋐〜㋔');
  });

  it('does not leak answers in curriculum questions.json prompts', () => {
    const termQuestions = questionsData.filter((q) => q.answerType === 'term');
    
    // 同一セクション内でterm問題の答えが後続の設問promptにカッコ書きで埋め込まれていないこと
    questionsData.forEach((q) => {
      expect(q.prompt).not.toMatch(/（師管）/);
      expect(q.prompt).not.toMatch(/（道管）/);
      expect(q.prompt).not.toMatch(/（根毛）/);
    });

    rikaQuestionsData.forEach((q) => {
      expect(q.prompt).not.toMatch(/（師管）/);
      expect(q.prompt).not.toMatch(/（道管）/);
      expect(q.prompt).not.toMatch(/（根毛）/);
    });
  });

  it('verifies consistency between exam paper questions and answer sheet slots for rika', async () => {
    const rikaPage2 = STAGE1_PAGE_CONTENTS_BY_SUBJECT.rika[2];
    expect(rikaPage2).toBeDefined();

    const paperQ4 = rikaPage2.sections[0].questions?.find((q) => q.qNum === '問4');
    expect(paperQ4).toBeDefined();
    // 問題文は説明記述問題
    expect(paperQ4?.prompt).toContain('はたらきを簡単に説明しなさい');

    // 対応する解答欄スロット（final-challenge-data.ts）
    // ウとエの2つの記述欄が存在すること
    const { FINAL_CHALLENGE_SECTIONS } = await import('../../src/data/final-challenge-data');
    const sec1 = FINAL_CHALLENGE_SECTIONS[0];
    const q4Slots = sec1.slots.filter((s) => s.questionNumber === '4');

    expect(q4Slots).toHaveLength(2);
    // ウとエの記述問題であること（選択問題・植物A/Bではないこと）
    expect(q4Slots[0].id).toBe('rika-2024-01-04-c');
    expect(q4Slots[0].partNumber).toBe('ウ');
    expect(q4Slots[0].answerType).toBe('open');
    expect(q4Slots[0].label).toContain('[ウのはたらき] (記述)');

    expect(q4Slots[1].id).toBe('rika-2024-01-04-d');
    expect(q4Slots[1].partNumber).toBe('エ');
    expect(q4Slots[1].answerType).toBe('open');
    expect(q4Slots[1].label).toContain('[エのはたらき] (記述)');

    // 存在しない「植物A」「植物B」というスロットが混入していないこと
    const dummyPlantSlots = sec1.slots.filter((s) => s.partNumber === '植物A' || s.partNumber === '植物B');
    expect(dummyPlantSlots).toHaveLength(0);

    // 問5（根毛）と問6（表面積記述）が存在すること
    const q5Slot = sec1.slots.find((s) => s.questionNumber === '5');
    expect(q5Slot?.correctAnswer).toBe('根毛');
    expect(q5Slot?.answerType).toBe('term');

    const q6Slot = sec1.slots.find((s) => s.questionNumber === '6');
    expect(q6Slot?.answerType).toBe('open');
  });

  it('verifies Stage 2 slots across all subjects and years have valid options and no answer leaks in prompt', async () => {
    const { FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT } = await import('../../src/data/final-challenge-data');

    // 問題文に埋め込まれてはならない答えパターンの検出
    const leakedStage2Patterns = [
      /（二酸化炭素）|\(二酸化炭素\)/,
      /（酸素）|\(酸素\)/,
      /（函館）|\(函館\)/,
      /（青森・北海道・長崎）|\(青森・北海道・長崎\)/,
      /（熊本県）|\(熊本県\)/,
      /（富嶽三十六景）|\(富嶽三十六景\)/,
      /（大政翼賛会）|\(大政翼賛会\)/,
      /（20℃以下）|\(20℃以下\)/,
      /七支刀\(イ\)→壇ノ浦\(ア\)/,
    ];

    Object.entries(FINAL_CHALLENGE_DATA_BY_YEAR_AND_SUBJECT).forEach(([year, yearData]) => {
      Object.entries(yearData).forEach(([subjectKey, subjectData]) => {
        subjectData.sections.forEach((sec) => {
          sec.slots.forEach((slot) => {
            // 1. stage2Prompt の答えネタバレチェック
            if (slot.stage2Prompt) {
              leakedStage2Patterns.forEach((pattern) => {
                expect(
                  pattern.test(slot.stage2Prompt!),
                  `Found leaked answer pattern ${pattern} in stage2Prompt for [${year}/${subjectKey}] slot ${slot.id}: "${slot.stage2Prompt}"`
                ).toBe(false);
              });
            }

            // 2. 選択問題の場合、有効な選択肢テキストが Stage 2 用に提示されていること
            if (slot.answerType === 'choice' || slot.answerType === 'multi_choice') {
              const activeOptions = slot.stage2Options || slot.options;
              expect(
                activeOptions,
                `Missing options for choice slot in [${year}/${subjectKey}] slot ${slot.id}: "${slot.label}"`
              ).toBeDefined();

              expect(
                activeOptions!.length,
                `Options must have at least 2 items in [${year}/${subjectKey}] slot ${slot.id}`
              ).toBeGreaterThanOrEqual(2);

              // 単なる「ア」「イ」記号のみではなく、児童が選べる選択肢テキストを含むこと
              const hasDescriptiveContent = activeOptions!.some(
                (opt) => opt.includes(':') || opt.includes('：') || opt.includes(' ') || opt.includes('　') || opt.length > 2
              );
              expect(
                hasDescriptiveContent,
                `Options must contain descriptive text, not bare single symbols in [${year}/${subjectKey}] slot ${slot.id}: ${JSON.stringify(activeOptions)}`
              ).toBe(true);
            }
          });
        });
      });
    });
  });

  it('guarantees terminology consistency across UI files (no banned terms like 元過去問 or 過去問原本本番)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const uiFiles = [
      path.resolve(__dirname, '../../src/pages/FinalChallengePage.tsx'),
      path.resolve(__dirname, '../../src/pages/HomePage.tsx'),
      path.resolve(__dirname, '../../src/components/FinalExamHistoryModal.tsx'),
    ];

    const bannedTerms = [
      { pattern: /元過去問/, name: '元過去問 (Use "Stage 1（過去問本番）" instead)' },
      { pattern: /過去問原本本番/, name: '過去問原本本番 (Use "Stage 1（過去問本番）" instead)' },
      { pattern: /同等未見テスト/, name: '同等未見テスト (Use "Stage 2（同等未見問題）" instead)' },
    ];

    uiFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      bannedTerms.forEach(({ pattern, name }) => {
        expect(
          pattern.test(content),
          `Banned inconsistent term ${name} detected in ${path.basename(filePath)}`
        ).toBe(false);
      });
    });
  });

  it('guarantees every skill has a unique, concrete patient animal (no generic "患者どうぶつ")', async () => {
    const { ALL_PROGRESS_SKILLS } = await import('../../src/data/all-skills');

    ALL_PROGRESS_SKILLS.forEach((skill) => {
      expect(
        skill.patientName,
        `Skill [${skill.id}] "${skill.title}" has invalid generic patientName "${skill.patientName}"`
      ).not.toBe('患者どうぶつ');

      expect(
        skill.patientName.length,
        `Skill [${skill.id}] "${skill.title}" patientName is too short`
      ).toBeGreaterThanOrEqual(3);

      expect(
        skill.patientIcon,
        `Skill [${skill.id}] "${skill.title}" has fallback icon 🐾`
      ).not.toBe('🐾');
    });
  });

  it('verifies 2023 exam consistency between questions and slots for all subjects', async () => {
    const {
      FINAL_CHALLENGE_2023_RIKA_SECTIONS,
      FINAL_CHALLENGE_2023_SANSU_SECTIONS,
      FINAL_CHALLENGE_2023_SHAKAI_SECTIONS,
    } = await import('../../src/data/final-challenge-data');

    // 1. 理科 (全20スロット: 大問1 10問, 大問2 6問, 大問3 4問)
    const rikaSlots = FINAL_CHALLENGE_2023_RIKA_SECTIONS.flatMap((s) => s.slots);
    expect(rikaSlots).toHaveLength(20);
    const honeyBeeSlots = rikaSlots.filter((s) => s.id.startsWith('rika-2023-01-'));
    expect(honeyBeeSlots).toHaveLength(10);
    const cuSlot = rikaSlots.find((s) => s.id === 'rika-2023-02-03');
    expect(cuSlot?.correctAnswer).toBe('酸素');

    // 2. 算数 (全18スロット: 大問1 12問, 大問2 2問, 大問3 2問, 大問4 2問)
    const sansuSlots = FINAL_CHALLENGE_2023_SANSU_SECTIONS.flatMap((s) => s.slots);
    expect(sansuSlots).toHaveLength(18);
    const saltWaterSlot = sansuSlots.find((s) => s.id === 'sansu-2023-02-01');
    expect(saltWaterSlot?.correctAnswer).toBe('300');

    // 3. 社会 (全23スロット: 大問1 7問, 大問2 9問, 大問3 7問)
    const shakaiSlots = FINAL_CHALLENGE_2023_SHAKAI_SECTIONS.flatMap((s) => s.slots);
    expect(shakaiSlots).toHaveLength(23);
    const takeshimaSlot = shakaiSlots.find((s) => s.id === 'shakai-2023-01-01-b');
    expect(takeshimaSlot?.correctAnswer).toBe('竹島');
    const lrtSlot = shakaiSlots.find((s) => s.id === 'shakai-2023-03-04');
    expect(lrtSlot?.correctAnswer).toBe('線状降水帯');
  });
});



