/**
 * こころ機能（こころの休憩室 / こころの見守り）データ基盤
 * 
 * エクスポート一覧
 */

// 型定義
export * from './types';

// セーフティネット・公式窓口
export * from './crisis-keywords';

// 暗号化・PINハッシュユーティリティ
export {
  generateSaltHex,
  hashPin,
  deriveKeyFromPin,
  encryptData,
  decryptData,
} from './crypto';

// 保護者開示専用ストア (shared-store)
// ※保護者画面はここからのみ読み込みを行うこと
export {
  getSharedWeatherMap,
  getSharedWeeklySummaries,
  getSharedParentRequests,
  getSharedCareCards,
  deleteSharedCareCard,
  getSharedCareSignal,
  isCareSignalActive,
  acknowledgeCareSignal,
  getParentPinMeta,
  isParentPinSet,
  setParentPin,
  verifyParentPin,
  resetParentPinAndSharedData,
} from './shared-store';

// 子ども専用プライベートストア (private-store)
export {
  getChildLockMeta,
  isChildLockEnabled,
  isChildUnlocked,
  lockChild,
  unlockChild,
  setChildLock,
  disableChildLock,
  getPrivateSortingCards,
  savePrivateSortingCards,
  getPrivateCopingRecords,
  savePrivateCopingRecords,
  getPrivatePhilosophyAnswers,
  savePrivatePhilosophyAnswers,
  getPrivateWeatherDetails,
  savePrivateWeatherDetails,
} from './private-store';

// コア操作（子どもアクション時の保存 & 射影）
export {
  recordMentalCheckin,
  recordCopingEffect,
  addSortingCard,
  sendCareCardToParent,
  getPromisesAgreedMeta,
  agreeToPromises,
  triggerCareSignal,
  getMondayOfWeek,
} from './core-store';

// データ移行
export { runMentalCareMigration } from './migration';

