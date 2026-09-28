import React, { useEffect, useRef, useState } from 'react';

interface TransparentVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({ src, className, style }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState<boolean>(true);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const render = () => {
      if (video.readyState >= 2 && ctx) {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, width, height);

        try {
          const frame = ctx.getImageData(0, 0, width, height);
          const data = frame.data;
          const totalPixels = width * height;

          // Sample corner colors for accurate background baseline
          const bgR = (data[0] + data[(width - 1) * 4]) / 2;
          const bgG = (data[1] + data[(width - 1) * 4 + 1]) / 2;
          const bgB = (data[2] + data[(width - 1) * 4 + 2]) / 2;

          for (let p = 0; p < totalPixels; p++) {
            const i = p * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const y = Math.floor(p / width);
            const normalizedY = y / height;

            const brightness = (r + g + b) / 3;
            const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
            const colorDiff = Math.max(r, g, b) - Math.min(r, g, b);
            const isLowSaturation = colorDiff < 32;

            // 1. Remove ground shadow in the lower portion (bottom 35% of video)
            if (normalizedY > 0.65 && isLowSaturation && brightness > 90) {
              data[i + 3] = 0;
              continue;
            }

            // 2. Remove light/white background with smooth edge feathering
            if (brightness > 228 || dist < 38) {
              data[i + 3] = 0;
            } else if (brightness > 195 || dist < 65) {
              const fade1 = Math.max(0, (228 - brightness) / 33);
              const fade2 = Math.max(0, (65 - dist) / 27);
              const alphaFactor = Math.min(fade1, fade2);
              data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
            }
          }

          ctx.putImageData(frame, 0, 0);
        } catch {
          setUseCanvas(false);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    video.play().catch(() => {});
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        style={{
          display: useCanvas ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'multiply',
        }}
      />
      {useCanvas && (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'contrast(1.05) saturate(1.08)',
            imageRendering: 'auto',
          }}
        />
      )}
    </div>
  );
};

