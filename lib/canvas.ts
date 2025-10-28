export const createPreviewScaleCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
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
  const context = exportCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, source.width, source.height, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
};
