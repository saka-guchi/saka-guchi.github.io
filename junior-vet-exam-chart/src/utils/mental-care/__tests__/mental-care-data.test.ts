import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MENTAL_STORAGE_KEYS,
  WeatherType,
  runMentalCareMigration,
  recordMentalCheckin,
  recordCopingEffect,
  addSortingCard,
  deleteSortingCard,
  moveSortingCard,
  sendCareCardToParent,
  getSharedWeatherMap,
  getSharedWeeklySummaries,
  getSharedCareSignal,
  acknowledgeCareSignal,
  getSharedCareCards,
  setParentPin,
  verifyParentPin,
  resetParentPinAndSharedData,
  setChildLock,
  unlockChild,
  lockChild,
  isChildUnlocked,
  getPrivateSortingCards,
  getPrivateCopingRecords,
  getPrivateWeatherDetails,
  detectCrisisInText,
} from '../index';

describe('こころ機能 データ基盤 (Mental Care Data Foundation)', () => {
  beforeEach(() => {
    localStorage.clear();
    lockChild();
    vi.restoreAllMocks();
  });

  describe('1. 危機キーワード検知 (detectCrisisInText)', () => {
    it('深刻な危機語句（希死念慮・自傷・暴力・いじめ）を検知できる', () => {
      expect(detectCrisisInText('もう死にたい')).toBe(true);
      expect(detectCrisisInText('消えてしまいたい…')).toBe(true);
      expect(detectCrisisInText('リストカットしてしまった')).toBe(true);
      expect(detectCrisisInText('殴られて痛い')).toBe(true);
      expect(detectCrisisInText('学校でいじめられてる')).toBe(true);
    });

    it('通常の悩みや学習ストレスは検知しない（誤検知なし）', () => {
      expect(detectCrisisInText('算数のテストで計算ミスした')).toBe(false);
      expect(detectCrisisInText('塾の宿題がおわらなくて焦る')).toBe(false);
      expect(detectCrisisInText('友だちと喧嘩してモヤモヤする')).toBe(false);
      expect(detectCrisisInText('')).toBe(false);
      expect(detectCrisisInText(null)).toBe(false);
    });
  });

  describe('2. チェックインと書き込み時射影 (recordMentalCheckin)', () => {
    it('「おうちの人に伝える(shareWithParent: true)」場合、天気のみが shared に射影される', async () => {
      await recordMentalCheckin({
        date: '2026-11-02',
        weather: 'sunny',
        memo: '今日は理科の過去問がんばった！',
        shareWithParent: true,
        parentRequest: 'listen',
      });

      // Private にはメモを含む詳細が保存される
      const privateDetails = await getPrivateWeatherDetails();
      expect(privateDetails['2026-11-02']).toBeDefined();
      expect(privateDetails['2026-11-02'].memo).toBe('今日は理科の過去問がんばった！');

      // Shared には天気記号のみが保存され、メモは一切含まれない！
      const sharedWeather = getSharedWeatherMap();
      expect(sharedWeather['2026-11-02']).toBeDefined();
      expect(sharedWeather['2026-11-02'].weather).toBe('sunny');
      expect((sharedWeather['2026-11-02'] as any).memo).toBeUndefined();

      // 週まとめに反映される
      const weekly = getSharedWeeklySummaries();
      const weekKey = Object.keys(weekly)[0];
      expect(weekly[weekKey].weatherCounts.sunny).toBe(1);
    });

    it('「今日は伝えない(shareWithParent: false)」場合、shared に天気キー自体が生成されない（未記録と区別不能）', async () => {
      await recordMentalCheckin({
        date: '2026-11-03',
        weather: 'rainy',
        memo: 'ちょっと疲れたから誰にも言いたくない',
        shareWithParent: false,
      });

      // Private には保存される
      const privateDetails = await getPrivateWeatherDetails();
      expect(privateDetails['2026-11-03']).toBeDefined();

      // Shared にはキーが存在しない
      const sharedWeather = getSharedWeatherMap();
      expect(sharedWeather['2026-11-03']).toBeUndefined();
    });

    it('危機語句が含まれる場合、「伝えない」を選択していても警戒サイン(careSignal)が発動する', async () => {
      const result = await recordMentalCheckin({
        date: '2026-11-04',
        weather: 'storm',
        memo: 'もう消えたい…生きるのがつらい',
        shareWithParent: false,
      });

      expect(result.crisisDetected).toBe(true);

      // 警戒サインが発動
      const signal = getSharedCareSignal();
      expect(signal).not.toBeNull();
      expect(signal?.active).toBe(true);
      expect(signal?.level).toBe('alert');

      // 重要: 警戒サインオブジェクトに本文や単語は一切含まれない！
      expect((signal as any).memo).toBeUndefined();
      expect((signal as any).text).toBeUndefined();
      expect((signal as any).keyword).toBeUndefined();
    });

    it('あらし(storm)が3日連続した場合、警戒サインが発動する', async () => {
      await recordMentalCheckin({ date: '2026-11-01', weather: 'storm', shareWithParent: true });
      await recordMentalCheckin({ date: '2026-11-02', weather: 'storm', shareWithParent: true });
      expect(getSharedCareSignal()).toBeNull();

      // 3日連続
      await recordMentalCheckin({ date: '2026-11-03', weather: 'storm', shareWithParent: true });
      const signal = getSharedCareSignal();
      expect(signal?.active).toBe(true);

      // 保護者が確認すると解除される
      acknowledgeCareSignal();
      expect(getSharedCareSignal()?.active).toBe(false);
    });
  });

  describe('3. お守り効果記録と大分類カテゴリ射影 (recordCopingEffect)', () => {
    it('効果「かるくなった」を記録すると、shared にはお守り名ではなく大分類カテゴリ回数のみが射影される', async () => {
      await recordCopingEffect({
        copingId: 'breathing_478',
        category: 'body',
        effect: 'light',
        date: '2026-11-02',
        memo: '呼吸したら落ち着いた',
      });

      // Private には詳細が保存される
      const privateCopings = await getPrivateCopingRecords();
      expect(privateCopings['breathing_478']).toBeDefined();
      expect(privateCopings['breathing_478'].lightCount).toBe(1);
      expect(privateCopings['breathing_478'].memo).toBe('呼吸したら落ち着いた');

      // Shared の週まとめには、カテゴリ「body」のカウントのみが記録される
      const weekly = getSharedWeeklySummaries();
      const weekKey = Object.keys(weekly)[0];
      expect(weekly[weekKey].copingCategoryCounts.body).toBe(1);

      // Shared にはお守りID「breathing_478」やメモは一切存在しない
      const rawShared = localStorage.getItem(MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY);
      expect(rawShared).not.toContain('breathing_478');
      expect(rawShared).not.toContain('呼吸したら落ち着いた');
    });
  });

  describe('4. モヤモヤ仕分けカード (addSortingCard)', () => {
    it('自作モヤモヤカードは private にのみ保存され、shared には書き込まれない', async () => {
      const { card, crisisDetected } = await addSortingCard({
        text: '塾の席順が下がって悔しい',
        box: 'myself',
        nextStep: '間違えた計算問題を3問解き直す',
      });

      expect(crisisDetected).toBe(false);
      expect(card.id).toBeDefined();

      const privateCards = await getPrivateSortingCards();
      expect(privateCards.length).toBe(1);
      expect(privateCards[0].text).toBe('塾の席順が下がって悔しい');

      // sharedの全キーを走査して、カード本文が漏洩していないことを確認
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('jvet:shared:')) {
          const val = localStorage.getItem(key) || '';
          expect(val).not.toContain('塾の席順が下がって悔しい');
        }
      }
    });

    it('間違って箱に入れたカードを別の箱へ移動できる（moveSortingCard）', async () => {
      const { card } = await addSortingCard({
        text: '先生の言葉が引っかかる',
        box: 'myself',
      });

      await moveSortingCard(card.id, 'uncontrollable');
      const privateCards = await getPrivateSortingCards();
      const updated = privateCards.find((c) => c.id === card.id);
      expect(updated?.box).toBe('uncontrollable');
    });

    it('間違って入れたカードを取り消し・削除できる（deleteSortingCard）', async () => {
      const { card } = await addSortingCard({
        text: '誤って入力したカード',
        box: 'help',
      });

      let privateCards = await getPrivateSortingCards();
      expect(privateCards.some((c) => c.id === card.id)).toBe(true);

      await deleteSortingCard(card.id);
      privateCards = await getPrivateSortingCards();
      expect(privateCards.some((c) => c.id === card.id)).toBe(false);
    });
  });

  describe('5. 伝えるカード (sendCareCardToParent)', () => {
    it('子どもが明示的に送ったカードのみ shared:care_cards に保存される', () => {
      const sent = sendCareCardToParent('temp_thanks', 'いつもお弁当ありがとう');
      expect(sent.id).toBeDefined();

      const cards = getSharedCareCards();
      expect(cards.length).toBe(1);
      expect(cards[0].templateId).toBe('temp_thanks');
      expect(cards[0].customText).toBe('いつもお弁当ありがとう');
    });
  });

  describe('6. 子どものひみつのカギ (Web Crypto AES-GCM)', () => {
    it('カギを設定すると private データが暗号化BLOBになり、正しいPINで復号できる', async () => {
      // 事前にカードを追加
      await addSortingCard({
        text: '秘密のモヤモヤ',
        box: 'myself',
      });

      // 4桁PIN "1234" で暗号化ロックを設定
      await setChildLock('1234');

      // 平文キーが削除され、暗号化BLOBのみ存在することを確認
      expect(localStorage.getItem(MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS)).toBeNull();
      const encryptedBlob = localStorage.getItem(MENTAL_STORAGE_KEYS.PRIVATE_ENCRYPTED_BLOB);
      expect(encryptedBlob).not.toBeNull();
      expect(encryptedBlob).not.toContain('秘密のモヤモヤ');

      // ロックする
      lockChild();
      expect(isChildUnlocked()).toBe(false);

      // 間違ったPINでアンロック失敗
      const wrongUnlock = await unlockChild('9999');
      expect(wrongUnlock).toBe(false);
      expect(isChildUnlocked()).toBe(false);

      // 正しいPINでアンロック成功
      const correctUnlock = await unlockChild('1234');
      expect(correctUnlock).toBe(true);
      expect(isChildUnlocked()).toBe(true);

      // データが正しく復号できる
      const cards = await getPrivateSortingCards();
      expect(cards.length).toBe(1);
      expect(cards[0].text).toBe('秘密のモヤモヤ');
    });
  });

  describe('7. 保護者PIN管理 (PBKDF2 & ロックアウト)', () => {
    it('保護者PINを設定し、照合および5回連続失敗でのロックアウトが動作する', async () => {
      await setParentPin('5678');

      // 成功
      const resSuccess = await verifyParentPin('5678');
      expect(resSuccess.success).toBe(true);

      // 失敗 (1回目〜4回目)
      for (let i = 1; i <= 4; i++) {
        const resFail = await verifyParentPin('0000');
        expect(resFail.success).toBe(false);
        expect(resFail.isLocked).toBeFalsy();
        expect(resFail.remainingAttempts).toBe(5 - i);
      }

      // 5回目の失敗でロックアウト発動
      const resLocked = await verifyParentPin('0000');
      expect(resLocked.success).toBe(false);
      expect(resLocked.isLocked).toBe(true);
      expect(resLocked.remainingAttempts).toBe(0);

      // ロック中は正しいPINでも拒絶される
      const resDuringLock = await verifyParentPin('5678');
      expect(resDuringLock.success).toBe(false);
      expect(resDuringLock.isLocked).toBe(true);
    });

    it('resetParentPinAndSharedData で保護者PINとsharedのみリセットされ、privateには触れない', async () => {
      // 事前に private と shared のデータを作成
      await addSortingCard({ text: '子どもの宝物', box: 'myself' });
      await setParentPin('1111');
      sendCareCardToParent('temp_1', 'カード');

      resetParentPinAndSharedData();

      // PIN と shared:care_cards が消去されている
      expect(localStorage.getItem(MENTAL_STORAGE_KEYS.META_PARENT_PIN)).toBeNull();
      expect(getSharedCareCards().length).toBe(0);

      // 子どもの private データは完全に無傷で残っている！
      const cards = await getPrivateSortingCards();
      expect(cards.length).toBe(1);
      expect(cards[0].text).toBe('子どもの宝物');
    });
  });

  describe('8. 既存データマイグレーション (runMentalCareMigration)', () => {
    it('旧形式の junior_vet_mental_* データを安全に private と shared へ振り分け移行できる', async () => {
      // 旧データを localStorage に注入
      localStorage.setItem(
        'junior_vet_mental_custom_sort_cards',
        JSON.stringify([
          { id: 'old_1', text: '旧モヤモヤ', box: 'own', createdAt: '2026-10-01T00:00:00Z' },
        ])
      );
      localStorage.setItem(
        'junior_vet_mental_saved_copings',
        JSON.stringify(['coping_1', 'coping_2'])
      );
      localStorage.setItem('junior_vet_mental_completed_topics', JSON.stringify(['topic_bias']));
      localStorage.setItem(
        'junior_vet_mental_today_checkin',
        JSON.stringify({ date: '2026-11-01', weather: 'cloudy', memo: '昔のメモ' })
      );

      const result = runMentalCareMigration();

      expect(result.migrated).toBe(true);
      expect(result.backupCreated).toBe(true);
      expect(result.counts.sortingCards).toBe(1);
      expect(result.counts.copingRecords).toBe(2);
      expect(result.counts.philosophyAnswers).toBe(1);
      expect(result.counts.weatherDetails).toBe(1);

      // バックアップが存在することを確認
      const backup = localStorage.getItem(MENTAL_STORAGE_KEYS.BACKUP_PRE_V1_MIGRATION);
      expect(backup).not.toBeNull();
      expect(backup).toContain('旧モヤモヤ');

      // 新しい private / shared への移行を確認
      const privateCards = await getPrivateSortingCards();
      expect(privateCards[0].text).toBe('旧モヤモヤ');
      expect(privateCards[0].box).toBe('myself'); // own -> myself への正規化

      const sharedWeather = getSharedWeatherMap();
      expect(sharedWeather['2026-11-01'].weather).toBe('cloudy');
      // shared には旧メモが混入していない！
      expect((sharedWeather['2026-11-01'] as any).memo).toBeUndefined();

      // スキーマ版数が 1 に更新されている
      expect(localStorage.getItem(MENTAL_STORAGE_KEYS.META_SCHEMA_VERSION)).toBe('1');

      // 2回目実行時はスキップされる
      const result2 = runMentalCareMigration();
      expect(result2.migrated).toBe(false);
    });

    it('破損した旧JSONデータがあってもクラッシュせずに安全にスキップする', () => {
      localStorage.setItem('junior_vet_mental_custom_sort_cards', '{ invalid json syntax !!!');
      localStorage.setItem('junior_vet_mental_saved_copings', 'not an array');

      const result = runMentalCareMigration();
      expect(result.migrated).toBe(true);
      expect(localStorage.getItem(MENTAL_STORAGE_KEYS.META_SCHEMA_VERSION)).toBe('1');
    });
  });
});

