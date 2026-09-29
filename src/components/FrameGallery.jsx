'use client';

import { useState } from 'react';

function getFlagClass(prob) {
  if (prob >= 0.75) return 'flagged';
  if (prob >= 0.5) return 'suspicious';
  return '';
}

function getScoreColor(prob) {
  if (prob >= 0.75) return { bg: 'var(--danger-dim)', color: 'var(--danger)' };
  if (prob >= 0.5) return { bg: 'var(--warning-dim)', color: 'var(--warning)' };
  return { bg: 'var(--success-dim)', color: 'var(--success)' };
}

export default function FrameGallery({ frames }) {
  const [selectedFrame, setSelectedFrame] = useState(null);

  if (!frames || frames.length === 0) return null;

  return (
    <>
      <div className="frame-gallery">
        {frames.map((frame, i) => {
          const prob = frame.aiProbability;
          const cls = getFlagClass(prob);
          const { bg, color } = getScoreColor(prob);

          return (
            <div
              key={i}
              className={`frame-thumb ${cls}`}
              onClick={() => setSelectedFrame(frame)}
              title={`Frame ${i + 1}: ${Math.round(prob * 100)}% AI probability`}
            >
              {frame.frameData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frame.frameData} alt={`Frame ${i + 1}`} loading="lazy" />
              )}
              <span className="frame-label">
                {frame.timestamp != null ? `${frame.timestamp.toFixed(1)}s` : `#${i + 1}`}
              </span>
              <span
                className="frame-score-badge"
                style={{ background: bg, color }}
              >
                {Math.round(prob * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Frame detail modal */}
      {selectedFrame && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,7,18,0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setSelectedFrame(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              maxWidth: '720px',
              width: '100%',
              boxShadow: 'var(--shadow-glow)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                Frame Analysis
                {selectedFrame.timestamp != null && (
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.875rem' }}>
                    @ {selectedFrame.timestamp.toFixed(1)}s
                  </span>
                )}
              </h3>
              <button
                onClick={() => setSelectedFrame(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {selectedFrame.frameData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedFrame.frameData}
                alt="Selected frame"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '16px', objectFit: 'contain', maxHeight: '400px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>AI Probability</div>
                <div style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: getScoreColor(selectedFrame.aiProbability).color }}>
                  {Math.round(selectedFrame.aiProbability * 100)}%
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Confidence</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize', paddingTop: '8px' }}>
                  {selectedFrame.confidence}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              {selectedFrame.reasoning}
            </div>

            {selectedFrame.artifactsFound && selectedFrame.artifactsFound.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Detected Artifacts</div>
                <div className="artifacts-tags">
                  {selectedFrame.artifactsFound.map((a, i) => (
                    <span key={i} className="artifact-tag">{a}</span>
                  ))}
                </div>
              </>
            )}

            {selectedFrame.suspiciousRegion && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--warning-dim)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--warning)' }}>
                🎯 Suspicious region: {selectedFrame.suspiciousRegion}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
