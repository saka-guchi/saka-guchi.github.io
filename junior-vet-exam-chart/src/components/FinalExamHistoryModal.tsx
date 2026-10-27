import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { FinalChallengeResult } from '../types';
import { DoctorCertificateModal } from './DoctorCertificateModal';
import { sound } from '../utils/sound-effects';

interface FinalExamHistoryModalProps {
  onClose: () => void;
}

export const FinalExamHistoryModal: React.FC<FinalExamHistoryModalProps> = ({ onClose }) => {
  const [history, setHistory] = useState<FinalChallengeResult[]>([]);
  const [selectedCertResult, setSelectedCertResult] = useState<FinalChallengeResult | null>(null);

  useEffect(() => {
    db.finalChallengeResults
      .reverse()
      .sortBy('timestamp')
      .then(results => {
        setHistory(results);
      });
  }, []);

  const getSubjectInfo = (examId: string) => {
    if (examId.includes('sansu')) return { label: '算数', icon: '📐', color: '#3b82f6' };
    if (examId.includes('shakai')) return { label: '社会', icon: '🗾', color: '#10b981' };
    return { label: '理科', icon: '🧪', color: '#ec4899' };
  };

  const formatJstDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  // 各教科のベストスコア
  const bestScores: Record<string, { best: number; passed: boolean }> = {
    rika: { best: 0, passed: false },
    sansu: { best: 0, passed: false },
    shakai: { best: 0, passed: false },
  };

  history.forEach(r => {
    const subKey = r.examId.includes('sansu') ? 'sansu' : r.examId.includes('shakai') ? 'shakai' : 'rika';
    if (r.score > bestScores[subKey].best) {
      bestScores[subKey].best = r.score;
    }
    if (r.passed) {
      bestScores[subKey].passed = true;
    }
  });

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '16px',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
        data-testid="exam-history-modal"
      >
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '20px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '2px solid var(--border)',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                  合格ドクター認定試験 採点カルテ・成績表
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                  これまでの本番模試・実力テストの受験記録（保護者の方への共有用）
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                padding: '4px 8px',
              }}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* コンテンツエリア */}
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 3教科最高得点サマリーカード */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {[
                { key: 'rika', label: '理科', icon: '🧪', color: '#ec4899' },
                { key: 'sansu', label: '算数', icon: '📐', color: '#3b82f6' },
                { key: 'shakai', label: '社会', icon: '🗾', color: '#10b981' },
              ].map(sub => {
                const data = bestScores[sub.key];
                return (
                  <div
                    key={sub.key}
                    style={{
                      background: 'var(--surface-subtle)',
                      border: `1.5px solid ${data.passed ? sub.color : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: sub.color }}>
                      {sub.icon} {sub.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>
                      {data.best > 0 ? `${data.best} 点` : '--'}
                    </div>
                    <div style={{ fontSize: '11px', color: data.passed ? '#15803d' : 'var(--text-subtle)', fontWeight: 'bold' }}>
                      {data.passed ? '👑 合格認定済' : data.best > 0 ? '✏️ チャレンジ中' : '未受験'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 履歴リスト */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text)' }}>
                📝 受験履歴一覧（全 {history.length} 件）
              </h4>

              {history.length === 0 ? (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: 'var(--text-subtle)',
                    background: 'var(--surface-subtle)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                >
                  まだ認定試験の受験履歴がありません。<br />
                  ホーム画面の「合格ドクター認定試験を受ける」から腕試しに挑戦してみましょう！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map(item => {
                    const sub = getSubjectInfo(item.examId);
                    const isPerfect = item.score === 100;

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--surface)',
                          border: `1.5px solid ${item.passed ? '#86efac' : 'var(--border)'}`,
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        }}
                        data-testid={`history-item-${item.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>
                            {isPerfect ? '🎖️' : item.passed ? '👑' : '✏️'}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  padding: '1px 8px',
                                  borderRadius: '10px',
                                  background: `${sub.color}20`,
                                  color: sub.color,
                                }}
                              >
                                {sub.icon} {sub.label}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                                {item.stage === 1 ? 'Stage 1（過去問本番）' : 'Stage 2（同等未見問題）'}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              📅 {formatJstDate(item.timestamp)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '18px',
                                fontWeight: '800',
                                color: item.passed ? '#15803d' : 'var(--text)',
                              }}
                            >
                              {item.score} <span style={{ fontSize: '12px' }}>点</span>
                            </div>
                            <div style={{ fontSize: '11px', color: item.passed ? '#15803d' : '#d97706', fontWeight: 'bold' }}>
                              {item.passed ? '合格' : 'もう一歩'}
                            </div>
                          </div>

                          {item.passed && (
                            <button
                              onClick={() => {
                                sound.playPop();
                                setSelectedCertResult(item);
                              }}
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                              data-testid={`view-cert-btn-${item.id}`}
                            >
                              📜 認定証
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 認定証再表示モーダル */}
      {selectedCertResult && (() => {
        const examId = selectedCertResult.examId;
        const s1Passed = history.some(h => h.examId === examId && h.stage === 1 && h.passed);
        const s2Passed = history.some(h => h.examId === examId && h.stage === 2 && h.passed);
        const hasMasterBadge = s1Passed && s2Passed;
        return (
          <DoctorCertificateModal
            onClose={() => setSelectedCertResult(null)}
            examTitle={
              selectedCertResult.stage === 1
                ? `2024年度 ${getSubjectInfo(selectedCertResult.examId).label} 過去問`
                : `Stage 2 ${getSubjectInfo(selectedCertResult.examId).label} 同等未見問題`
            }
            isPerfectScore={selectedCertResult.score === 100}
            hasMasterBadge={hasMasterBadge}
          />
        );
      })()}
    </>
  );
};

