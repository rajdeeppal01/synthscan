'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ScoreRing from '@/components/ScoreRing';
import SignalCard from '@/components/SignalCard';
import FrameGallery from '@/components/FrameGallery';

function formatBytes(b) {
  if (!b) return '—';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function getVerdictConfig(verdict) {
  switch (verdict) {
    case 'LIKELY AI GENERATED':
      return { emoji: '🤖', className: 'verdict-ai', label: 'Forensic Verdict', color: 'var(--danger)' };
    case 'POSSIBLY AI GENERATED':
      return { emoji: '⚠️', className: 'verdict-possible', label: 'Forensic Verdict', color: 'var(--warning)' };
    case 'LIKELY AUTHENTIC':
      return { emoji: '✅', className: 'verdict-authentic', label: 'Forensic Verdict', color: 'var(--success)' };
    default:
      return { emoji: '🔍', className: 'verdict-inconclusive', label: 'Forensic Verdict', color: 'var(--text-secondary)' };
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/results/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Result not found or expired');
        return res.json();
      })
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'pulse 2s ease infinite' }}>🔬</div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading results...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Result Not Found</div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>{error}</div>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              ← Analyze Another Video
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { compositeScore, verdict, confidence, forensicNarrative, keyEvidence, technicalIndicators, signals, frameAnalysis, videoMeta, analyzedAt } = result;
  const verdictConfig = getVerdictConfig(verdict);
  const avgFrameProb = frameAnalysis?.reduce((a, f) => a + f.aiProbability, 0) / (frameAnalysis?.length || 1);
  const maxFrameProb = frameAnalysis ? Math.max(...frameAnalysis.map(f => f.aiProbability)) : 0;
  const flaggedFrames = frameAnalysis?.filter(f => f.aiProbability >= 0.7).length || 0;
  const allArtifacts = [...new Set(frameAnalysis?.flatMap(f => f.artifactsFound) || [])];

  return (
    <main className="main-content">
      <div className="results-page">
        {/* Back link */}
        <Link href="/" className="back-link">
          ← Analyze Another Video
        </Link>

        {/* Verdict Banner */}
        <div className={`verdict-banner ${verdictConfig.className}`} style={{ marginBottom: '28px' }}>
          <div className="verdict-emoji">{verdictConfig.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="verdict-label">{verdictConfig.label}</div>
            <div className="verdict-text" style={{ color: verdictConfig.color }}>{verdict}</div>
            <div className="verdict-confidence">
              Confidence: <strong>{confidence?.toUpperCase()}</strong>
              {videoMeta?.name && (
                <span style={{ marginLeft: 16, color: 'var(--text-muted)' }}>
                  📁 {videoMeta.name}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <ScoreRing score={compositeScore} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{frameAnalysis?.length || 0}</div>
            <div className="stat-label">Frames Analyzed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{flaggedFrames}</div>
            <div className="stat-label">Flagged Frames</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(maxFrameProb * 100)}%</div>
            <div className="stat-label">Peak Suspicion</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{allArtifacts.length}</div>
            <div className="stat-label">Artifacts Found</div>
          </div>
        </div>

        {/* Signal Cards */}
        <div style={{ marginBottom: '8px' }}>
          <div className="card-title">
            <span className="card-title-icon">📡</span>
            Detection Signals
          </div>
        </div>
        <div className="signals-grid" style={{ marginBottom: '28px' }}>
          {signals && Object.values(signals).map((signal) => (
            <SignalCard key={signal.name} signal={signal} />
          ))}
        </div>

        {/* Frame Gallery + Forensic Report */}
        <div className="results-grid">
          {/* Forensic Report */}
          <div className="glass-card">
            <div className="card-title">
              <span className="card-title-icon">📋</span>
              Forensic Report
            </div>

            <div className="forensic-report">
              <p>{forensicNarrative}</p>
            </div>

            {keyEvidence && keyEvidence.length > 0 && (
              <>
                <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  Key Evidence
                </div>
                <ul className="evidence-list">
                  {keyEvidence.map((e, i) => (
                    <li key={i} className="evidence-item">
                      <span>🔎</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {technicalIndicators && technicalIndicators.length > 0 && (
              <>
                <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  Technical Indicators
                </div>
                {technicalIndicators.map((t, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--cyan)' }}>▶</span> {t}
                  </div>
                ))}
              </>
            )}

            {/* Video metadata */}
            {videoMeta && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Video Metadata
                </div>
                {[
                  ['File', videoMeta.name],
                  ['Size', formatBytes(videoMeta.size)],
                  ['Duration', videoMeta.duration ? `${videoMeta.duration.toFixed(1)}s` : '—'],
                  ['Analyzed', formatDate(analyzedAt)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Frame Gallery */}
          <div className="glass-card">
            <div className="card-title">
              <span className="card-title-icon">🎬</span>
              Frame Analysis
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'var(--violet-dim)', color: 'var(--violet-light)', padding: '2px 8px', borderRadius: '20px' }}>
                Click to inspect
              </span>
            </div>

            {/* Frame probability bars */}
            {frameAnalysis && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {frameAnalysis.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', width: '50px', flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(148,163,184,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${f.aiProbability * 100}%`,
                        background: f.aiProbability >= 0.75 ? 'var(--danger)' : f.aiProbability >= 0.5 ? 'var(--warning)' : 'var(--success)',
                        borderRadius: '999px',
                        transition: 'width 1s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', width: '36px', textAlign: 'right', flexShrink: 0 }}>
                      {Math.round(f.aiProbability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <FrameGallery frames={frameAnalysis} />

            {allArtifacts.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  All Detected Artifacts
                </div>
                <div className="artifacts-tags">
                  {allArtifacts.map((a, i) => (
                    <span key={i} className="artifact-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '20px 0', marginTop: '8px' }}>
          <Link
            href="/"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block', padding: '16px 40px', fontSize: '1rem' }}
          >
            🔍 Analyze Another Video
          </Link>
        </div>
      </div>
    </main>
  );
}
