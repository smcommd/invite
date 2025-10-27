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

    const createScaledCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
      if (!source.width || !source.height) {
        return null;
      }

      const SCALE_FACTOR = 0.7;
      const MIN_WIDTH = 640;
      const preferredScale = Math.min(1, Math.max(MIN_WIDTH / source.width, SCALE_FACTOR));
      if (preferredScale >= 0.999) {
        return null;
      }

      const targetWidth = Math.max(1, Math.round(source.width * preferredScale));
      const targetHeight = Math.max(1, Math.round(source.height * preferredScale));

      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = targetWidth;
      scaledCanvas.height = targetHeight;
      const context = scaledCanvas.getContext("2d");
      if (!context) {
        return null;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, source.width, source.height, 0, 0, targetWidth, targetHeight);
      return scaledCanvas;
    };

    const exportCanvas = createScaledCanvas(canvas) ?? canvas;

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
