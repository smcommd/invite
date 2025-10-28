import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import InvitationCanvas from "./components/InvitationCanvas";
import { createPreviewScaleCanvas } from "../lib/canvas";

const IndexPage = () => {
  const { basePath } = useRouter();
  const asset = (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${basePath ?? ""}${normalized}`;
  };

  const [showResult, setShowResult] = useState(false);
  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  const handleButtonClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!showResult) {
      event.preventDefault();
      setShowResult(true);
    }
  };

  const handleSaveClick = async () => {
    if (isSaving) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      window.alert("초대장 미리보기가 준비되지 않았습니다.");
      return;
    }

    const sanitizedTo = toName.trim();
    const sanitizedFrom = fromName.trim();

    if (canvas.width === 0 || canvas.height === 0) {
      window.alert("초대장 미리보기를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const exportCanvas = createPreviewScaleCanvas(canvas) ?? canvas;

    setIsSaving(true);
    try {
      const link = downloadLinkRef.current;
      if (!link) {
        throw new Error("다운로드 링크가 준비되지 않았습니다.");
      }

      const fileName = `invitation-from-${encodeURIComponent(sanitizedFrom || "unknown")}-to-${encodeURIComponent(sanitizedTo || "guest")}.png`;

      const triggerDownload = (href: string, revoke?: () => void) => {
        const anchor = downloadLinkRef.current;
        const supportsDownloadAttr = (() => {
          if (typeof document === "undefined") return false;
          const a = document.createElement("a");
          return "download" in a;
        })();
        const isIOS = typeof navigator !== "undefined" && /iP(ad|hone|od)/i.test(navigator.userAgent);

        if (!isIOS && supportsDownloadAttr && anchor) {
          anchor.href = href;
          anchor.download = fileName;
          anchor.click();
          anchor.removeAttribute("download");
          anchor.removeAttribute("href");
          revoke?.();
          return true;
        }

        const tempAnchor = document.createElement("a");
        tempAnchor.href = href;
        tempAnchor.download = fileName;
        tempAnchor.style.display = "none";
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        document.body.removeChild(tempAnchor);

        if (revoke) {
          window.setTimeout(revoke, 1500);
        }

        return !isIOS; // iOS generally ignores download attribute; signal failure when iOS
      };

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
      const isMobileSafari = isIOSDevice && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(userAgent);
      const isDesktopSafari = !isIOSDevice && /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR/i.test(userAgent);

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
      const canSharePayload = (() => {
        if (!supportsShare || !nav) return false;
        if (typeof nav.canShare !== "function") return true;
        const shareCheckData: ShareData = sharePayload.files ? { files: sharePayload.files } : {};
        try {
          return nav.canShare(shareCheckData);
        } catch {
          return false;
        }
      })();
      const shouldOfferShare = supportsShare && canSharePayload && (isMobileSafari || isDesktopSafari);

      let downloadHref = dataUrlFallback;
      let revoke: (() => void) | undefined;

      if (!downloadHref) {
        const blobUrl = URL.createObjectURL(blob);
        downloadHref = blobUrl;
        revoke = () => URL.revokeObjectURL(blobUrl);
      }

      const downloadSucceeded = triggerDownload(downloadHref, revoke);
      let shareHandled = false;

      if (shouldOfferShare && nav?.share) {
        try {
          await nav.share(sharePayload);
          shareHandled = true;
        } catch (shareError) {
          console.warn("초대장 공유에 실패했습니다.", shareError);
        }
      }

      if (!shareHandled && !downloadSucceeded && isIOSDevice && supportsShare && canSharePayload && nav?.share) {
        try {
          await nav.share(sharePayload);
        } catch (shareError) {
          console.warn("초대장 공유에 실패했습니다.", shareError);
        }
      }
    } catch (error) {
      console.error(error);
      window.alert("초대장을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryClick = () => {
    setIsSaving(false);
    setShowResult(false);
    setToName("");
    setFromName("");
  };

  return (
    <main className="landing">
      <div className="landing-wrapper">
        <img
          src={asset("/invitation_2.svg")}
          alt="졸업전시 초대장 미리보기 이미지"
          className="landing-image-only"
        />
        <div className={`landing-overlay${showResult ? " landing-overlay--readonly" : ""}`}>
          {!showResult ? (
            <>
              <label className="landing-field landing-field--to" htmlFor="landing-to-input">
                {!toName && <img src={asset("/write.png")} alt="" className="landing-placeholder landing-placeholder--to" />}
                <input
                  id="landing-to-input"
                  className="landing-input"
                  aria-label="초대장을 받는 분"
                  maxLength={20}
                  value={toName}
                  onChange={(event) => setToName(event.target.value)}
                />
              </label>
              <label className="landing-field landing-field--from" htmlFor="landing-from-input">
                {!fromName && <img src={asset("/write.png")} alt="" className="landing-placeholder landing-placeholder--from" />}
                <input
                  id="landing-from-input"
                  className="landing-input"
                  aria-label="초대장을 보내는 분"
                  maxLength={20}
                  value={fromName}
                  onChange={(event) => setFromName(event.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <div
                className="landing-result-card"
                aria-live="polite"
                aria-label="완성된 초대장 미리보기"
              >
                <InvitationCanvas
                  from={fromName}
                  to={toName}
                  canvasRef={canvasRef}
                  className="landing-result-canvas"
                  imageSrc="/invitation_2.svg"
                />
              </div>
              <div className="landing-result-actions">
                <button
                  type="button"
                  className="landing-result-action"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  aria-label={isSaving ? "초대장 저장 중" : "초대장 저장하기"}
                >
                  <img src={asset("/save.svg")} alt="" />
                </button>
                <button
                  type="button"
                  className="landing-result-action landing-result-action--retry"
                  onClick={handleRetryClick}
                  aria-label="이름 다시 입력하기"
                >
                  <img src={asset("/retry.svg")} alt="" />
                </button>
              </div>
            </>
          )}
        </div>
        {!showResult && (
          <Link
            href="/generator"
            className="landing-button"
            prefetch={false}
            aria-label="초대장 만들기 페이지로 이동"
            onClick={handleButtonClick}
          >
            <img src={asset("/button_1.svg")} alt="초대장 만들기 이동 버튼" />
          </Link>
        )}
        <a ref={downloadLinkRef} style={{ display: "none" }} aria-hidden="true" />
      </div>
    </main>
  );
};

export default IndexPage;
