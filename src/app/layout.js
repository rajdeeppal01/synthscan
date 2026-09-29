import './globals.css';

export const metadata = {
  title: 'SynthScan — AI Video Authenticity Detector',
  description: 'Upload any video or paste a link to detect whether AI was used in its creation. Powered by Gemini Vision multi-signal forensic analysis.',
  keywords: 'AI video detector, deepfake detection, synthetic video, AI generated content, video forensics',
  openGraph: {
    title: 'SynthScan — AI Video Authenticity Detector',
    description: 'Detect AI-generated video content with forensic precision.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <nav className="navbar">
          <a href="/" className="navbar-logo">
            <div className="logo-icon">🔬</div>
            SynthScan
          </a>
          <span className="navbar-badge">BETA</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
