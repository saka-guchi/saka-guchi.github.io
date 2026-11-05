import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

/**
 * bodyのスクロールをロックする（参照カウント方式）
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

/**
 * bodyのスクロールロックを解除する（参照カウント方式）
 */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

/**
 * モーダルや全画面オーバーレイの表示中に body のスクロールをロックするカスタムフック
 * 複数モーダルが重なって表示されても安全にロックを維持します。
 *
 * @param active ロックを有効化するかどうか（デフォルト: true）
 */
export function useBodyScrollLock(active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [active]);
}
