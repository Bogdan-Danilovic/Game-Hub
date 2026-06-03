'use client';

import { useEffect, useRef } from 'react';
import { GarticStroke } from '@/lib/types/gartic';

interface Props { strokes: GarticStroke[]; }

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: GarticStroke[], w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  strokes.forEach((s) => {
    if (s.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * Math.min(w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(s.points[0][0] * w, s.points[0][1] * h);
    s.points.slice(1).forEach(([x, y]) => ctx.lineTo(x * w, y * h));
    ctx.stroke();
  });
}

export function StaticCanvas({ strokes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const { width: w, height: h } = container.getBoundingClientRect();
      canvas.width = w;
      canvas.height = h;
      drawStrokes(canvas.getContext('2d')!, strokes, w, h);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return;
    drawStrokes(canvas.getContext('2d')!, strokes, canvas.width, canvas.height);
  }, [strokes]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
