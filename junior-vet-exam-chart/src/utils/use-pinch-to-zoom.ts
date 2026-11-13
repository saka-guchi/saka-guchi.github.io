import { useState, useCallback, useEffect, useRef } from 'react';

export interface UsePinchToZoomOptions {
  /** 現在のズーム倍率（パーセント数値、例: 100） */
  zoom: number;
  /** ズーム倍率変更ハンドラ */
  onZoomChange: (newZoom: number | ((prev: number) => number)) => void;
  /** 最小ズーム倍率（デフォルト: 100） */
  minZoom?: number;
  /** 最大ズーム倍率（デフォルト: 200） */
  maxZoom?: number;
}

/**
 * 2本指ピンチ操作による原本領域の拡大縮小フック
 *
 * - Callback Ref による DOM ノード検知（条件付きレンダリング・モーダル開閉にも完全追従）
 * - 2本指操作中のみブラウザ全体のviewportズームを抑止（preventDefault）
 * - 指の距離比率に応じてズーム倍率を更新
 * - 1本指操作時はネイティブスクロールを維持
 */
export function usePinchToZoom<T extends HTMLElement = HTMLDivElement>({
  zoom,
  onZoomChange,
  minZoom = 100,
  maxZoom = 200,
}: UsePinchToZoomOptions): {
  containerRef: React.RefCallback<T>;
} {
  const [containerNode, setContainerNode] = useState<T | null>(null);

  const containerRef = useCallback((node: T | null) => {
    setContainerNode(node);
  }, []);

  // 常に最新の props/state を参照するための ref
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  const minZoomRef = useRef(minZoom);
  minZoomRef.current = minZoom;

  const maxZoomRef = useRef(maxZoom);
  maxZoomRef.current = maxZoom;

  // ピンチジェスチャーのトラッキング状態
  const initialDistanceRef = useRef<number>(0);
  const initialZoomRef = useRef<number>(zoom);
  const isPinchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerNode) return;
    const element = containerNode;

    const getTouchDistance = (t1: Touch, t2: Touch): number => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        initialDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        initialZoomRef.current = zoomRef.current;
      } else {
        isPinchingRef.current = false;
        initialDistanceRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPinchingRef.current || e.touches.length !== 2) {
        return;
      }

      // ブラウザ標準の画面全体ピンチズームを抑止
      if (e.cancelable) {
        e.preventDefault();
      }

      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      if (initialDistanceRef.current <= 0 || currentDistance <= 0) {
        return;
      }

      const ratio = currentDistance / initialDistanceRef.current;
      const targetZoom = Math.round(initialZoomRef.current * ratio);
      const clampedZoom = Math.max(minZoomRef.current, Math.min(maxZoomRef.current, targetZoom));

      onZoomChangeRef.current(clampedZoom);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // 3本指等の介入から2本指に戻った場合の復帰（リベース）
        isPinchingRef.current = true;
        initialDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        initialZoomRef.current = zoomRef.current;
      } else {
        isPinchingRef.current = false;
        initialDistanceRef.current = 0;
      }
    };

    // passive: false で touchmove を登録して e.preventDefault() を有効化
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerNode]);

  return { containerRef };
}
