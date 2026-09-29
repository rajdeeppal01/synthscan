'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisProgress from '@/components/AnalysisProgress';

const SUPPORTED_FORMATS = ['MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'M4V'];
const MAX_FRAMES = 8;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function extractFrames(videoFile, numFrames = MAX_FRAMES) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames = [];
    let currentFrameIdx = 0;

    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.preload = 'auto';

    video.addEventListener('error', () => reject(new Error('Failed to load video')));

    video.addEventListener('loadedmetadata', () => {
      const w = Math.min(video.videoWidth, 1280);
      const ratio = w / video.videoWidth;
      canvas.width = w;
      canvas.height = Math.round(video.videoHeight * ratio);

      const duration = video.duration;
      if (!isFinite(duration) || duration === 0) {
        reject(new Error('Cannot read video duration'));
        return;
      }

      const step = duration / (numFrames + 1);

      function captureNext() {
        if (currentFrameIdx >= numFrames) {
          URL.revokeObjectURL(video.src);
          resolve({ frames, duration });
          return;
        }
        video.currentTime = step * (currentFrameIdx + 1);
      }

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.82));
        currentFrameIdx++;
        captureNext();
      });

      captureNext();
    });
  });
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [analysisState, setAnalysisState] = useState(null); // null | 'extracting' | 'analyzing' | 'done'
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // -- Drag handlers --
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM, etc.)');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('File too large. Maximum size is 500MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setError('');
  };

  // -- Analysis --
  const startAnalysis = async () => {
    if (!selectedFile) return;

    setError('');
    setAnalysisState('extracting');
    setAnalysisStep(0);
    setProgress(10);

    try {
      // Step 0: Extract frames
      const { frames, duration } = await extractFrames(selectedFile, MAX_FRAMES);
      setAnalysisStep(1);
      setProgress(35);

      // Step 1: Send to API
      setAnalysisState('analyzing');

      const videoMeta = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        duration,
        framesExtracted: frames.length,
      };

      // Simulate progress while waiting
      const progressTimer = setInterval(() => {
        setProgress(p => Math.min(p + 3, 88));
      }, 1500);

      setAnalysisStep(2);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, videoMeta }),
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const { id } = await res.json();
      setAnalysisStep(3);
      setProgress(100);
      setAnalysisState('done');

      // Short delay to show completion
      await new Promise(r => setTimeout(r, 700));
      router.push(`/results/${id}`);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setAnalysisState(null);
      setProgress(0);
      setAnalysisStep(0);
    }
  };

  const handleUrlAnalyze = () => {
    if (!urlInput.trim()) return;
    setError('URL analysis requires yt-dlp to be configured on the server. For now, please upload a video file directly. This feature is coming soon!');
  };

  const isAnalyzing = analysisState !== null && analysisState !== 'done';

  return (
    <main className="main-content">
      {/* Analysis overlay */}
      {isAnalyzing && (
        <AnalysisProgress step={analysisStep} progress={progress} />
      )}

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>⚡</span>
          AI-Powered Forensic Analysis
        </div>
        <h1 className="hero-title">
          Is This Video <br />
          <span className="gradient-text">Real or AI Generated?</span>
        </h1>
        <p className="hero-subtitle">
          Drop any video and our multi-signal AI forensics engine will analyze every frame, 
          detect synthetic artifacts, and deliver a forensic verdict in seconds.
        </p>
      </section>

      {/* Uploader */}
      <div className="uploader-container">
        {/* Tabs */}
        <div className="uploader-tabs">
          <button
            className={`uploader-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Upload File
          </button>
          <button
            className={`uploader-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            🔗 Paste URL
          </button>
        </div>

        {/* Upload tab */}
        {activeTab === 'upload' && (
          <>
            {!selectedFile ? (
              <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-icon">🎬</div>
                <div className="drop-title">Drop your video here</div>
                <div className="drop-sub">or click to browse files</div>
                <div className="drop-formats">
                  {SUPPORTED_FORMATS.map(f => (
                    <span key={f} className="format-pill">.{f.toLowerCase()}</span>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}
                />
              </div>
            ) : (
              <>
                {/* File info */}
                <div className="selected-file-info">
                  <span className="file-icon">🎥</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{formatBytes(selectedFile.size)}</div>
                  </div>
                  <button className="btn-secondary" onClick={clearSelection} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                    ✕ Remove
                  </button>
                </div>

                {/* Video preview */}
                {videoPreviewUrl && (
                  <div className="video-preview-wrap">
                    <video src={videoPreviewUrl} controls playsInline />
                  </div>
                )}

                {/* Analyze button */}
                <div className="analyze-btn-row">
                  <button className="btn-primary" onClick={startAnalysis}>
                    🔍 Analyze Video
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* URL tab */}
        {activeTab === 'url' && (
          <div className="url-input-wrap">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Paste a direct video URL, YouTube link, or Instagram Reel
            </div>
            <div className="url-input-group">
              <input
                type="url"
                className="url-input"
                placeholder="https://youtube.com/watch?v=... or direct .mp4 URL"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <button className="btn-primary" onClick={handleUrlAnalyze}>
                Analyze
              </button>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ℹ️</span> URL support requires yt-dlp. See docs for setup.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Feature chips */}
      <div className="features-strip">
        {[
          { icon: '🧠', text: 'Gemini Vision Analysis' },
          { icon: '🔬', text: 'Frame-by-Frame Forensics' },
          { icon: '📊', text: 'Multi-Signal Scoring' },
          { icon: '📋', text: 'Forensic Report' },
          { icon: '⚡', text: 'Results in ~30 seconds' },
          { icon: '🔒', text: 'Privacy Focused' },
        ].map(({ icon, text }) => (
          <div key={text} className="feature-chip">
            <span className="chip-icon">{icon}</span>
            {text}
          </div>
        ))}
      </div>
    </main>
  );
}
