# SynthScan — AI Video Authenticity Detector

> Upload any video. SynthScan uses multi-signal AI forensics to determine whether it was AI-generated.

---

## 🔬 What is SynthScan?

SynthScan is an AI-powered forensic tool that analyzes videos for signs of synthetic (AI) generation. Built for the era of Sora, Runway, Kling, and HeyGen — where AI-generated video is increasingly indistinguishable from reality.

### How it works

1. **Upload** a video file (MP4, MOV, WebM, etc.)
2. **Frame extraction** — 8 key frames are sampled client-side using Canvas API (no upload of the full video)
3. **Gemini Vision analysis** — each frame is inspected for AI artifacts (unnatural textures, lighting inconsistencies, facial anomalies, diffusion model signatures)
4. **Forensic report** — a composite score + detailed narrative is generated
5. **Verdict** — `LIKELY AI GENERATED`, `POSSIBLY AI GENERATED`, `LIKELY AUTHENTIC`, or `INCONCLUSIVE`

---

## 🚀 Features

- 🎬 **Drag-and-drop upload** with in-browser video preview
- 🖼️ **Client-side frame extraction** — only frames are sent to the API, not the raw video
- 🧠 **Gemini 2.0 Flash Vision** — multi-frame artifact detection
- 📡 **Multi-signal scoring** — Gemini Vision + Hive AI Detection + Metadata forensics
- 📋 **AI-written forensic report** with key evidence and technical indicators
- 🎯 **Per-frame gallery** — click any frame to see its individual analysis
- ⭕ **Animated score ring** — color-coded from green (authentic) to red (AI generated)
- 🌑 **Premium dark UI** — glassmorphism design with smooth animations

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Vision | Google Gemini 2.0 Flash |
| AI Detection (optional) | Hive Moderation API |
| Frame Extraction | HTML5 Canvas API (client-side) |
| Styling | Vanilla CSS (custom design system) |
| Deployment | Vercel / Render |

---

## ⚙️ Local Setup

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/synthscan.git
cd synthscan

# 2. Install dependencies
npm install

# 3. Add environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `HIVE_API_KEY` | ⬜ Optional | Hive Moderation API key — adds a second AI-detection signal |

---

## 📦 Deployment

### Vercel (Recommended)

1. Push this repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add `GEMINI_API_KEY` in Project Settings → Environment Variables
4. Deploy!

### Render

1. Connect this repo on [render.com](https://render.com)
2. Render will auto-detect `render.yaml`
3. Add `GEMINI_API_KEY` as an environment variable in the Render dashboard

---

## ⚠️ Accuracy Note

AI video detection is an active research area. SynthScan uses state-of-the-art models but is not 100% accurate. Results should be treated as forensic signals, not definitive proof.

---

## 📄 License

MIT © Rajdeep Pal
