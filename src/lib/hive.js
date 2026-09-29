/**
 * Hive Moderation API integration for AI-generated video detection.
 * Hive has a dedicated AI-generated content detection model.
 * Get a free API key at: https://hivemoderation.com/
 */

export async function analyzeWithHive(base64Frames) {
  const apiKey = process.env.HIVE_API_KEY;
  
  if (!apiKey) {
    console.warn('HIVE_API_KEY not set — skipping Hive analysis');
    return null;
  }

  try {
    // Hive's AI-generated image detection endpoint
    // We'll analyze the most representative frame (middle frame)
    const middleFrame = base64Frames[Math.floor(base64Frames.length / 2)];
    const cleanBase64 = middleFrame.includes(',') ? middleFrame.split(',')[1] : middleFrame;

    const formData = new FormData();
    // Convert base64 to blob
    const byteString = atob(cleanBase64);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    formData.append('image', blob, 'frame.jpg');

    const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      console.warn('Hive API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Parse Hive response for AI-generated content classes
    const classes = data?.status?.[0]?.response?.output?.[0]?.classes || [];
    const aiClass = classes.find(c => c.class === 'ai_generated');
    const probability = aiClass?.score ?? null;

    if (probability === null) return null;

    return {
      probability,
      confidence: probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low',
      model: 'Hive AI Detection v2',
      raw_classes: classes.slice(0, 5),
    };
  } catch (err) {
    console.error('Hive analysis error:', err.message);
    return null;
  }
}

/**
 * Analyze video metadata for AI tool signatures
 */
export function analyzeMetadata(filename, fileSize, duration) {
  const findings = [];
  let suspicionScore = 0;

  // Check filename for AI tool signatures
  const aiToolPatterns = [
    /runway/i, /sora/i, /kling/i, /pika/i, /heygen/i,
    /gen-?[23]/i, /stable.?video/i, /ai.?gen/i, /synthesia/i,
    /deepfake/i, /face.?swap/i, /midjourney/i, /dalle/i,
  ];

  for (const pattern of aiToolPatterns) {
    if (pattern.test(filename)) {
      findings.push(`Filename matches known AI tool pattern: "${pattern.source}"`);
      suspicionScore += 0.4;
    }
  }

  // Suspiciously short duration (AI videos often 3-15 seconds)
  if (duration && duration <= 15) {
    findings.push(`Short video duration (${duration.toFixed(1)}s) consistent with AI generation limits`);
    suspicionScore += 0.1;
  }

  // Very small file size for video duration (AI videos can be over-compressed)
  if (duration && fileSize && (fileSize / duration) < 200000) {
    findings.push('Low bitrate relative to duration — possible AI compression artifact');
    suspicionScore += 0.05;
  }

  return {
    probability: Math.min(suspicionScore, 0.9),
    findings,
    confidence: findings.length > 0 ? 'medium' : 'low',
  };
}
