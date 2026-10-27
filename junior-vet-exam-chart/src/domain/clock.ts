let lastKnownTimestamp = 0;

export const AppClock = {
  now(): number {
    const systemNow = Date.now();
    if (systemNow < lastKnownTimestamp) {
      console.warn('Clock went backwards! Retaining last known timestamp to prevent schedule corruption.');
      return lastKnownTimestamp;
    }
    lastKnownTimestamp = systemNow;
    return systemNow;
  },

  // テスト用モック可能フック
  setLastKnownTimestamp(ts: number) {
    lastKnownTimestamp = ts;
  },

  reset() {
    lastKnownTimestamp = 0;
  }
};

