import React, { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface InvitationCanvasProps {
  from: string;
  to: string;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  className?: string;
}

const InvitationCanvas = ({ from, to, canvasRef, className }: InvitationCanvasProps) => {
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

      context.fillStyle = "#FFFFFF";
      context.textAlign = "center";
      context.font = "bold 48px Pretendard, sans-serif";
      context.fillText(`${to} 님께`, image.width / 2, image.height * 0.75);
      context.fillText(`From. ${from}`, image.width / 2, image.height * 0.83);
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
      image.src = asset("/result.png");
    };

    draw();

    return () => {
      isMounted = false;
    };
  }, [asset, from, to, canvasRef]);

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
