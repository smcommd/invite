import React, { FormEvent, useMemo, useRef, useState } from "react";
import InvitationCanvas from "./components/InvitationCanvas";
import DownloadButton from "./components/DownloadButton";

const GeneratorPage = () => {
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canvasFontOptions = useMemo(() => ({
    to: {
      weight: 400,
      manualSize: 1200,
    },
    from: {
      weight: 400,
      manualSize: 1200,
    },
  }), []);
  const canPreview = useMemo(() => fromName.trim().length > 0 && toName.trim().length > 0, [fromName, toName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canPreview) return;
    setIsPreviewing(true);
  };

  const handleReset = () => {
    setFromName("");
    setToName("");
    setIsPreviewing(false);
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <main className="generator">
      <div className="generator-shell">
        <div className="generator-confetti">
          <span className="mint" />
          <span className="sun" />
          <span className="sky" />
        </div>

        <div className="generator-body">
          <header className="generator-header">
            <p>상명대학교 디자인대학</p>
            <h1>
              커뮤니케이션디자인전공
              <br />
              제38회 졸업전시회
            </h1>
            <span>[ Invitation Card ]</span>
          </header>

          {!isPreviewing && (
            <form className="generator-form" onSubmit={handleSubmit}>
              <div className="generator-fields">
                <label className="generator-field">
                  <span className="generator-field-label">초대장을 받는 분</span>
                  <div className="generator-field-content">
                    <span className="generator-field-title">To.</span>
                    <input
                      className="generator-input"
                      maxLength={20}
                      placeholder="(입력하세요)"
                      value={toName}
                      onChange={(event) => setToName(event.target.value)}
                    />
                  </div>
                </label>

                <label className="generator-field">
                  <span className="generator-field-label">초대장을 보내는 분</span>
                  <div className="generator-field-content">
                    <span className="generator-field-title">From.</span>
                    <input
                      className="generator-input"
                      maxLength={20}
                      placeholder="(입력하세요)"
                      value={fromName}
                      onChange={(event) => setFromName(event.target.value)}
                    />
                  </div>
                </label>
              </div>

              <button
                className={`btn btn-primary btn-create${!canPreview ? " btn-disabled" : ""}`}
                type="submit"
                disabled={!canPreview}
              >
                초대장 만들기 <span className="arrow">➜</span>
              </button>
            </form>
          )}

          {isPreviewing && (
            <section className="generator-preview">
              <article className="preview-card">
                <div className="preview-text">
                  <p className="preview-label">To.</p>
                  <p>2025학년도 상명대학교 디자인대학 커뮤니케이션디자인전공 졸업전시회에 초대합니다.</p>
                </div>
                <InvitationCanvas
                  from={fromName}
                  to={toName}
                  canvasRef={canvasRef}
                  className="preview-canvas"
                  fontOptions={canvasFontOptions}
                />
                <div className="preview-details">
                  <p>
                    <strong>From.</strong> {fromName}
                  </p>
                  <p>
                    <strong>2025.11.14(fri) - 11.18(tue)</strong>
                  </p>
                  <p>더 서울라이티움 제1전시장</p>
                  <p>Opening | 11.14 17:00</p>
                  <p>관람시간 | 평일 17:00 - 19:00, 토·일 11:00 - 19:00</p>
                </div>
              </article>

              <DownloadButton from={fromName} to={toName} canvasRef={canvasRef} onReset={handleReset} />
            </section>
          )}
        </div>

        <footer className="generator-footer">
          <p>@smucd2025</p>
          <p>smucd2025.com</p>
        </footer>
      </div>
    </main>
  );
};

export default GeneratorPage;
