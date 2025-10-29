import React, { MutableRefObject, useRef, useState } from "react";
import { createPreviewScaleCanvas } from "../../lib/canvas";

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

    const sanitizedFrom = from.trim();
    const sanitizedTo = to.trim();
    const fileName = `invitation-from-${encodeURIComponent(sanitizedFrom || "unknown")}-to-${encodeURIComponent(sanitizedTo || "guest")}.png`;

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

    try {
      let blob: Blob | null = null;
      let dataUrlFallback: string | null = null;

      if (exportCanvas.toBlob) {
        blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, "image/png"));
      }

      if (!blob) {
        const dataUrl = exportCanvas.toDataURL("image/png");
        dataUrlFallback = dataUrl;
        const commaIndex = dataUrl.indexOf(",");
        const mimeType = commaIndex > -1 ? dataUrl.slice(5, dataUrl.indexOf(";")) : "image/png";
        const byteString = atob(commaIndex > -1 ? dataUrl.slice(commaIndex + 1) : dataUrl);
        const buffer = new ArrayBuffer(byteString.length);
        const view = new Uint8Array(buffer);
        for (let index = 0; index < byteString.length; index += 1) {
          view[index] = byteString.charCodeAt(index);
        }
        blob = new Blob([view], { type: mimeType });
      }

      if (!blob) {
        throw new Error("초대장 이미지를 생성하지 못했습니다.");
      }

      const nav = typeof navigator !== "undefined"
        ? (navigator as Navigator & {
            canShare?: (data: ShareData & { files?: File[] }) => boolean;
            share?: (data: ShareData & { files?: File[] }) => Promise<void>;
          })
        : undefined;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isIOSDevice = /iP(ad|hone|od)/i.test(userAgent);
      const isAndroidDevice = /Android/i.test(userAgent);

      const sharePayload: ShareData & { files?: File[] } = {
        title: sanitizedFrom ? `${sanitizedFrom}의 초대장` : "초대장",
        text: sanitizedTo ? `${sanitizedTo} 님께 전달하는 초대장입니다.` : undefined,
      };

      if (typeof File !== "undefined") {
        try {
          sharePayload.files = [new File([blob], fileName, { type: "image/png" })];
        } catch {
          // ignore file construction failures
        }
      }

      const supportsShare = Boolean(nav?.share);
      const canShareFiles = (() => {
        if (!supportsShare || !nav || !sharePayload.files?.length) return false;
        if (typeof nav.canShare !== "function") return true;
        try {
          return nav.canShare({ files: sharePayload.files });
        } catch {
          return false;
        }
      })();
      const shouldAttemptShare = supportsShare && (isIOSDevice || isAndroidDevice);

      const shareWithData = async (data: ShareData & { files?: File[] }) => {
        if (!nav?.share) return false;
        try {
          await nav.share(data);
          return true;
        } catch (shareError) {
          if ((shareError as DOMException)?.name === "AbortError") {
            return true;
          }
          console.warn("초대장 공유에 실패했습니다.", shareError);
          return false;
        }
      };

      let shareHandled = false;

      if (shouldAttemptShare && nav?.share) {
        if (sharePayload.files && canShareFiles) {
          shareHandled = await shareWithData(sharePayload);
        }
        if (!shareHandled) {
          const fallbackShare: ShareData = {
            title: sharePayload.title,
            text: sharePayload.text,
          };
          shareHandled = await shareWithData(fallbackShare);
        }
      }

      let downloadHref = dataUrlFallback;
      let revoke: (() => void) | undefined;

      if (!downloadHref) {
        const blobUrl = URL.createObjectURL(blob);
        downloadHref = blobUrl;
        revoke = () => URL.revokeObjectURL(blobUrl);
      }

      if (shareHandled) {
        revoke?.();
        return;
      }

      performDownload(downloadHref, revoke);
    } catch (error) {
      console.error(error);
      window.alert("초대장을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsDownloading(false);
    }
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
