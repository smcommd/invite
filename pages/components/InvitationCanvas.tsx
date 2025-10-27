import React, { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";

const INVITATION_HEIGHT = 1464;
const TO_TEXT_RATIO = 182 / INVITATION_HEIGHT;
const FROM_TEXT_RATIO = 824 / INVITATION_HEIGHT;
const TO_TEXT_X_OFFSET = -25;
const FROM_TEXT_X_OFFSET = 50;
const MAX_TEXT_WIDTH_RATIO = 0.95;
const TO_TEXT_TARGET_RATIO = 0.82;
const FROM_TEXT_TARGET_RATIO = 0.78;
const NAME_FONT_MIN = 48;
const NAME_FONT_MAX_TO = 620;
const NAME_FONT_MAX_FROM = 580;
const NAME_FONT_FAMILIES = `"rixdongnimgothic-pro","tk-rixdongnimgothic-pro",sans-serif`;

export interface InvitationCanvasProps {
  from: string;
  to: string;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  className?: string;
  imageSrc?: string;
}

const InvitationCanvas = ({ from, to, canvasRef, className, imageSrc = "/result.png" }: InvitationCanvasProps) => {
  const { basePath } = useRouter();
  const asset = useCallback((path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${basePath ?? ""}${normalized}`;
  }, [basePath]);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    setIsReady(false);
    setError(null);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!isMounted) return;
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const drawName = (text: string, ratio: number, xOffset = 0, targetWidthRatio = 0.82, maxFontSize = NAME_FONT_MAX_TO) => {
        const sanitized = text.trim();
        if (!sanitized) return;

        const y = Math.round(canvas.height * ratio);
        const maxWidth = canvas.width * MAX_TEXT_WIDTH_RATIO;
        const desiredWidth = Math.min(maxWidth, canvas.width * targetWidthRatio);

        const measure = (size: number) => {
          context.font = `700 ${size}px ${NAME_FONT_FAMILIES}`;
          const metrics = context.measureText(sanitized);
          return metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft || metrics.width;
        };

        let low = NAME_FONT_MIN;
        let high = Math.max(NAME_FONT_MIN, maxFontSize);
        let best = NAME_FONT_MIN;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const measured = measure(mid);
          if (measured <= desiredWidth) {
            best = mid;
            low = mid + 2;
          } else {
            high = mid - 2;
          }
        }

        const fontSize = Math.min(best, maxFontSize);

        context.font = `700 ${fontSize}px ${NAME_FONT_FAMILIES}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#121212";
        const x = canvas.width / 2 + xOffset;
        context.fillText(sanitized, x, y);
      };

      drawName(to, TO_TEXT_RATIO, TO_TEXT_X_OFFSET, TO_TEXT_TARGET_RATIO, NAME_FONT_MAX_TO);
      drawName(from, FROM_TEXT_RATIO, FROM_TEXT_X_OFFSET, FROM_TEXT_TARGET_RATIO, NAME_FONT_MAX_FROM);
      setIsReady(true);
      setError(null);
    };
    image.onerror = () => {
      if (!isMounted) return;
      setIsReady(false);
      setError("초대장 이미지를 불러오지 못했습니다.");
    };

    const draw = async () => {
      if (document.fonts && "ready" in document.fonts) {
        await document.fonts.ready;
      }
      if (document.fonts?.load) {
        try {
          await Promise.all([
            document.fonts.load("700 36px rixdongnimgothic-pro"),
            document.fonts.load("700 36px 'rixdongnimgothic-pro'"),
            document.fonts.load("700 36px 'tk-rixdongnimgothic-pro'")
          ]);
        } catch {
          // ignore font loading failures
        }
      }
      image.src = asset(imageSrc);
    };

    draw();

    return () => {
      isMounted = false;
    };
  }, [asset, from, to, canvasRef, imageSrc]);

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
