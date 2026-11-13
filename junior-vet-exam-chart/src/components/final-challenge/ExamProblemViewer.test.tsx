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

  it('works when switching from stage 2 (no image) to stage 1 dynamically', () => {
    const onScanZoomChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageLayoutChange = vi.fn();

    const { getByTestId, rerender } = render(
      <ExamProblemViewer
        stage={2}
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

    // stage 2時は原本スキャンコンテナは未接続
    expect(document.querySelector('[data-testid="exam-scan-container"]')).toBeNull();

    // stage 1に切り替え
    rerender(
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

    // 2本指タッチ移動 (距離 150px -> 150%)
    const moveEvent = fireTouchEvent(container, 'touchmove', [createTouch(1, 75, 100), createTouch(2, 225, 100)]);

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(onScanZoomChange).toHaveBeenCalledWith(150);
  });

  it('applies transform centered on pinch midpoint in ExamProblemViewer', () => {
    const onScanZoomChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageLayoutChange = vi.fn();

    const { getByTestId } = render(
      <ExamProblemViewer
        stage={1}
        currentYear={2022}
        currentSubject="sansu"
        currentSubjectLabel="算数"
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
    const image = getByTestId('exam-page-image');
    const content = image.parentElement!;

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      right: 700,
      bottom: 850,
      width: 600,
      height: 800,
      x: 100,
      y: 50,
      toJSON: () => {},
    });

    // 2本指タッチ開始: 指1 (250, 250), 指2 (350, 250) -> 中心 client (300, 250)
    // コンテナ内Focal Point: x = 300 - 100 = 200, y = 250 - 50 = 200
    fireTouchEvent(container, 'touchstart', [createTouch(1, 250, 250), createTouch(2, 350, 250)]);

    // 拡大: 距離 100px -> 160px (比率 1.6 -> 160%)
    // newTx = 200 - 1.6 * 200 = 200 - 320 = -120
    // newTy = 200 - 1.6 * 200 = 200 - 320 = -120
    fireTouchEvent(container, 'touchmove', [createTouch(1, 220, 250), createTouch(2, 380, 250)]);

    expect(onScanZoomChange).toHaveBeenCalledWith(160);
    expect(content.style.transform).toBe('translate(-120px, -120px) scale(1.6)');
  });
});
