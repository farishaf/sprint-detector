// Generates a simulated runner animation frame on a canvas for demo mode

export class DemoRunnerSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning = false;
  private runnerX = -0.1; // 0 to 1 ratio
  private speed = 0.25; // ratio per second
  private lastTime = 0;
  private animFrameId: number | null = null;
  public runnerName = 'Khalil';

  constructor(width = 640, height = 480) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public startRun(speed = 0.22, name = 'Khalil') {
    this.runnerName = name;
    this.runnerX = -0.05;
    this.speed = speed;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public reset() {
    this.runnerX = -0.05;
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.drawScene();
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.runnerX += this.speed * dt;
    if (this.runnerX > 1.1) {
      this.runnerX = -0.15; // wrap around or stay
    }

    this.drawScene();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public drawScene() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background: Athletic track outdoor grass & blue sky
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, h * 0.5);
    skyGradient.addColorStop(0, '#38bdf8');
    skyGradient.addColorStop(1, '#93c5fd');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, w, h * 0.5);

    // Track/Grass ground
    const groundGradient = this.ctx.createLinearGradient(0, h * 0.5, 0, h);
    groundGradient.addColorStop(0, '#15803d');
    groundGradient.addColorStop(1, '#166534');
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Track lines / cone markers
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.7);
    this.ctx.lineTo(w, h * 0.7);
    this.ctx.moveTo(0, h * 0.85);
    this.ctx.lineTo(w, h * 0.85);
    this.ctx.stroke();

    // Distant background buildings/fences
    this.ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 5; i++) {
      this.ctx.fillRect(w * 0.8 + i * 35, h * 0.35, 25, h * 0.15);
    }

    // Draw Runner sprite if on screen
    if (this.runnerX >= -0.1 && this.runnerX <= 1.1) {
      const rx = this.runnerX * w;
      const ry = h * 0.52;
      const runnerH = h * 0.35;

      this.ctx.save();
      // Running body silhouette/jersey
      const legPhase = (this.runnerX * 40) % (Math.PI * 2);

      // Head
      this.ctx.fillStyle = '#7c2d12';
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, runnerH * 0.1, 0, Math.PI * 2);
      this.ctx.fill();

      // Torso (Red jersey like reference image athlete)
      this.ctx.fillStyle = '#dc2626';
      this.ctx.beginPath();
      this.ctx.roundRect(rx - runnerH * 0.08, ry + runnerH * 0.1, runnerH * 0.16, runnerH * 0.35, 6);
      this.ctx.fill();

      // Bib number on chest
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(rx - runnerH * 0.05, ry + runnerH * 0.18, runnerH * 0.1, runnerH * 0.1);
      this.ctx.fillStyle = '#000000';
      this.ctx.font = `bold ${Math.round(runnerH * 0.07)}px sans-serif`;
      this.ctx.fillText('4', rx - runnerH * 0.02, ry + runnerH * 0.25);

      // Legs animation
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = runnerH * 0.06;
      this.ctx.lineCap = 'round';

      // Left leg
      this.ctx.beginPath();
      this.ctx.moveTo(rx - 5, ry + runnerH * 0.45);
      this.ctx.lineTo(rx - Math.sin(legPhase) * (runnerH * 0.2), ry + runnerH * 0.7);
      this.ctx.lineTo(rx - Math.sin(legPhase) * (runnerH * 0.25), ry + runnerH * 0.9);
      this.ctx.stroke();

      // Right leg
      this.ctx.beginPath();
      this.ctx.moveTo(rx + 5, ry + runnerH * 0.45);
      this.ctx.lineTo(rx + Math.sin(legPhase) * (runnerH * 0.2), ry + runnerH * 0.7);
      this.ctx.lineTo(rx + Math.sin(legPhase) * (runnerH * 0.25), ry + runnerH * 0.9);
      this.ctx.stroke();

      // Arms animation
      this.ctx.strokeStyle = '#dc2626';
      this.ctx.beginPath();
      this.ctx.moveTo(rx, ry + runnerH * 0.18);
      this.ctx.lineTo(rx + Math.sin(legPhase) * (runnerH * 0.15), ry + runnerH * 0.35);
      this.ctx.stroke();

      this.ctx.restore();
    }
  }
}
