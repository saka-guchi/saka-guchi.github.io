import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { lockBodyScroll, unlockBodyScroll, useBodyScrollLock } from '../../src/utils/use-body-scroll-lock';

describe('useBodyScrollLock Unit Tests', () => {
  beforeEach(() => {
    // スタイルをリセット
    document.body.style.overflow = '';
  });

  it('lockBodyScroll locks body scroll with overflow: hidden and restores on unlockBodyScroll', () => {
    document.body.style.overflow = 'visible';
    
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('visible');
  });

  it('handles multiple stacked locks using reference counting', () => {
    document.body.style.overflow = 'auto';

    // 1つ目のモーダルが開く
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    // 2つ目のモーダルが上に重なって開く
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    // 2つ目のモーダルが閉じる（まだ1つ目が開いているため hidden が維持される）
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    // 1つ目のモーダルも閉じる（すべて閉じたので元の auto に戻る）
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('useBodyScrollLock hook locks scroll on mount and unlocks on unmount', () => {
    document.body.style.overflow = '';

    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('useBodyScrollLock respects active parameter toggle', () => {
    document.body.style.overflow = '';

    const { rerender } = renderHook(({ active }) => useBodyScrollLock(active), {
      initialProps: { active: false },
    });
    expect(document.body.style.overflow).toBe('');

    rerender({ active: true });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ active: false });
    expect(document.body.style.overflow).toBe('');
  });
});
