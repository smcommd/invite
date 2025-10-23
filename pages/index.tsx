import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const INVITATION_WIDTH = 1024;
const INVITATION_HEIGHT = 1464;
const TO_TEXT_RATIO = 182 / INVITATION_HEIGHT;
const FROM_TEXT_RATIO = 824 / INVITATION_HEIGHT;
const TO_TEXT_X_OFFSET = -25;
const FROM_TEXT_X_OFFSET = 50;
const MAX_TEXT_WIDTH_RATIO = 0.68;
const NAME_FONT_BASE = 42;
const NAME_FONT_MIN = 24;
const NAME_FONT_MAX = 64;
const NAME_FONT_FAMILIES = `"rixdongnimgothic-pro","tk-rixdongnimgothic-pro",sans-serif`;
const DOWNLOAD_FONT_SCALE = 3.2;

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
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const toTextRef = useRef<HTMLSpanElement | null>(null);
  const fromTextRef = useRef<HTMLSpanElement | null>(null);

  const handleButtonClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!showResult) {
      event.preventDefault();
      setShowResult(true);
    }
  };

  const loadInvitationImage = (src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("invitation image failed to load"));
      image.src = src;
    });
  };

  const handleSaveClick = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      if (!canvasRef.current) {
        canvasRef.current = canvas;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("캔버스 컨텍스트를 초기화할 수 없습니다.");
      }

      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore
        }
      }

      if (document.fonts?.load) {
        try {
          await Promise.all([
            document.fonts.load("700 48px rixdongnimgothic-pro"),
            document.fonts.load("700 48px 'rixdongnimgothic-pro'"),
            document.fonts.load("700 48px 'tk-rixdongnimgothic-pro'"),
          ]);
        } catch {
          // ignore font loading errors and fall back to default rendering
        }
      }

      const invitationImage = await loadInvitationImage(asset("/invitation_2.png"));
      canvas.width = invitationImage.width;
      canvas.height = invitationImage.height;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(invitationImage, 0, 0);

      const sanitizedTo = toName.trim();
      const sanitizedFrom = fromName.trim();

      const getElementMetrics = (element: HTMLElement | null) => {
        const card = resultCardRef.current;
        if (!card || !element) return null;
        const cardRect = card.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        if (cardRect.width === 0 || cardRect.height === 0) return null;

        const scaleX = canvas.width / cardRect.width;
        const scaleY = canvas.height / cardRect.height;
        const centerX = elementRect.left + elementRect.width / 2 - cardRect.left;
        const centerY = elementRect.top + elementRect.height / 2 - cardRect.top;
        const computedStyle = typeof window !== "undefined" ? window.getComputedStyle(element) : null;
        const parsedFontSize = computedStyle ? parseFloat(computedStyle.fontSize || "") : NaN;

        return {
          center: {
            x: centerX * scaleX,
            y: centerY * scaleY,
          },
          fontSize: Number.isFinite(parsedFontSize) ? parsedFontSize * scaleX : undefined,
          maxWidth: elementRect.width * scaleX,
        };
      };

      const centeredFillText = (text: string, ratio: number, xOffset = 0, element: HTMLElement | null = null) => {
        if (!text) return;
        const y = Math.round(canvas.height * ratio);
        const elementMetrics = getElementMetrics(element);
        const maxWidth = elementMetrics?.maxWidth ?? canvas.width * MAX_TEXT_WIDTH_RATIO;
        const baseFontSize = Math.round((canvas.width * NAME_FONT_BASE) / INVITATION_WIDTH);
        let fontSize = elementMetrics?.fontSize ?? Math.max(NAME_FONT_MIN, Math.min(NAME_FONT_MAX, baseFontSize));

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#121212";

        const measure = (size: number) => {
          context.font = `700 ${size}px ${NAME_FONT_FAMILIES}`;
          return context.measureText(text).width;
        };

        let measured = measure(fontSize);
        while (measured > maxWidth && fontSize > NAME_FONT_MIN) {
          fontSize -= 2;
          measured = measure(fontSize);
        }

        const scaledTarget = Math.round(fontSize * DOWNLOAD_FONT_SCALE);
        if (!elementMetrics?.fontSize && scaledTarget > fontSize) {
          let scaledFontSize = scaledTarget;
          let scaledMeasured = measure(scaledFontSize);
          while (scaledMeasured > maxWidth && scaledFontSize > fontSize) {
            scaledFontSize -= 1;
            scaledMeasured = measure(scaledFontSize);
          }
          if (scaledMeasured <= maxWidth) {
            fontSize = scaledFontSize;
          }
        }

        context.font = `700 ${fontSize}px ${NAME_FONT_FAMILIES}`;
        const targetX = elementMetrics?.center.x ?? canvas.width / 2 + xOffset;
        const targetY = elementMetrics?.center.y ?? y;
        context.fillText(text, targetX, targetY);
      };

      if (sanitizedTo || sanitizedFrom) {
        centeredFillText(sanitizedTo, TO_TEXT_RATIO, TO_TEXT_X_OFFSET, toTextRef.current);
        centeredFillText(sanitizedFrom, FROM_TEXT_RATIO, FROM_TEXT_X_OFFSET, fromTextRef.current);
      }

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

      if (canvas.toBlob) {
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      } else {
        const dataUrl = canvas.toDataURL("image/png");
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

  const toTextStyle = useMemo(
    () => ({
      top: `${TO_TEXT_RATIO * 100}%`,
      left: `calc(50% ${TO_TEXT_X_OFFSET >= 0 ? "+" : "-"} ${Math.abs(TO_TEXT_X_OFFSET)}px)`,
    }),
    []
  );
  const fromTextStyle = useMemo(
    () => ({
      top: `${FROM_TEXT_RATIO * 100}%`,
      left: `calc(50% ${FROM_TEXT_X_OFFSET >= 0 ? "+" : "-"} ${Math.abs(FROM_TEXT_X_OFFSET)}px)`,
    }),
    []
  );

  return (
    <main className="landing">
      <div className="landing-wrapper">
        <img
          src={showResult ? asset("/result.png") : asset("/invitation.png")}
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
                ref={resultCardRef}
              >
                <img src={asset("/invitation_2.png")} alt="" className="landing-result-card__image" />
                {toName && (
                  <span
                    className="landing-result-text landing-result-text--to"
                    style={toTextStyle}
                    aria-label="초대 받는 분"
                    ref={toTextRef}
                  >
                    {toName}
                  </span>
                )}
                {fromName && (
                  <span
                    className="landing-result-text landing-result-text--from"
                    style={fromTextStyle}
                    aria-label="초대 보내는 분"
                    ref={fromTextRef}
                  >
                    {fromName}
                  </span>
                )}
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
