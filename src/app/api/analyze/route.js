import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyzeFrame, generateForensicReport } from '@/lib/gemini';
import { analyzeWithHive, analyzeMetadata } from '@/lib/hive';
import { saveResult } from '@/lib/store';

export const maxDuration = 120; // 2 min timeout for Vercel

export async function POST(request) {
  try {
    const body = await request.json();
    const { frames, videoMeta } = body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      );
    }

    console.log(`[SynthScan] Analyzing ${frames.length} frames for "${videoMeta?.name || 'unknown'}"`);

    // --- 1. Frame-by-frame Gemini Vision analysis ---
    const frameResults = await Promise.all(
      frames.map((frame, idx) => {
        console.log(`[SynthScan] Analyzing frame ${idx + 1}/${frames.length}`);
        return analyzeFrame(frame, 'image/jpeg');
      })
    );

    // --- 2. Hive supplementary analysis ---
    const hiveResult = await analyzeWithHive(frames);

    // --- 3. Metadata forensics ---
    const metaResult = analyzeMetadata(
      videoMeta?.name || '',
      videoMeta?.size || 0,
      videoMeta?.duration || 0
    );

    // --- 4. Generate overall forensic report ---
    const report = await generateForensicReport(frameResults);

    // --- 5. Compute composite score ---
    let compositeScore = report.overall_probability;
    let weights = 1;

    if (hiveResult) {
      compositeScore += hiveResult.probability * 0.4;
      weights += 0.4;
    }
    if (metaResult.probability > 0) {
      compositeScore += metaResult.probability * 0.15;
      weights += 0.15;
    }
    compositeScore = compositeScore / weights;

    // --- 6. Build final result object ---
    const result = {
      id: uuidv4(),
      analyzedAt: new Date().toISOString(),
      videoMeta,
      compositeScore,
      verdict: report.verdict,
      confidence: report.confidence,
      forensicNarrative: report.forensic_narrative,
      keyEvidence: report.key_evidence,
      technicalIndicators: report.technical_indicators,
      signals: {
        gemini: {
          name: 'Gemini Vision Analysis',
          probability: report.overall_probability,
          confidence: report.confidence,
          description: `Analyzed ${frameResults.length} frames for visual AI artifacts`,
          available: true,
        },
        hive: hiveResult ? {
          name: 'Hive AI Detection',
          probability: hiveResult.probability,
          confidence: hiveResult.confidence,
          description: 'Specialized AI-generated content detection model',
          available: true,
        } : {
          name: 'Hive AI Detection',
          probability: null,
          confidence: null,
          description: 'API key not configured',
          available: false,
        },
        metadata: {
          name: 'Metadata Forensics',
          probability: metaResult.probability,
          confidence: metaResult.confidence,
          description: 'File metadata and encoding analysis',
          findings: metaResult.findings,
          available: true,
        },
      },
      frameAnalysis: frameResults.map((f, i) => ({
        frameIndex: i,
        timestamp: videoMeta?.duration ? (videoMeta.duration / frames.length) * i : null,
        aiProbability: f.ai_probability,
        confidence: f.confidence,
        artifactsFound: f.artifacts_found,
        reasoning: f.reasoning,
        suspiciousRegion: f.most_suspicious_region,
        frameData: frames[i], // include for gallery display
      })),
    };

    // Store result for retrieval by results page
    saveResult(result.id, result);

    console.log(`[SynthScan] Analysis complete. Verdict: ${result.verdict} (${(compositeScore * 100).toFixed(1)}%)`);

    return NextResponse.json({ id: result.id, verdict: result.verdict, score: compositeScore });
  } catch (err) {
    console.error('[SynthScan] Analysis error:', err);
    return NextResponse.json(
      { error: err.message || 'Analysis failed. Check server logs.' },
      { status: 500 }
    );
  }
}
