export const createPreviewScaleCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
  if (!source.width || !source.height) {
    return null;
  }

  const rect = source.getBoundingClientRect();
  const cssWidth = rect.width;
  const cssHeight = rect.height;

  // When the canvas is already displayed at native resolution, just return the source.
  if (!cssWidth || !cssHeight || Math.abs(cssWidth - source.width) < 1) {
    return source;
  }

  const scaleX = cssWidth / source.width;
  const scaleY = cssHeight / source.height;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = Math.max(1, Math.round(source.width * scaleX));
  exportCanvas.height = Math.max(1, Math.round(source.height * scaleY));
  const context = exportCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, source.width, source.height, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
};
