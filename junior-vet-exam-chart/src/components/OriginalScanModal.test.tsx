import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { OriginalScanModal } from './OriginalScanModal';

function createTouch(identifier: number, clientX: number, clientY: number): Touch {
  return {
    identifier,
    clientX,
    clientY,
    pageX: clientX,
    pageY: clientY,
    screenX: clientX,
    screenY: clientY,
    target: document.createElement('div'),
    force: 1,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
  } as unknown as Touch;
}

function fireTouchEvent(element: HTMLElement, type: string, touches: Touch[], cancelable = true): TouchEvent {
  const event = new Event(type, { bubbles: true, cancelable }) as TouchEvent;
  Object.defineProperty(event, 'touches', {
    value: touches,
    writable: false,
  });
  act(() => {
    element.dispatchEvent(event);
  });
  return event;
}

describe('OriginalScanModal pinch-to-zoom integration', () => {
  it('zooms original image via 2-finger pinch gesture and prevents default viewport zoom', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText } = render(
      <OriginalScanModal
        isOpen={true}
        onClose={onClose}
        year={2022}
        subject="rika"
        initialPage={1}
      />
    );

    // 初期ズーム表示は 100%
    expect(getByText('100%')).toBeDefined();

    // 原本画像コンテナを取得
    const container = getByTestId('scan-modal-image-container');
    expect(container).toBeDefined();

    // 2本指タッチ開始 (距離 100px)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);

    // 2本指タッチ移動 (距離 150px -> 150%)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 75, 100), createTouch(2, 225, 100)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(getByText('150%')).toBeDefined();

    // 画像の幅が 150% になっていることを確認
    const img = getByTestId('modal-scan-image');
    expect(img.style.width).toBe('150%');
  });

  it('works when modal is initially mounted with isOpen=false and opened later', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText, rerender } = render(
      <OriginalScanModal
        isOpen={false}
        onClose={onClose}
        year={2022}
        subject="rika"
        initialPage={1}
      />
    );

    // 初期状態ではモーダルは非表示
    expect(document.querySelector('[data-testid="original-scan-modal"]')).toBeNull();

    // モーダルを開く (StudyPageでのクリックに相当)
    rerender(
      <OriginalScanModal
        isOpen={true}
        onClose={onClose}
        year={2022}
        subject="rika"
        initialPage={1}
      />
    );

    const container = getByTestId('scan-modal-image-container');
    expect(container).toBeDefined();

    // 2本指タッチ開始 (距離 100px)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);

    // 2本指タッチ移動 (距離 160px -> 160%)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 70, 100), createTouch(2, 230, 100)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(getByText('160%')).toBeDefined();
  });
});
