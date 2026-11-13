import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { usePinchToZoom } from './use-pinch-to-zoom';

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

const TestComponent: React.FC<{
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (z: number | ((prev: number) => number)) => void;
}> = ({ initialZoom = 100, minZoom = 100, maxZoom = 200, onZoomChange }) => {
  const [zoom, setZoom] = useState(initialZoom);
  const handleZoomChange = (newZoom: number | ((prev: number) => number)) => {
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };
  const { containerRef, contentRef } = usePinchToZoom({
    zoom,
    onZoomChange: handleZoomChange,
    minZoom,
    maxZoom,
  });

  return (
    <div
      ref={containerRef}
      data-testid="zoom-container"
      style={{ width: 500, height: 500, overflow: 'hidden', position: 'relative' }}
    >
      <div
        ref={contentRef}
        data-testid="zoom-content"
        style={{ width: 500, height: 500 }}
      >
        <span data-testid="zoom-val">{zoom}</span>
      </div>
    </div>
  );
};

describe('usePinchToZoom', () => {
  it('updates zoom and prevents default on two-finger pinch-out (expand)', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(<TestComponent initialZoom={100} onZoomChange={onZoomChange} />);
    const container = getByTestId('zoom-container');

    // 2本指タッチ開始: 距離 100px ( (100, 100) と (200, 100) )
    const touch1 = createTouch(1, 100, 100);
    const touch2 = createTouch(2, 200, 100);
    fireTouchEvent(container, 'touchstart', [touch1, touch2]);

    // 2本指タッチ移動: 距離 150px ( (75, 100) と (225, 100) ) -> 比率 1.5 -> zoom 150
    const touch1Move = createTouch(1, 75, 100);
    const touch2Move = createTouch(2, 225, 100);
    const moveEvent = fireTouchEvent(container, 'touchmove', [touch1Move, touch2Move]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(onZoomChange).toHaveBeenCalledWith(150);
    expect(getByTestId('zoom-val').textContent).toBe('150');
  });

  it('clamps zoom to minZoom and maxZoom', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(
      <TestComponent initialZoom={100} minZoom={100} maxZoom={200} onZoomChange={onZoomChange} />
    );
    const container = getByTestId('zoom-container');

    // 2本指タッチ開始 (距離 100px)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);

    // 縮小 (距離 50px -> 比率 0.5 -> 50% -> min 100%にクランプ)
    fireTouchEvent(container, 'touchmove', [createTouch(1, 125, 100), createTouch(2, 175, 100)]);
    expect(getByTestId('zoom-val').textContent).toBe('100');

    // 拡大超過 (距離 300px -> 比率 3.0 -> 300% -> max 200%にクランプ)
    fireTouchEvent(container, 'touchmove', [createTouch(1, 0, 100), createTouch(2, 300, 100)]);
    expect(getByTestId('zoom-val').textContent).toBe('200');
  });

  it('applies transform directly centered on the pinch midpoint (Focal Point Zoom)', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(<TestComponent initialZoom={100} onZoomChange={onZoomChange} />);
    const container = getByTestId('zoom-container');
    const content = getByTestId('zoom-content');

    // コンテナ位置: left=50, top=100
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 100,
      right: 550,
      bottom: 600,
      width: 500,
      height: 500,
      x: 50,
      y: 100,
      toJSON: () => {},
    });

    // 指1: (200, 300), 指2: (300, 300) -> 中心 client (250, 300)
    // コンテナ内Focal Point: x = 250 - 50 = 200, y = 300 - 100 = 200
    // コンテンツ座標: (200 - 0) / 1.0 = 200, (200 - 0) / 1.0 = 200
    fireTouchEvent(container, 'touchstart', [createTouch(1, 200, 300), createTouch(2, 300, 300)]);

    // 拡大: 距離 150px (ratio 1.5, zoom 150), 指の中心はそのまま (250, 300)
    // newTx = 200 - 1.5 * 200 = 200 - 300 = -100
    // newTy = 200 - 1.5 * 200 = 200 - 300 = -100
    fireTouchEvent(container, 'touchmove', [createTouch(1, 175, 300), createTouch(2, 325, 300)]);

    expect(content.style.transform).toBe('translate(-100px, -100px) scale(1.5)');
    expect(content.style.transformOrigin).toBe('0 0');
  });

  it('follows two-finger pan (translation) during pinch', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(<TestComponent initialZoom={100} onZoomChange={onZoomChange} />);
    const container = getByTestId('zoom-container');
    const content = getByTestId('zoom-content');

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 100,
      right: 550,
      bottom: 600,
      width: 500,
      height: 500,
      x: 50,
      y: 100,
      toJSON: () => {},
    });

    // 開始: 中心 client (250, 300) -> コンテナ内 (200, 200) -> コンテンツ (200, 200)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 200, 300), createTouch(2, 300, 300)]);

    // 拡大(1.5倍) + 中心点を左上に50px移動 (client (200, 250) -> コンテナ内 (150, 150))
    // newTx = 150 - 1.5 * 200 = 150 - 300 = -150
    // newTy = 150 - 1.5 * 200 = 150 - 300 = -150
    fireTouchEvent(container, 'touchmove', [createTouch(1, 125, 250), createTouch(2, 275, 250)]);

    expect(content.style.transform).toBe('translate(-150px, -150px) scale(1.5)');
  });

  it('supports 1-finger panning when zoomed in', () => {
    const { getByTestId } = render(<TestComponent initialZoom={150} />);
    const container = getByTestId('zoom-container');
    const content = getByTestId('zoom-content');

    // 1本指タッチ開始
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100)]);

    // 1本指移動 (右下に50pxドラッグ)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 150, 150)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(content.style.transform).toContain('translate(50px, 50px)');
  });

  it('resets transform to origin on touchend if zoom is close to 100%', () => {
    const { getByTestId } = render(<TestComponent initialZoom={100} />);
    const container = getByTestId('zoom-container');
    const content = getByTestId('zoom-content');

    // わずかにピンチアウト (102%)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);
    fireTouchEvent(container, 'touchmove', [createTouch(1, 99, 100), createTouch(2, 201, 100)]);

    // 指を離す -> スナップバック
    fireTouchEvent(container, 'touchend', []);

    expect(content.style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});
