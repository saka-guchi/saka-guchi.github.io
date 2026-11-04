import React from 'react';

export interface PauseConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: React.ReactNode;
  resumeLabel?: string;
  saveQuitLabel?: string;
  saveQuitTitle?: string;
  resetLabel?: string;
  onResume: () => void;
  onSaveAndQuit: () => void;
  onResetAndQuit: () => void;
  testId?: string;
}

export const PauseConfirmModal: React.FC<PauseConfirmModalProps> = ({
  isOpen,
  title = '一時停止中',
  description = (
    <>
      タイマーと学習を停止しています。<br />
      一息ついて、どうするか選んでね。
    </>
  ),
  resumeLabel = '▶ 学習をつづける',
  saveQuitLabel = '💾 ここまでの記録を残してホームへ',
  saveQuitTitle = 'ここまでの記録を残して安全に終了します',
  resetLabel = '🔄 この学習をリセットして最初から（ホームへ）',
  onResume,
  onSaveAndQuit,
  onResetAndQuit,
  testId = 'study-pause-modal',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '20px',
        boxSizing: 'border-box',
      }}
      data-testid={testId}
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          padding: '36px 28px 28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <div style={{ fontSize: '48px', lineHeight: 1 }}>☕</div>
        <h2
          style={{
            font: 'var(--font-heading-lg)',
            color: 'var(--text-main, #0f172a)',
            margin: 0,
            fontSize: '22px',
            fontWeight: 800,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            font: 'var(--font-body)',
            color: 'var(--text-subtle, #64748b)',
            margin: 0,
            lineHeight: '1.6',
            fontSize: '14px',
          }}
        >
          {description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
          {/* 1. 再開する */}
          <button
            type="button"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '15px',
              fontWeight: 800,
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--primary, #6366f1)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
            onClick={onResume}
            data-testid="study-resume-btn"
          >
            {resumeLabel}
          </button>

          {/* 2. ここまでの記録を保存してホームへ */}
          <button
            type="button"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--surface-subtle, #f8fafc)',
              border: '1.5px solid var(--border, #cbd5e1)',
              color: 'var(--text-main, #1e293b)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--surface-subtle, #f8fafc)';
              e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
            }}
            onClick={onSaveAndQuit}
            data-testid="study-pause-quit-btn"
            title={saveQuitTitle}
          >
            {saveQuitLabel}
          </button>

          {/* 3. この学習をやめる（最初からやり直す） */}
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-subtle, #64748b)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px',
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-subtle, #64748b)')}
            onClick={onResetAndQuit}
            data-testid="study-pause-reset-btn"
          >
            {resetLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
