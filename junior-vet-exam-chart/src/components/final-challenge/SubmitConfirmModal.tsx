import React, { useEffect, useRef } from 'react';
import styles from './SubmitConfirmModal.module.css';

export interface SubmitConfirmModalProps {
  isOpen: boolean;
  unansweredCount: number;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  unansweredCount,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasTriggeredRef.current = false;
      // 安全側（もう少し見直す）に初期フォーカス
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // フォーカストラップ
      if (e.key === 'Tab') {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLElement[];
        if (focusable.length < 2) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (hasTriggeredRef.current || isSubmitting) return;
    hasTriggeredRef.current = true;
    onConfirm();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      data-testid="submit-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-confirm-title"
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.icon} aria-hidden="true">
          📬
        </div>
        <h3 id="submit-confirm-title" className={styles.title}>
          こたえを出していい？
        </h3>
        <p className={styles.description}>
          出したあとは、こたえを直せないよ。
          {unansweredCount > 0 && (
            <span className={styles.unansweredNotice} data-testid="unanswered-count-notice">
              まだ書いていない欄が{unansweredCount}つあるよ。
            </span>
          )}
        </p>

        <div className={styles.buttonGroup}>
          <button
            ref={cancelBtnRef}
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            data-testid="submit-cancel-btn"
          >
            もう少し見直す
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            data-testid="submit-proceed-btn"
          >
            {isSubmitting ? '提出中…' : '出す'}
          </button>
        </div>
      </div>
    </div>
  );
};

