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

export interface UsePinchToZoomResult<
  TContainer extends HTMLElement = HTMLDivElement,
  TContent extends HTMLElement = HTMLDivElement
> {
  /** 外側のタッチ検知コンテナ用 ref */
  containerRef: React.RefCallback<TContainer>;
  /** 内側の変形対象コンテンツ用 ref（未指定時はコンテナの最初の子要素に適用） */
  contentRef: React.RefCallback<TContent>;
  /** ピンチ操作中フラグ（アニメーション遅延無効化用） */
  isPinching: boolean;
  /** 現在のトランスフォームスタイル */
  transformStyle: {
    transform: string;
    transformOrigin: string;
  };
  /** 変形を原点・等倍にリセットする関数 */
  resetTransform: () => void;
}

/**
 * 指の位置（フォカルポイント）を中心に拡大縮小・パン操作を行う Transform ベースのピンチズームフック
 *
 * - スクロールバー（scrollLeft/scrollTop）の非同期クランプ問題・CSS scale 非連動問題を根本解決
 * - 2本の指の中心点（Focal Point）を不動点として計算し、指の直下にあるコンテンツが画面上で一切ズレずに拡大縮小
 * - ピンチ中の2本指パン（平行移動）も同時に追従
 * - 拡大中（scale > 1.0）の1本指ドラッグ（パン操作）を完全サポート
 * - zoom === 100（全体表示）時は自動で translate(0px, 0px) scale(1) にリセット
 */
export function usePinchToZoom<
  TContainer extends HTMLElement = HTMLDivElement,
  TContent extends HTMLElement = HTMLDivElement
