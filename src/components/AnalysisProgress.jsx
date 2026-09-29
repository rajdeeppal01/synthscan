'use client';

const STEPS = [
  { id: 0, label: 'Extracting video frames', icon: '🎬', description: 'Sampling key moments from your video' },
  { id: 1, label: 'Preprocessing frames', icon: '⚙️', description: 'Optimizing images for analysis' },
  { id: 2, label: 'Running AI forensic analysis', icon: '🧠', description: 'Gemini Vision analyzing each frame for synthetic artifacts' },
  { id: 3, label: 'Generating forensic report', icon: '📋', description: 'Compiling multi-signal findings' },
];

export default function AnalysisProgress({ step, progress }) {
  return (
    <div className="analysis-overlay">
      <div className="analysis-card">
        <div className="analysis-icon">🔬</div>
        <div className="analysis-title">Analyzing Video</div>
        <div className="analysis-subtitle">
          Our AI forensics engine is examining your video frame by frame
        </div>

        <ul className="steps-list">
          {STEPS.map((s) => {
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <li
                key={s.id}
                className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              >
                <div className="step-dot">
                  {isDone ? '✓' : isActive ? '◌' : s.id + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.label}</div>
                  {isActive && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>
                      {s.description}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}
