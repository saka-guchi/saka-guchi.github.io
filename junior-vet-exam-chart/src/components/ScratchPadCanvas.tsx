import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './ScratchPadCanvas.module.css';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

export interface ScratchPadCanvasProps {
  initialHeight?: number;
  maxHeight?: number;
  className?: string;
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const ScratchPadCanvas: React.FC<ScratchPadCanvasProps> = ({
  initialHeight = 220,
  className,
  title = '✏️ 手書き計算メモ・筆算スペース',
  onClose,
  showCloseButton = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#1e293b');
  const [width, setWidth] = useState<number>(3);
  const [height, setHeight] = useState<number>(initialHeight);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // 再描画関数
  const redrawAllStrokes = useCallback((ctx: CanvasRenderingContext2D, strokeList: Stroke[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const s of strokeList) {
      if (s.points.length === 0) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
      }

      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  // Canvasのサイズ設定（高DPI対応）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawAllStrokes(ctx, strokes);
      }
    }
  }, [height, redrawAllStrokes, strokes]);

  // ポインターイベントによる描画
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: Stroke = {
      points: [{ x, y }],
      color,
      width: tool === 'eraser' ? 18 : width,
      isEraser: tool === 'eraser',
    };
    currentStrokeRef.current = newStroke;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (newStroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = newStroke.width;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = newStroke.color;
      ctx.lineWidth = newStroke.width;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stroke = currentStrokeRef.current;
    stroke.points.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.width;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
    }

    const len = stroke.points.length;
    if (len >= 2) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[len - 2].x, stroke.points[len - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (currentStrokeRef.current) {
      const finishedStroke = currentStrokeRef.current;
      setStrokes(prev => [...prev, finishedStroke]);
      currentStrokeRef.current = null;
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) redrawAllStrokes(ctx, updated);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleExpand = () => {
    if (isExpanded) {
      setHeight(initialHeight);
      setIsExpanded(false);
    } else {
      setHeight(initialHeight + 160);
      setIsExpanded(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`.trim()}
      data-testid="scratch-pad-canvas"
    >
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-subtle)', marginRight: '4px' }}>
            {title}
          </span>
          <button
            type="button"
            className={`${styles.toolBtn} ${tool === 'pen' && color === '#1e293b' ? styles.toolBtnActive : ''}`}
            onClick={() => {
              setTool('pen');
              setColor('#1e293b');
              setWidth(3);
            }}
            title="黒ペン"
            data-testid="scratch-pen-black"
          >
            <span className={styles.colorDot} style={{ background: '#1e293b' }} />
            <span>黒</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${tool === 'pen' && color === '#ef4444' ? styles.toolBtnActive : ''}`}
            onClick={() => {
              setTool('pen');
              setColor('#ef4444');
              setWidth(3);
            }}
            title="赤ペン"
            data-testid="scratch-pen-red"
          >
            <span className={styles.colorDot} style={{ background: '#ef4444' }} />
            <span>赤</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${tool === 'pen' && color === '#3b82f6' ? styles.toolBtnActive : ''}`}
            onClick={() => {
              setTool('pen');
              setColor('#3b82f6');
              setWidth(3);
            }}
            title="青ペン"
            data-testid="scratch-pen-blue"
          >
            <span className={styles.colorDot} style={{ background: '#3b82f6' }} />
            <span>青</span>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${tool === 'eraser' ? styles.toolBtnActive : ''}`}
            onClick={() => setTool('eraser')}
            title="消しゴム"
            data-testid="scratch-eraser-btn"
          >
            <span>🧽 消しゴム</span>
          </button>
        </div>

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="1つ戻す"
            data-testid="scratch-undo-btn"
          >
            <span>↩ もどす</span>
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="全消去"
            data-testid="scratch-clear-btn"
          >
            <span>🗑 全消去</span>
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={toggleExpand}
            title={isExpanded ? '高さを標準に戻す' : '広げる'}
            data-testid="scratch-expand-btn"
          >
            <span>{isExpanded ? '↕ 標準' : '↕ 広げる'}</span>
          </button>
          {showCloseButton && onClose && (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={onClose}
              title="閉じる"
              data-testid="scratch-close-btn"
            >
              <span>✕ 閉じる</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.canvasWrapper}
        style={{ height: `${height}px` }}
        data-testid="scratch-canvas-wrapper"
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          data-testid="scratch-canvas"
        />
        {strokes.length === 0 && (
          <div className={styles.emptyPlaceholder}>
            <span>✏️ ここに計算の過程やメモを自由に書けます</span>
          </div>
        )}
      </div>
    </div>
  );
};
