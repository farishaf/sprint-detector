import { DetectionConfig } from '../types';

export interface MotionAnalysisResult {
  motionPercent: number;
  triggered: boolean;
  timestampMs: number;
  snapshotUri?: string;
}

export class OpticalMotionEngine {
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;
  private prevLineBuffer: Uint8ClampedArray | null = null;
  private lastTriggerTime = 0;

  constructor() {
    this.tempCanvas = document.createElement('canvas');
    // Sampling resolution for motion analysis line
    this.tempCanvas.width = 320;
    this.tempCanvas.height = 240;
    const ctx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Cannot get 2D context for motion engine');
    this.tempCtx = ctx;
  }

  public reset() {
    this.prevLineBuffer = null;
    this.lastTriggerTime = 0;
  }

  public analyzeFrame(
    source: HTMLVideoElement | HTMLCanvasElement,
    config: DetectionConfig,
    nowMs: number
  ): MotionAnalysisResult {
    const w = this.tempCanvas.width;
    const h = this.tempCanvas.height;

    // Draw source scaled down to processing canvas
    this.tempCtx.drawImage(source, 0, 0, w, h);

    const linePosRatio = config.linePosition / 100;
    const isVertical = config.lineOrientation === 'VERTICAL';
    
    // Calculate sample line bounding rectangle
    let sampleX = 0;
    let sampleY = 0;
    let sampleW = 1;
    let sampleH = 1;

    // We sample a line of width 4px along the target orientation
    const lineWidth = 4;
    if (isVertical) {
      sampleX = Math.min(Math.max(0, Math.floor(linePosRatio * w) - Math.floor(lineWidth / 2)), w - lineWidth);
      sampleY = 0;
      sampleW = lineWidth;
      sampleH = h;
    } else {
      sampleX = 0;
      sampleY = Math.min(Math.max(0, Math.floor(linePosRatio * h) - Math.floor(lineWidth / 2)), h - lineWidth);
      sampleW = w;
      sampleH = lineWidth;
    }

    const imageData = this.tempCtx.getImageData(sampleX, sampleY, sampleW, sampleH);
    const pixels = imageData.data; // RGBA array

    if (!this.prevLineBuffer || this.prevLineBuffer.length !== pixels.length) {
      this.prevLineBuffer = new Uint8ClampedArray(pixels);
      return {
        motionPercent: 0,
        triggered: false,
        timestampMs: nowMs
      };
    }

    let totalDiff = 0;
    const pixelCount = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      // Calculate luminance delta: Y = 0.299R + 0.587G + 0.114B
      const curLuma = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      const prevLuma = 0.299 * this.prevLineBuffer[i] + 0.587 * this.prevLineBuffer[i + 1] + 0.114 * this.prevLineBuffer[i + 2];
      
      const diff = Math.abs(curLuma - prevLuma);
      // Ignore tiny noise fluctuations under 15
      if (diff > 15) {
        totalDiff += diff;
      }
    }

    // Update previous frame buffer
    this.prevLineBuffer.set(pixels);

    // Calculate overall motion score percentage relative to max possible luminance difference (255)
    const avgDiffPerPixel = totalDiff / pixelCount;
    const motionPercent = Math.min(100, Math.round((avgDiffPerPixel / 100) * 100 * 10) / 10);

    const isCooldownOver = nowMs - this.lastTriggerTime > config.triggerCooldownMs;
    const triggered = motionPercent >= config.sensitivity && isCooldownOver;

    let snapshotUri: string | undefined = undefined;

    if (triggered) {
      this.lastTriggerTime = nowMs;
      snapshotUri = this.captureSnapshot(source, config);
    }

    return {
      motionPercent,
      triggered,
      timestampMs: nowMs,
      snapshotUri
    };
  }

  public captureSnapshot(
    source: HTMLVideoElement | HTMLCanvasElement,
    config: DetectionConfig
  ): string {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 480;
    snapCanvas.height = 360;
    const snapCtx = snapCanvas.getContext('2d');
    if (!snapCtx) return '';

    // Draw source
    snapCtx.drawImage(source, 0, 0, snapCanvas.width, snapCanvas.height);

    // Draw overlay vertical trigger line onto the photo finish snapshot
    const lineX = (config.linePosition / 100) * snapCanvas.width;
    snapCtx.strokeStyle = '#22c55e'; // Green line
    snapCtx.lineWidth = 3;
    snapCtx.beginPath();
    snapCtx.moveTo(lineX, 0);
    snapCtx.lineTo(lineX, snapCanvas.height);
    snapCtx.stroke();

    // Add high visibility center line indicator
    snapCtx.setLineDash([6, 4]);
    snapCtx.strokeStyle = '#ffffff';
    snapCtx.lineWidth = 1.5;
    snapCtx.stroke();
    snapCtx.setLineDash([]);

    return snapCanvas.toDataURL('image/jpeg', 0.85);
  }
}