>({
  zoom,
  onZoomChange,
  minZoom = 100,
  maxZoom = 200,
}: UsePinchToZoomOptions): UsePinchToZoomResult<TContainer, TContent> {
  const [containerNode, setContainerNode] = useState<TContainer | null>(null);
  const [contentNode, setContentNode] = useState<TContent | null>(null);
  const [isPinching, setIsPinching] = useState<boolean>(false);

  // トランスフォーム状態 (scale, translateX, translateY)
  const [transform, setTransform] = useState<{ scale: number; x: number; y: number }>({
    scale: zoom / 100,
    x: 0,
    y: 0,
  });

  const transformRef = useRef(transform);
  transformRef.current = transform;

  const containerRef = useCallback((node: TContainer | null) => {
    setContainerNode(node);
  }, []);

  const contentRef = useCallback((node: TContent | null) => {
    setContentNode(node);
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

  // 外部からの zoom プロパティ変更（「全体表示」ボタンや「🔍 +」「🔍 -」等）との同期
  useEffect(() => {
    const targetScale = zoom / 100;
    // ピンチ操作中または直後は外部変更ではないためスキップ
    if (isPinchingRef.current) return;

    if (Math.abs(transformRef.current.scale - targetScale) > 0.001) {
      if (zoom <= minZoom) {
        // 全体表示（初期倍率）へ戻った時は位置も原点にリセット
        const next = { scale: 1, x: 0, y: 0 };
        transformRef.current = next;
        setTransform(next);
        applyTransformToContent(next.scale, next.x, next.y);
      } else {
        // ボタン操作等による拡大縮小: コンテナ中心をピボットとしてスケール
        const cNode = containerNode;
        const rect = cNode ? cNode.getBoundingClientRect() : { width: 500, height: 500 };
        const focalX = rect.width / 2;
        const focalY = rect.height / 2;

        const currentScale = transformRef.current.scale || 1;
        const contentX = (focalX - transformRef.current.x) / currentScale;
        const contentY = (focalY - transformRef.current.y) / currentScale;

        const newX = focalX - targetScale * contentX;
        const newY = focalY - targetScale * contentY;

        const next = { scale: targetScale, x: Math.round(newX), y: Math.round(newY) };
        transformRef.current = next;
        setTransform(next);
        applyTransformToContent(next.scale, next.x, next.y);
      }
    }
  }, [zoom, minZoom, containerNode]);

  // 変形対象の要素を取得（contentNode 優先、無ければ containerNode の最初の子要素）
  const getTargetElement = useCallback((): HTMLElement | null => {
    if (contentNode) return contentNode;
    if (containerNode && containerNode.firstElementChild instanceof HTMLElement) {
      return containerNode.firstElementChild;
    }
    return null;
  }, [contentNode, containerNode]);

  // DOM への直接適用（React の再レンダリング待ちをバイパスして 120fps レスポンスを保証）
  const applyTransformToContent = useCallback(
    (scale: number, x: number, y: number, transitionNone = true) => {
      const target = getTargetElement();
      if (!target) return;
      target.style.transformOrigin = '0 0';
      if (transitionNone) {
        target.style.transition = 'none';
      }
      target.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    },
    [getTargetElement]
  );

  const resetTransform = useCallback(() => {
    const next = { scale: 1, x: 0, y: 0 };
    transformRef.current = next;
    setTransform(next);
    applyTransformToContent(1, 0, 0, false);
    onZoomChangeRef.current(100);
  }, [applyTransformToContent]);

  // ピンチ＆パンのトラッキング状態
  const isPinchingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);

  // 2本指ピンチ開始時
  const pinchStartRef = useRef<{
    dist: number;
    scale: number;
    tx: number;
    ty: number;
    focalX: number;
    focalY: number;
    contentX: number;
    contentY: number;
  }>({
    dist: 0,
    scale: 1,
    tx: 0,
    ty: 0,
    focalX: 0,
    focalY: 0,
    contentX: 0,
    contentY: 0,
  });

  // 1本指パン開始時
  const panStartRef = useRef<{
    startX: number;
    startY: number;
    tx: number;
    ty: number;
  }>({
    startX: 0,
    startY: 0,
    tx: 0,
    ty: 0,
  });

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
        // 2本指ピンチ操作開始
        isPinchingRef.current = true;
        isPanningRef.current = false;
        setIsPinching(true);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        if (dist <= 0) return;

        const rect = element.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const focalX = midX - rect.left;
        const focalY = midY - rect.top;

        const currentScale = transformRef.current.scale;
        const currentTx = transformRef.current.x;
        const currentTy = transformRef.current.y;

        // 指の直下にあるコンテンツ座標 (不動点)
        const contentX = (focalX - currentTx) / currentScale;
        const contentY = (focalY - currentTy) / currentScale;

        pinchStartRef.current = {
          dist,
          scale: currentScale,
          tx: currentTx,
          ty: currentTy,
          focalX,
          focalY,
          contentX,
          contentY,
        };
      } else if (e.touches.length === 1 && transformRef.current.scale > 1.0) {
        // 拡大中の1本指パン（ドラッグ）開始
        isPanningRef.current = true;
        isPinchingRef.current = false;
        const t = e.touches[0];
        panStartRef.current = {
          startX: t.clientX,
          startY: t.clientY,
          tx: transformRef.current.x,
          ty: transformRef.current.y,
        };
      } else {
        isPinchingRef.current = false;
        isPanningRef.current = false;
        setIsPinching(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinchingRef.current && e.touches.length === 2) {
        // 2本指ピンチズーム中
        if (e.cancelable) {
          e.preventDefault();
        }

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        const { dist: startDist, scale: startScale, contentX, contentY } = pinchStartRef.current;
        if (startDist <= 0 || dist <= 0) return;

        const ratio = dist / startDist;
        const minScale = minZoomRef.current / 100;
        const maxScale = maxZoomRef.current / 100;
        const targetScale = Math.max(minScale, Math.min(maxScale, startScale * ratio));

        // 現在の2本指中心点
        const rect = element.getBoundingClientRect();
        const currentFocalX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const currentFocalY = (t1.clientY + t2.clientY) / 2 - rect.top;

        // 指の位置を中心に維持するためのオフセット計算（Focal Point 不動点数式）
        const newTx = Math.round(currentFocalX - targetScale * contentX);
        const newTy = Math.round(currentFocalY - targetScale * contentY);

        transformRef.current = { scale: targetScale, x: newTx, y: newTy };
        applyTransformToContent(targetScale, newTx, newTy, true);

        // 外部へのズーム倍率通知
        onZoomChangeRef.current(Math.round(targetScale * 100));
      } else if (isPanningRef.current && e.touches.length === 1 && transformRef.current.scale > 1.0) {
        // 拡大中の1本指ドラッグ中
        if (e.cancelable) {
          e.preventDefault();
        }

        const t = e.touches[0];
        const dx = t.clientX - panStartRef.current.startX;
        const dy = t.clientY - panStartRef.current.startY;

        const newTx = Math.round(panStartRef.current.tx + dx);
        const newTy = Math.round(panStartRef.current.ty + dy);
        const currentScale = transformRef.current.scale;

        transformRef.current = { scale: currentScale, x: newTx, y: newTy };
        applyTransformToContent(currentScale, newTx, newTy, true);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // 3本指介入からの復帰
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        if (dist > 0) {
          isPinchingRef.current = true;
          isPanningRef.current = false;
          setIsPinching(true);

          const rect = element.getBoundingClientRect();
          const focalX = (t1.clientX + t2.clientX) / 2 - rect.left;
          const focalY = (t1.clientY + t2.clientY) / 2 - rect.top;
          const currentScale = transformRef.current.scale;
          const currentTx = transformRef.current.x;
          const currentTy = transformRef.current.y;

          pinchStartRef.current = {
            dist,
            scale: currentScale,
            tx: currentTx,
            ty: currentTy,
            focalX,
            focalY,
            contentX: (focalX - currentTx) / currentScale,
            contentY: (focalY - currentTy) / currentScale,
          };
        }
      } else if (e.touches.length === 1 && transformRef.current.scale > 1.0) {
        // ピンチ終了から1本指が残っている場合、そのままパンへ移行
        isPinchingRef.current = false;
        isPanningRef.current = true;
        setIsPinching(false);
        const t = e.touches[0];
        panStartRef.current = {
          startX: t.clientX,
          startY: t.clientY,
          tx: transformRef.current.x,
          ty: transformRef.current.y,
        };
        setTransform({ ...transformRef.current });
      } else {
        isPinchingRef.current = false;
        isPanningRef.current = false;
        setIsPinching(false);

        // 倍率がほぼ等倍（1.05以下）であれば原点にスナップバック
        if (transformRef.current.scale <= 1.05) {
          const next = { scale: 1, x: 0, y: 0 };
          transformRef.current = next;
          setTransform(next);
          applyTransformToContent(1, 0, 0, false);
          onZoomChangeRef.current(100);
        } else {
          setTransform({ ...transformRef.current });
        }
      }
    };

    // passive: false で登録し e.preventDefault() を確実に有効化
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
  }, [containerNode, applyTransformToContent]);

  return {
    containerRef,
    contentRef,
    isPinching,
    transformStyle: {
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
      transformOrigin: '0 0',
    },
    resetTransform,
  };
}
