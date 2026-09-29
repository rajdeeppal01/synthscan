'use client';

import { useEffect, useState } from 'react';

function getSignalColor(prob) {
  if (prob === null || prob === undefined) return 'var(--text-muted)';
  if (prob >= 0.75) return 'var(--danger)';
  if (prob >= 0.5) return 'var(--warning)';
  if (prob >= 0.3) return 'var(--violet-light)';
  return 'var(--success)';
}

function getBadgeClass(prob) {
  if (prob === null || prob === undefined) return 'badge-neutral';
  if (prob >= 0.75) return 'badge-danger';
  if (prob >= 0.5) return 'badge-warning';
  if (prob >= 0.3) return 'badge-neutral';
  return 'badge-success';
}

function getBadgeLabel(prob, available) {
  if (!available) return 'N/A';
  if (prob === null || prob === undefined) return 'N/A';
  if (prob >= 0.75) return 'HIGH RISK';
  if (prob >= 0.5) return 'SUSPICIOUS';
  if (prob >= 0.3) return 'UNCERTAIN';
  return 'LOW RISK';
}

export default function SignalCard({ signal }) {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setBarWidth(signal.probability != null ? signal.probability * 100 : 0);
    }, 300);
    return () => clearTimeout(t);
  }, [signal.probability]);

  const color = getSignalColor(signal.probability);
  const displayProb = signal.probability != null ? `${Math.round(signal.probability * 100)}%` : '—';

  return (
    <div className="signal-card" style={{ borderColor: signal.available ? `${color}22` : 'var(--border-subtle)' }}>
      <div className="signal-header">
        <div className="signal-name">
          {signal.available ? '🟢' : '⚪'} {signal.name}
        </div>
        <span className={`signal-badge ${getBadgeClass(signal.probability)}`}>
          {getBadgeLabel(signal.probability, signal.available)}
        </span>
      </div>

      <div className="signal-score-text" style={{ color }}>
        {displayProb}
      </div>

      <div className="signal-description">{signal.description}</div>

      {signal.available && signal.probability != null && (
        <div className="signal-bar-wrap">
          <div
            className="signal-bar-fill"
            style={{ width: `${barWidth}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
          />
        </div>
      )}

      {!signal.available && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Configure API key to enable
        </div>
      )}

      {/* Metadata findings */}
      {signal.findings && signal.findings.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {signal.findings.map((f, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '4px', display: 'flex', gap: '6px' }}>
              <span>⚠</span> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
