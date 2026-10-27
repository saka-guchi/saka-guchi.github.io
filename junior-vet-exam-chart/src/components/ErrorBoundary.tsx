import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('junior_vet_theme');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#f8fafc',
            color: '#1e293b',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾🩹</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            カルテの読み込みで少しトラブルが発生しました
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', lineHeight: '1.6', marginBottom: '20px' }}>
            動物クリニックのカルテデータを再読み込みします。下のボタンを押してください。
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            🔄 もう一度読み込む
          </button>
          {this.state.error && (
            <pre
              style={{
                marginTop: '24px',
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#dc2626',
                maxWidth: '90%',
                overflowX: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

