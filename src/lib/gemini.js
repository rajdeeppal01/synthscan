import { GoogleGenerativeAI } from '@google/generative-ai';

const FRAME_ANALYSIS_PROMPT = `You are a forensic AI video analyst specializing in detecting AI-generated video content (from tools like Sora, Runway, Kling, Pika, HeyGen, Stable Video Diffusion, etc.).

Analyze this video frame carefully for signs of AI generation or heavy AI manipulation.

Look specifically for:
1. **Texture artifacts**: Unnaturally smooth, plasticky, or "AI-polished" surfaces
2. **Lighting inconsistencies**: Shadows that don't match physics, impossible reflections
3. **Facial anomalies**: Uncanny valley effects, morphing features, distorted teeth/hands/fingers
4. **Background issues**: Objects that shouldn't exist, unnatural merging, hallucinated details
5. **Motion artifacts**: Temporal blur patterns typical of video diffusion models
6. **Composition signatures**: Overly perfect, cinematic framing typical of AI generation
7. **Diffusion artifacts**: "Watercolor bleeding" at edges, soft undefined boundaries
8. **Text/logo distortions**: Garbled text, distorted brand elements

Respond ONLY with a JSON object (no markdown, no text outside JSON):
{
  "ai_probability": <float 0.0-1.0>,
  "confidence": "<low|medium|high>",
  "artifacts_found": ["<specific artifact 1>", "<specific artifact 2>"],
  "reasoning": "<1-2 sentence explanation of your assessment>",
  "most_suspicious_region": "<describe the most suspicious area if any, or null>"
}`;

const REPORT_PROMPT = `You are a senior digital forensics analyst reviewing AI video detection results. Based on the frame-by-frame analysis data below, write a comprehensive forensic report.

Frame analyses: {FRAME_DATA}

Overall statistics:
- Average AI probability: {AVG_PROB}
- Frames analyzed: {NUM_FRAMES}
- Highest probability frame: {MAX_PROB}
- Most common artifacts: {ARTIFACTS}

Provide a thorough forensic assessment. Respond ONLY with a JSON object:
{
  "overall_probability": <float 0.0-1.0>,
  "verdict": "<LIKELY AI GENERATED|POSSIBLY AI GENERATED|LIKELY AUTHENTIC|INCONCLUSIVE>",
  "confidence": "<low|medium|high>",
  "key_evidence": ["<evidence point 1>", "<evidence point 2>", "<evidence point 3>"],
  "forensic_narrative": "<3-4 sentence detailed forensic narrative explaining your reasoning>",
  "technical_indicators": ["<technical detail 1>", "<technical detail 2>"]
}`;

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set in environment variables');
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export async function analyzeFrame(base64Data, mimeType = 'image/jpeg') {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Strip data URL prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([FRAME_ANALYSIS_PROMPT, imagePart]);
    const text = result.response.text().trim();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Frame analysis error:', err.message);
    return {
      ai_probability: 0.5,
      confidence: 'low',
      artifacts_found: [],
      reasoning: 'Analysis could not be completed for this frame.',
      most_suspicious_region: null,
    };
  }
}

export async function generateForensicReport(frameResults) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const probs = frameResults.map((f) => f.ai_probability);
  const avgProb = probs.reduce((a, b) => a + b, 0) / probs.length;
  const maxProb = Math.max(...probs);
  const allArtifacts = frameResults.flatMap((f) => f.artifacts_found);
  const artifactCounts = {};
  allArtifacts.forEach((a) => { artifactCounts[a] = (artifactCounts[a] || 0) + 1; });
  const topArtifacts = Object.entries(artifactCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k]) => k);

  const prompt = REPORT_PROMPT
    .replace('{FRAME_DATA}', JSON.stringify(frameResults.map((f, i) => ({
      frame: i + 1,
      ai_probability: f.ai_probability,
      confidence: f.confidence,
      artifacts: f.artifacts_found,
      reasoning: f.reasoning,
    }))))
    .replace('{AVG_PROB}', avgProb.toFixed(3))
    .replace('{NUM_FRAMES}', frameResults.length)
    .replace('{MAX_PROB}', maxProb.toFixed(3))
    .replace('{ARTIFACTS}', topArtifacts.join(', ') || 'none detected');

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Report generation error:', err.message);
    // Fallback computed report
    let verdict = 'INCONCLUSIVE';
    if (avgProb >= 0.75) verdict = 'LIKELY AI GENERATED';
    else if (avgProb >= 0.5) verdict = 'POSSIBLY AI GENERATED';
    else if (avgProb <= 0.3) verdict = 'LIKELY AUTHENTIC';

    return {
      overall_probability: avgProb,
      verdict,
      confidence: 'low',
      key_evidence: topArtifacts.length > 0 ? topArtifacts : ['Insufficient signal data'],
      forensic_narrative: `Analysis of ${frameResults.length} frames yielded an average AI probability of ${(avgProb * 100).toFixed(1)}%. The forensic assessment is ${verdict.toLowerCase()} based on available signal data.`,
      technical_indicators: [`Average frame probability: ${(avgProb * 100).toFixed(1)}%`, `Peak probability: ${(maxProb * 100).toFixed(1)}%`],
    };
  }
}
