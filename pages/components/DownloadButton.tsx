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

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloading(false);
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        const link = linkRef.current ?? document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;

        if (!linkRef.current) {
          document.body.appendChild(link);
        }

        link.click();
        URL.revokeObjectURL(objectUrl);
        setIsDownloading(false);
      });
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = linkRef.current ?? document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;

    if (!linkRef.current) {
      document.body.appendChild(link);
    }

    link.click();
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
