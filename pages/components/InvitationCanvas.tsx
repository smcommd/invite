import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const INVITATION_WIDTH = 768;
const INVITATION_HEIGHT = 1098;
// Move TO up by 5px and FROM up by 5px (relative to 768x1098 base)
const TO_TEXT_RATIO = 132 / INVITATION_HEIGHT;
const FROM_TEXT_RATIO = 614 / INVITATION_HEIGHT;
const TO_TEXT_X_OFFSET = -110; // left by 110px
const FROM_TEXT_X_OFFSET = 145; // right by 145px
const MAX_TEXT_WIDTH_RATIO = 0.98;
const TO_TEXT_TARGET_RATIO = 0.92;
const FROM_TEXT_TARGET_RATIO = 0.92;
const NAME_FONT_MIN = 48;
const NAME_FONT_MAX_TO = 900;
const NAME_FONT_MAX_FROM = 820;
const NAME_FONT_WEIGHT = 700;
const NAME_FONT_FAMILIES = `"rixdongnimgothic-pro","tk-rixdongnimgothic-pro",sans-serif`;
// Allow high-DPI rendering up to the source PNG width for crisp preview
const MIN_RENDER_WIDTH = 768;
const MAX_RENDER_WIDTH = 3072; // match regenerated invitation_2.png width
const EXTRA_RENDER_SCALE = 3; // boost preview render resolution for crisper background/text
const FONT_LOAD_BASE_SIZE = 36;
// Treat manualSize as a value defined for this base width and scale with actual canvas width
const MANUAL_SIZE_BASE_WIDTH = 1024;

interface CanvasFontConfig {
  weight?: number;
  minSize?: number;
  maxSize?: number;
  targetWidthRatio?: number;
  manualSize?: number;
}

const DEFAULT_FONT_OPTIONS: { to: Required<CanvasFontConfig>; from: Required<CanvasFontConfig> } = {
  to: {
    weight: NAME_FONT_WEIGHT,
    minSize: NAME_FONT_MIN,
    maxSize: NAME_FONT_MAX_TO,
    targetWidthRatio: TO_TEXT_TARGET_RATIO,
    manualSize: 0,
  },
  from: {
    weight: NAME_FONT_WEIGHT,
    minSize: NAME_FONT_MIN,
    maxSize: NAME_FONT_MAX_FROM,
    targetWidthRatio: FROM_TEXT_TARGET_RATIO,
    manualSize: 0,
  },
};

export interface InvitationCanvasProps {
  from: string;
  to: string;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  className?: string;
  imageSrc?: string;
  fontOptions?: {
    to?: CanvasFontConfig;
    from?: CanvasFontConfig;
  };
}

