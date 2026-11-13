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

export interface UsePinchToZoomResult<T extends HTMLElement = HTMLDivElement> {
  containerRef: React.RefCallback<T>;
  isPinching: boolean;
}

/**
 * 2本指ピンチ操作による原本領域の拡大縮小フック
 *
 * - Callback Ref による DOM ノード検知（条件付きレンダリング・モーダル開閉にも完全追従）
 * - 2本指操作中のみブラウザ全体のviewportズームを抑止（preventDefault）
 * - 指の位置（フォカルポイント / 2本指の中心点）を中心に拡大縮小し、スクロール位置を追従
 * - ピンチ中の2本指パン（平行移動）も同時に追従
 * - 1本指操作時はネイティブスクロールを維持
 */
export function usePinchToZoom<T extends HTMLElement = HTMLDivElement>({
  zoom,
  onZoomChange,
  minZoom = 100,
  maxZoom = 200,
}: UsePinchToZoomOptions): UsePinchToZoomResult<T> {
  const [containerNode, setContainerNode] = useState<T | null>(null);
  const [isPinching, setIsPinching] = useState<boolean>(false);

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

  // 指の中心点（コンテナ可視領域相対座標）と開始時スクロール位置
  const initialFocalRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialScrollRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

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
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        if (dist <= 0) return;

        isPinchingRef.current = true;
        setIsPinching(true);
        initialDistanceRef.current = dist;
        initialZoomRef.current = zoomRef.current;

        const rect = element.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        initialFocalRef.current = {
          x: midX - rect.left,
          y: midY - rect.top,
        };

        initialScrollRef.current = {
          left: element.scrollLeft,
          top: element.scrollTop,
        };
      } else {
        isPinchingRef.current = false;
        setIsPinching(false);
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

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = getTouchDistance(t1, t2);
      if (initialDistanceRef.current <= 0 || currentDistance <= 0) {
        return;
      }

      const ratio = currentDistance / initialDistanceRef.current;
      const targetZoom = Math.round(initialZoomRef.current * ratio);
      const clampedZoom = Math.max(minZoomRef.current, Math.min(maxZoomRef.current, targetZoom));

      // ズーム更新通知
      onZoomChangeRef.current(clampedZoom);

      // 指の位置（ピンチ中心点）を中心に拡大縮小するためのスクロール位置計算
      if (initialZoomRef.current > 0) {
        const effectiveRatio = clampedZoom / initialZoomRef.current;
        const rect = element.getBoundingClientRect();
        const currentMidX = (t1.clientX + t2.clientX) / 2;
        const currentMidY = (t1.clientY + t2.clientY) / 2;

        const currentFocalX = currentMidX - rect.left;
        const currentFocalY = currentMidY - rect.top;

        // ピンチ開始時に指の真下にあったスクロールコンテンツ座標
        const startContentX = initialScrollRef.current.left + initialFocalRef.current.x;
        const startContentY = initialScrollRef.current.top + initialFocalRef.current.y;

        // 新しい拡大率において、同じコンテンツ上の点が現在の指位置に来るようスクロールを算出
        const targetScrollLeft = Math.max(0, Math.round(startContentX * effectiveRatio - currentFocalX));
        const targetScrollTop = Math.max(0, Math.round(startContentY * effectiveRatio - currentFocalY));

        element.scrollLeft = targetScrollLeft;
        element.scrollTop = targetScrollTop;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // 3本指等の介入から2本指に戻った場合の復帰（リベース）
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        if (dist > 0) {
          isPinchingRef.current = true;
          setIsPinching(true);
          initialDistanceRef.current = dist;
          initialZoomRef.current = zoomRef.current;
          const rect = element.getBoundingClientRect();
          initialFocalRef.current = {
            x: (t1.clientX + t2.clientX) / 2 - rect.left,
            y: (t1.clientY + t2.clientY) / 2 - rect.top,
          };
          initialScrollRef.current = {
            left: element.scrollLeft,
            top: element.scrollTop,
          };
        }
      } else {
        isPinchingRef.current = false;
        setIsPinching(false);
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

  return { containerRef, isPinching };
}
