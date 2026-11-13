import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ExamProblemViewer } from './ExamProblemViewer';

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

describe('ExamProblemViewer pinch-to-zoom integration', () => {
  it('triggers onScanZoomChange on 2-finger pinch in single page mode', () => {
    const onScanZoomChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageLayoutChange = vi.fn();

    const { getByTestId } = render(
      <ExamProblemViewer
        stage={1}
        currentYear={2022}
        currentSubject="rika"
        currentSubjectLabel="理科"
        currentPage={1}
        currentTotalPages={4}
        onPageChange={onPageChange}
        pageLayout="single"
        onPageLayoutChange={onPageLayoutChange}
        scanZoom={100}
        onScanZoomChange={onScanZoomChange}
        viewMode="image"
        pageImageData="data:image/webp;base64,mock"
        nextPageImageData={null}
        currentSections={[]}
      />
    );

    const container = getByTestId('exam-scan-container');
    expect(container).toBeDefined();

    // 2本指タッチ開始 (距離 100px)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);

    // 2本指タッチ移動 (距離 160px -> 160%)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 70, 100), createTouch(2, 230, 100)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(onScanZoomChange).toHaveBeenCalledWith(160);
  });

  it('triggers onScanZoomChange on 2-finger pinch in spread mode', () => {
    const onScanZoomChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageLayoutChange = vi.fn();

    const { getByTestId } = render(
      <ExamProblemViewer
        stage={1}
        currentYear={2022}
        currentSubject="rika"
        currentSubjectLabel="理科"
        currentPage={1}
        currentTotalPages={4}
        onPageChange={onPageChange}
        pageLayout="spread"
        onPageLayoutChange={onPageLayoutChange}
        scanZoom={100}
        onScanZoomChange={onScanZoomChange}
        viewMode="image"
        pageImageData="data:image/webp;base64,mock1"
        nextPageImageData="data:image/webp;base64,mock2"
        currentSections={[]}
      />
    );

    const container = getByTestId('exam-scan-container');
    expect(container).toBeDefined();

    // 2本指タッチ開始 (距離 100px)
    fireTouchEvent(container, 'touchstart', [createTouch(1, 100, 100), createTouch(2, 200, 100)]);

    // 2本指タッチ移動 (距離 140px -> 140%)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 80, 100), createTouch(2, 220, 100)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(onScanZoomChange).toHaveBeenCalledWith(140);
  });
});
