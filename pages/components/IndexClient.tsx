import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import InvitationCanvas from "./InvitationCanvas";
import { createPreviewScaleCanvas } from "../../lib/canvas";

const CANVAS_BASE_WIDTH = 1024;

const IndexClient = () => {
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
  const landingWrapperRef = useRef<HTMLDivElement | null>(null);
  const landingImageRef = useRef<HTMLImageElement | null>(null);
  const [landingFontScale, setLandingFontScale] = useState<number | null>(null);

  // 캔버스(저장용) 폰트 옵션
  const CANVAS_FONT_OPTIONS = useMemo(() => ({
    to: { weight: 400, manualSize: 120 },
    from: { weight: 400, manualSize: 120 },
  }), []);

  // 메인 화면 오버레이(입력창)에만 적용할 프리뷰 폰트 옵션 (작게 표시)
  const OVERLAY_FONT_OPTIONS = useMemo(() => ({
    to: { weight: 400, manualSize: 60 },
    from: { weight: 400, manualSize: 60 },
  }), []);

  const updateLandingFontScale = useCallback(() => {
    const image = landingImageRef.current;
    const wrapper = landingWrapperRef.current;
    const width = image?.clientWidth ?? wrapper?.clientWidth;
    if (!width) return;
    const scale = width / CANVAS_BASE_WIDTH;
    setLandingFontScale((prev) => (prev === null ? scale : Math.abs(prev - scale) > 0.005 ? scale : prev));
  }, []);

  useEffect(() => {
    updateLandingFontScale();
    const wrapper = landingWrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateLandingFontScale());
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [updateLandingFontScale]);

  useEffect(() => {
    const image = landingImageRef.current;
    if (!image) return;
    if (image.complete) {
      updateLandingFontScale();
      return;
    }
    image.addEventListener("load", updateLandingFontScale);
    return () => image.removeEventListener("load", updateLandingFontScale);
  }, [updateLandingFontScale]);

  const landingOverlayStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!landingFontScale) return undefined;
    const style: Record<string, string> = {};
    // 오버레이는 캔버스와 분리해서 더 작게 보이도록 별도 설정 사용
    const toManual = OVERLAY_FONT_OPTIONS.to.manualSize ?? 0;
    const fromManual = OVERLAY_FONT_OPTIONS.from.manualSize ?? 0;
    const toWeight = OVERLAY_FONT_OPTIONS.to.weight ?? 400;
    const fromWeight = OVERLAY_FONT_OPTIONS.from.weight ?? 400;
    if (toManual > 0) {
      const size = landingFontScale * toManual;
      style["--landing-to-font-size"] = `${Math.round(size)}px`;
      style["--landing-to-line-height"] = `${Math.round(size * 1.08)}px`;
    }
    if (fromManual > 0) {
      const size = landingFontScale * fromManual;
      style["--landing-from-font-size"] = `${Math.round(size)}px`;
      style["--landing-from-line-height"] = `${Math.round(size * 1.08)}px`;
    }
    style["--landing-to-font-weight"] = `${toWeight}`;
    style["--landing-from-font-weight"] = `${fromWeight}`;
    return style as React.CSSProperties;
  }, [landingFontScale, CANVAS_FONT_OPTIONS]);

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
      if (!link) throw new Error("다운로드 링크가 준비되지 않았습니다.");
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
        if (revoke) window.setTimeout(revoke, 1500);
        return !isIOS;
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
        for (let index = 0; index < byteString.length; index += 1) view[index] = byteString.charCodeAt(index);
        blob = new Blob([view], { type: mimeType });
      }
      if (!blob) throw new Error("초대장 이미지를 생성하지 못했습니다.");

      const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { canShare?: (data: ShareData & { files?: File[] }) => boolean; share?: (data: ShareData & { files?: File[] }) => Promise<void>; }) : undefined;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isIOSDevice = /iP(ad|hone|od)/i.test(userAgent);
      const isMobileSafari = isIOSDevice && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(userAgent);
      const isDesktopSafari = !isIOSDevice && /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR/i.test(userAgent);
      const isAndroidDevice = /Android/i.test(userAgent);

      const shareText = sanitizedTo ? `${sanitizedTo} 님께 전달하는 초대장입니다.` : "초대장을 함께 확인해 주세요.";
      const sharePayload: ShareData & { files?: File[] } = { title: sanitizedFrom ? `${sanitizedFrom}의 초대장` : "초대장", text: shareText };
      if (typeof File !== "undefined") {
        try { sharePayload.files = [new File([blob], fileName, { type: "image/png" })]; } catch {}
      }
      const supportsShare = Boolean(nav?.share);
      const canShareFiles = (() => {
        if (!supportsShare || !nav || !sharePayload.files?.length) return false;
        if (typeof nav.canShare !== "function") return true;
        try { return nav.canShare({ files: sharePayload.files }); } catch { return false; }
      })();
      const shouldAttemptShare = supportsShare && (isIOSDevice || isAndroidDevice || isMobileSafari || isDesktopSafari);
      const shareWithData = async (data: ShareData & { files?: File[] }) => {
        if (!nav?.share) return false;
        try { await nav.share(data); return true; } catch (err) { console.warn("초대장 공유에 실패했습니다.", err); return false; }
      };
      let shareHandled = false;
      if (shouldAttemptShare && nav?.share) {
        if (sharePayload.files && canShareFiles) shareHandled = await shareWithData(sharePayload);
        if (!shareHandled) {
          const fallbackShare: ShareData = { title: sharePayload.title, text: sharePayload.text ?? sharePayload.title ?? "초대장을 함께 확인해 주세요." };
          shareHandled = await shareWithData(fallbackShare);
        }
      }
      let downloadHref = dataUrlFallback; let revoke: (() => void) | undefined;
      if (!downloadHref) { const blobUrl = URL.createObjectURL(blob); downloadHref = blobUrl; revoke = () => URL.revokeObjectURL(blobUrl); }
      if (shareHandled) { revoke?.(); return; }
      const downloadSucceeded = triggerDownload(downloadHref, revoke);
      if (!downloadSucceeded && shouldAttemptShare && nav?.share) { await shareWithData(sharePayload); }
    } catch (error) {
      console.error(error);
      window.alert("초대장을 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally { setIsSaving(false); }
  };

  const handleRetryClick = () => { setIsSaving(false); setShowResult(false); setToName(""); setFromName(""); };

  return (
    <main className="landing">
      <div className="landing-wrapper" ref={landingWrapperRef}>
        <img src={asset("/invitation.png")} alt="졸업전시 초대장 미리보기 이미지" className="landing-image-only" ref={landingImageRef} onLoad={updateLandingFontScale} />
        <div className={`landing-overlay${showResult ? " landing-overlay--readonly" : ""}`} style={!showResult ? landingOverlayStyle : undefined}>
          {!showResult ? (
            <>
              <label className="landing-field landing-field--to" htmlFor="landing-to-input">
                {!toName && <img src={asset("/write.png")} alt="" className="landing-placeholder landing-placeholder--to" />}
                <input id="landing-to-input" className="landing-input" aria-label="초대장을 받는 분" maxLength={20} value={toName} onChange={(e) => setToName(e.target.value)} />
              </label>
              <label className="landing-field landing-field--from" htmlFor="landing-from-input">
                {!fromName && <img src={asset("/write.png")} alt="" className="landing-placeholder landing-placeholder--from" />}
                <input id="landing-from-input" className="landing-input" aria-label="초대장을 보내는 분" maxLength={20} value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </label>
            </>
          ) : (
            <>
              <div className="landing-result-card" aria-live="polite" aria-label="완성된 초대장 미리보기">
                <InvitationCanvas from={fromName} to={toName} canvasRef={canvasRef} className="landing-result-canvas" imageSrc="/invitation_2.svg" fontOptions={CANVAS_FONT_OPTIONS} />
              </div>
              <div className="landing-result-actions">
                <button type="button" className="landing-result-action" onClick={handleSaveClick} disabled={isSaving} aria-label={isSaving ? "초대장 저장 중" : "초대장 저장하기"}>
                  <img src={asset("/save.svg")} alt="" />
                </button>
                <button type="button" className="landing-result-action landing-result-action--retry" onClick={handleRetryClick} aria-label="이름 다시 입력하기">
                  <img src={asset("/retry.svg")} alt="" />
                </button>
              </div>
            </>
          )}
        </div>
        {!showResult && (
          <Link href="/generator" className="landing-button" prefetch={false} aria-label="초대장 만들기 페이지로 이동" onClick={(e) => { if (!showResult) { e.preventDefault(); setShowResult(true); } }}>
            <img src={asset("/button_1.svg")} alt="초대장 만들기 이동 버튼" />
          </Link>
        )}
        <a ref={downloadLinkRef} style={{ display: "none" }} aria-hidden="true" />
      </div>
    </main>
  );
};

export default IndexClient;
