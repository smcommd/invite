import React, { MutableRefObject, useRef, useState } from "react";

interface DownloadButtonProps {
  from: string;
  to: string;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  onReset: () => void;
}

const DownloadButton = ({ from, to, canvasRef, onReset }: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDownloading(true);

    const fileName = `invitation-from-${encodeURIComponent(from)}-to-${encodeURIComponent(to)}.png`;

    const createPreviewScaleCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
      if (!source.width || !source.height) {
        return null;
      }

      const rect = source.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return null;
      }

      const devicePixelRatio = typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio || 1) : 1;
      const targetWidth = Math.round(rect.width * devicePixelRatio);
      const targetHeight = Math.round(rect.height * devicePixelRatio);

      if (!targetWidth || !targetHeight) {
        return null;
      }

      if (targetWidth >= source.width && targetHeight >= source.height) {
        return null;
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.min(source.width, targetWidth);
      exportCanvas.height = Math.min(source.height, targetHeight);
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        return null;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, exportCanvas.width, exportCanvas.height);
      return exportCanvas;
    };

    const exportCanvas = createPreviewScaleCanvas(canvas) ?? canvas;

    const performDownload = (href: string, revoke?: () => void) => {
      const existingLink = linkRef.current;
      const link = existingLink ?? document.createElement("a");
      const shouldAppend = !existingLink;

      link.href = href;
      link.download = fileName;
      if (shouldAppend) {
        link.style.display = "none";
        document.body.appendChild(link);
      }

      link.click();

      window.requestAnimationFrame(() => {
        link.removeAttribute("href");
        link.removeAttribute("download");
        revoke?.();
        if (shouldAppend) {
          link.remove();
        }
      });
    };

    if (exportCanvas.toBlob) {
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloading(false);
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        performDownload(objectUrl, () => URL.revokeObjectURL(objectUrl));
        setIsDownloading(false);
      }, "image/png");
      return;
    }

    const dataUrl = exportCanvas.toDataURL("image/png");
    performDownload(dataUrl);
    setIsDownloading(false);
  };

  const handleResetClick = () => {
    setIsDownloading(false);
    onReset();
  };

  return (
    <div className="download-actions">
      <button
        className={`btn btn-save${isDownloading ? " btn-disabled" : ""}`}
        type="button"
        disabled={isDownloading}
        onClick={handleDownload}
      >
        {isDownloading ? "저장 중..." : "저장하기"}
      </button>
      <button className="btn btn-retry" type="button" onClick={handleResetClick}>
        다시하기
      </button>
      <a ref={linkRef} style={{ display: "none" }} />
    </div>
  );
};

export default DownloadButton;