const InvitationCanvas = ({
  from,
  to,
  canvasRef,
  className,
  imageSrc = "/invitation_2.svg",
  fontOptions,
}: InvitationCanvasProps) => {
  const { basePath } = useRouter();
  const asset = useCallback((path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${basePath ?? ""}${normalized}`;
  }, [basePath]);

  const resolvedFonts = useMemo<{ to: Required<CanvasFontConfig>; from: Required<CanvasFontConfig> }>(() => ({
    to: {
      ...DEFAULT_FONT_OPTIONS.to,
      ...fontOptions?.to,
    },
    from: {
      ...DEFAULT_FONT_OPTIONS.from,
      ...fontOptions?.from,
    },
  }), [fontOptions]);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsReady(false);
    setError(null);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!isMounted) return;
      setLoadedImage(image);
      setError(null);
    };
    image.onerror = () => {
      if (!isMounted) return;
      setLoadedImage(null);
      setIsReady(false);
      setError("초대장 이미지를 불러오지 못했습니다.");
    };

    const loadFonts = async () => {
      if (document.fonts && "ready" in document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore
        }
      }
      if (document.fonts?.load) {
        try {
          const uniqueWeights = Array.from(new Set([resolvedFonts.to.weight, resolvedFonts.from.weight]));
          await Promise.all(uniqueWeights.flatMap((weight) => ([
            document.fonts.load(`${weight} ${FONT_LOAD_BASE_SIZE}px rixdongnimgothic-pro`),
            document.fonts.load(`${weight} ${FONT_LOAD_BASE_SIZE}px 'rixdongnimgothic-pro'`),
            document.fonts.load(`${weight} ${FONT_LOAD_BASE_SIZE}px 'tk-rixdongnimgothic-pro'`),
          ])));
        } catch {
          // ignore
        }
      }
    };

    loadFonts().finally(() => {
      image.src = asset(imageSrc);
    });

    return () => {
      isMounted = false;
    };
  }, [asset, imageSrc, resolvedFonts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !loadedImage) return;

    const drawNames = () => {
      const drawName = (
        text: string,
        ratio: number,
        xOffset: number,
        config: Required<CanvasFontConfig>,
      ) => {
        const sanitized = text.trim();
        if (!sanitized) return;

        const y = Math.round(canvas.height * ratio);
        const maxWidth = canvas.width * MAX_TEXT_WIDTH_RATIO;
        const desiredWidth = Math.min(maxWidth, canvas.width * config.targetWidthRatio);

        const measure = (size: number, weight: number) => {
          context.font = `${weight} ${size}px ${NAME_FONT_FAMILIES}`;
          const metrics = context.measureText(sanitized);
          return metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft || metrics.width;
        };

        let fontSize = config.manualSize > 0
          ? Math.max(
              config.minSize,
              Math.min(
                config.maxSize,
                Math.round(config.manualSize * (canvas.width / MANUAL_SIZE_BASE_WIDTH)),
              ),
            )
          : config.minSize;

        if (config.manualSize <= 0) {
          let low = config.minSize;
          let high = Math.max(config.minSize, config.maxSize);
          let best = config.minSize;

          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const measured = measure(mid, config.weight);
            if (measured <= desiredWidth) {
              best = mid;
              low = mid + 2;
            } else {
              high = mid - 2;
            }
          }

          fontSize = Math.min(best, config.maxSize);
        }

        context.font = `${config.weight} ${fontSize}px ${NAME_FONT_FAMILIES}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#121212";
        const x = canvas.width / 2 + xOffset;
        context.fillText(sanitized, x, y);
      };

      // Improve image quality for scaled raster backgrounds
      context.imageSmoothingEnabled = true;
      // @ts-ignore
      if (typeof (context as any).imageSmoothingQuality !== "undefined") {
        // @ts-ignore
        (context as any).imageSmoothingQuality = "high";
      }
      context.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
      drawName(
        to,
        TO_TEXT_RATIO,
        TO_TEXT_X_OFFSET,
        resolvedFonts.to,
      );
      drawName(
        from,
        FROM_TEXT_RATIO,
        FROM_TEXT_X_OFFSET,
        resolvedFonts.from,
      );
    };

    let animationFrame: number | null = null;

    const updateCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio || 1) : 1;
      const cssWidth = rect.width || loadedImage.width;
      const desiredWidth = Math.round(cssWidth * devicePixelRatio * EXTRA_RENDER_SCALE);
      const maxByImage = loadedImage.naturalWidth && Number.isFinite(loadedImage.naturalWidth)
        ? Math.max(MIN_RENDER_WIDTH, Math.min(MAX_RENDER_WIDTH, loadedImage.naturalWidth))
        : MAX_RENDER_WIDTH;
      const targetWidth = Math.max(MIN_RENDER_WIDTH, Math.min(maxByImage, desiredWidth || MIN_RENDER_WIDTH));
      const aspectRatio = loadedImage.naturalHeight && loadedImage.naturalWidth
        ? loadedImage.naturalHeight / loadedImage.naturalWidth
        : INVITATION_HEIGHT / INVITATION_WIDTH;
      const targetHeight = Math.max(1, Math.round(targetWidth * aspectRatio));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const displayWidth = rect.width || targetWidth / devicePixelRatio;
      const displayHeight = displayWidth * (targetHeight / targetWidth);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      context.clearRect(0, 0, canvas.width, canvas.height);
      drawNames();
      setIsReady(true);
      setError(null);
    };

    updateCanvas();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        animationFrame = window.requestAnimationFrame(updateCanvas);
      })
      : null;

    resizeObserver?.observe(canvas);

    const handleWindowResize = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = window.requestAnimationFrame(updateCanvas);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserver?.disconnect();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [canvasRef, from, to, loadedImage, resolvedFonts]);

  return (
    <div className="invitation-wrapper">
      {!isReady && (
        <div className="canvas-status">
          {error ?? "초대장 이미지를 불러오는 중입니다..."}
        </div>
      )}
      <canvas ref={canvasRef} className={className ?? "invitation-canvas"} />
    </div>
  );
};

export default InvitationCanvas;
