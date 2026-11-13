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
  const { containerRef } = usePinchToZoom({
    zoom,
    onZoomChange: handleZoomChange,
    minZoom,
    maxZoom,
  });

  return (
    <div
      ref={containerRef}
      data-testid="zoom-container"
      style={{ width: 500, height: 500 }}
    >
      <span data-testid="zoom-val">{zoom}</span>
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

  it('does not prevent default and does not change zoom on 1-finger touch', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(<TestComponent initialZoom={100} onZoomChange={onZoomChange} />);
    const container = getByTestId('zoom-container');

    // 1本指タッチ
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100)]);
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 150, 100)]);

    expect(moveEvent.defaultPrevented).toBe(false);
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(getByTestId('zoom-val').textContent).toBe('100');
  });

  it('resets pinch state on touchend and supports subsequent pinches', () => {
    const onZoomChange = vi.fn();
    const { getByTestId } = render(<TestComponent initialZoom={100} onZoomChange={onZoomChange} />);
    const container = getByTestId('zoom-container');

    // 最初のピンチ: 100 -> 140 (距離 100 -> 140)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);
    fireTouchEvent(container, 'touchmove', [createTouch(1, 80, 100), createTouch(2, 220, 100)]);
    expect(getByTestId('zoom-val').textContent).toBe('140');

    // 指を離す
    fireTouchEvent(container, 'touchend', []);

    // 2回目のピンチ: 開始zoomは140、初期距離 100px -> 80px (比率 0.8 -> 140 * 0.8 = 112)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);
    fireTouchEvent(container, 'touchmove', [createTouch(1, 110, 100), createTouch(2, 190, 100)]);
    expect(getByTestId('zoom-val').textContent).toBe('112');
  });
});
