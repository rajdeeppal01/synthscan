'use client';

import { useEffect, useState, useRef } from 'react';

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(score) {
  if (score >= 0.75) return '#ef4444';
  if (score >= 0.5) return '#f59e0b';
  if (score >= 0.3) return '#a78bfa';
  return '#22c55e';
}

export default function ScoreRing({ score, label = 'AI PROBABILITY' }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    const duration = 1400;

    function animate() {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = eased * score;
      setDisplayScore(Math.round(current * 100));
      setAnimatedScore(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  const offset = CIRCUMFERENCE - (animatedScore * CIRCUMFERENCE);
  const color = getColor(score);

  return (
    <div className="score-ring-wrap">
      <div className="score-ring-container">
        <svg className="score-ring-svg" width="180" height="180" viewBox="0 0 180 180">
          <circle
            className="score-ring-bg"
            cx="90"
            cy="90"
            r={RADIUS}
          />
          <circle
            className="score-ring-fill"
            cx="90"
            cy="90"
            r={RADIUS}
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="score-ring-text">
          <span className="score-number" style={{ color }}>
            {displayScore}%
          </span>
          <span className="score-label">{label}</span>
        </div>
      </div>
    </div>
  );
}
