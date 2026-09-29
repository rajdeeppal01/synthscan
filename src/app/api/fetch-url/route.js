import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, readdirSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';

export const maxDuration = 120;

// Use system ffmpeg (already installed)
// fluent-ffmpeg will auto-detect it from PATH

/**
 * Probe video duration using ffprobe
 */
function probeVideo(videoPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        resolve({ duration: 0, width: 0, height: 0 });
      } else {
        const stream = metadata.streams?.find(s => s.codec_type === 'video');
        resolve({
          duration: metadata.format?.duration || 0,
          width: stream?.width || 0,
          height: stream?.height || 0,
        });
      }
    });
  });
}

/**
 * Extract N frames evenly spaced across the video using ffmpeg
 */
function extractFramesFromVideo(videoPath, outputDir, numFrames, duration) {
  return new Promise((resolve, reject) => {
    // Calculate timestamps to capture
    const step = duration / (numFrames + 1);
    const timestamps = Array.from({ length: numFrames }, (_, i) => step * (i + 1));

    // Build ffmpeg select filter to grab specific timestamps
    // Use fps=1/step approach for simplicity
    ffmpeg(videoPath)
      .outputOptions([
        '-vf', `fps=${numFrames / Math.max(duration, 1)},scale=1280:-2`,
        '-frames:v', String(numFrames),
        '-q:v', '3',
      ])
      .output(join(outputDir, 'frame-%03d.jpg'))
      .on('end', () => {
        const files = readdirSync(outputDir)
          .filter(f => f.endsWith('.jpg'))
          .sort();
        
        const frames = files.map(f => {
          const data = readFileSync(join(outputDir, f));
          return `data:image/jpeg;base64,${data.toString('base64')}`;
        });

        resolve(frames.slice(0, numFrames));
      })
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}

/**
 * Download video with yt-dlp
 */
function downloadWithYtDlp(url, outputDir) {
  return new Promise((resolve, reject) => {
    const outputTemplate = join(outputDir, 'video.%(ext)s');

    const args = [
      url,
      '--output', outputTemplate,
      '--format', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best',
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '--max-filesize', '200M',
      '--socket-timeout', '30',
    ];

    // Include common yt-dlp install locations in PATH
    const extraPaths = [
      'C:\\Users\\rajde\\AppData\\Roaming\\Python\\Python314\\Scripts',
      'C:\\Users\\rajde\\AppData\\Local\\Programs\\Python\\Python314\\Scripts',
      '/usr/local/bin',
      '/usr/bin',
    ].join(process.platform === 'win32' ? ';' : ':');

    const env = {
      ...process.env,
      PATH: `${process.env.PATH}${process.platform === 'win32' ? ';' : ':'}${extraPaths}`,
    };

    const proc = spawn('yt-dlp', args, { shell: true, env });

    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        const files = readdirSync(outputDir).filter(f => f.startsWith('video.'));
        if (files.length > 0) {
          resolve(join(outputDir, files[0]));
        } else {
          reject(new Error('Download completed but no video file found'));
        }
      } else {
        reject(new Error(`Download failed: ${stderr.slice(-300) || 'unknown error'}`));
      }
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('yt-dlp is not installed on this server'));
      } else {
        reject(err);
      }
    });
  });
}

export async function POST(request) {
  const tempDir = mkdtempSync(join(tmpdir(), 'synthscan-'));
  const framesDir = join(tempDir, 'frames');

  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`[SynthScan] Downloading URL: ${url}`);

    // 1. Download video
    const videoPath = await downloadWithYtDlp(url, tempDir);
    console.log(`[SynthScan] Downloaded to: ${videoPath}`);

    // 2. Probe duration and metadata
    const meta = await probeVideo(videoPath);
    console.log(`[SynthScan] Video: ${meta.duration.toFixed(1)}s, ${meta.width}x${meta.height}`);

    // 3. Extract frames
    mkdirSync(framesDir, { recursive: true });
    const numFrames = 8;
    const frames = await extractFramesFromVideo(videoPath, framesDir, numFrames, meta.duration);
    console.log(`[SynthScan] Extracted ${frames.length} frames`);

    if (frames.length === 0) {
      throw new Error('No frames could be extracted from the video');
    }

    // 4. Build video metadata
    const videoMeta = {
      name: parsedUrl.hostname + parsedUrl.pathname,
      sourceUrl: url,
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      framesExtracted: frames.length,
    };

    return NextResponse.json({ frames, videoMeta });

  } catch (err) {
    console.error('[SynthScan] fetch-url error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to process URL' },
      { status: 500 }
    );
  } finally {
    // Always clean up temp files
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
