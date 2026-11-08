import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { getExamScanImageUrl, getExamScanPageCount } from '../utils/exam-scan-helper';
import { useBodyScrollLock } from '../utils/use-body-scroll-lock';
import { sound } from '../utils/sound-effects';

export interface OriginalScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  subject: Subject;
  initialType?: 'mondai' | 'kaito';
  initialPage?: number;
  title?: string;
  allowSwitchType?: boolean;
}

export const OriginalScanModal: React.FC<OriginalScanModalProps> = ({
  isOpen,
  onClose,
  year,
  subject,
  initialType = 'mondai',
  initialPage = 1,
  title,
  allowSwitchType = true,
}) => {
  useBodyScrollLock(isOpen);

  const [scanType, setScanType] = useState<'mondai' | 'kaito'>(initialType);
  const totalPages = getExamScanPageCount(scanType, year, subject);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pages = getExamScanPageCount(initialType, year, subject);
    if (initialType === 'kaito') {
      return initialPage <= pages ? Math.max(1, initialPage) : 1;
    }
    return Math.max(1, Math.min(pages, initialPage));
  });
  const [zoom, setZoom] = useState<number>(100);

  // モーダルオープン時または初期タイプ変更時に正しく同期
  useEffect(() => {
    if (isOpen) {
      setScanType(initialType);
      const pages = getExamScanPageCount(initialType, year, subject);
      const targetPage = initialType === 'kaito'
        ? (initialPage <= pages ? Math.max(1, initialPage) : 1)
        : Math.max(1, Math.min(pages, initialPage));
      setCurrentPage(targetPage);
      setZoom(100);
    }
  }, [isOpen, initialType, initialPage, year, subject]);

  if (!isOpen) return null;

  const imageUrl = getExamScanImageUrl(scanType, year, subject, currentPage);

  const handlePrev = () => {
    sound.playPop();
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNext = () => {
    sound.playPop();
    setCurrentPage(p => Math.min(totalPages, p + 1));
  };

  const handleSwitchType = (type: 'mondai' | 'kaito') => {
    sound.playPop();
    setScanType(type);
    const pages = getExamScanPageCount(type, year, subject);
    const targetPage = type === 'kaito'
      ? 1
      : Math.max(1, Math.min(pages, initialPage));
    setCurrentPage(targetPage);
    setZoom(100);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
      data-testid="original-scan-modal"
    >
      {/* 上部ツールバー */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#1e293b',
          color: '#ffffff',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>
            {scanType === 'kaito'
              ? `✅ 原本解答 (${year}年度)`
              : (title || `📸 問題用紙原本 (${year}年度)`)}
          </span>
          {allowSwitchType && (
            <div
              style={{
                display: 'inline-flex',
                background: '#334155',
                padding: '2px',
                borderRadius: '8px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => handleSwitchType('mondai')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: scanType === 'mondai' ? '#2563eb' : 'transparent',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                data-testid="switch-scan-mondai"
              >
                📄 問題用紙
              </button>
              <button
                type="button"
                onClick={() => handleSwitchType('kaito')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: scanType === 'kaito' ? '#16a34a' : 'transparent',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                data-testid="switch-scan-kaito"
              >
                ✅ 原本解答
              </button>
            </div>
          )}
        </div>

        {/* ページめくり & ズーム */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>
            ページ: {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage <= 1}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#334155',
              color: '#ffffff',
              fontSize: '12px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.4 : 1,
            }}
            data-testid="scan-modal-prev-btn"
          >
            ◀ 前へ
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#334155',
              color: '#ffffff',
              fontSize: '12px',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.4 : 1,
            }}
            data-testid="scan-modal-next-btn"
          >
            次へ ▶
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(100, z - 20))}
              disabled={zoom <= 100}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#334155',
                color: '#ffffff',
                fontSize: '12px',
                cursor: zoom <= 100 ? 'not-allowed' : 'pointer',
              }}
              title="縮小"
            >
              🔍 -
            </button>
            <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(220, z + 20))}
              disabled={zoom >= 220}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#334155',
                color: '#ffffff',
                fontSize: '12px',
                cursor: zoom >= 220 ? 'not-allowed' : 'pointer',
              }}
              title="拡大"
            >
              🔍 +
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              marginLeft: '8px',
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            data-testid="scan-modal-close-btn"
          >
            ✕ とじる
          </button>
        </div>
      </header>

      {/* 原本画像エリア */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: zoom > 100 ? 'flex-start' : 'center',
          padding: '16px',
          boxSizing: 'border-box',
          minHeight: 0,
        }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={imageUrl}
            alt={`${scanType === 'mondai' ? '問題用紙' : '原本解答'} p.${currentPage}`}
            style={{
              maxWidth: zoom > 100 ? 'none' : '100%',
              maxHeight: zoom > 100 ? 'none' : 'calc(100vh - 120px)',
              width: zoom > 100 ? `${zoom}%` : 'auto',
              height: 'auto',
              borderRadius: '4px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              background: '#ffffff',
              objectFit: 'contain',
              transition: 'transform 0.15s ease',
            }}
            data-testid="modal-scan-image"
          />
        </div>
      </div>
    </div>
  );
};
