export const createPreviewScaleCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
  if (!source.width || !source.height) {
    return null;
  }

  const rect = source.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const cssWidth = Math.max(1, Math.round(rect.width));
  const aspectRatio = source.height / source.width;
  const cssHeight = Math.max(1, Math.round(cssWidth * aspectRatio));

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = cssWidth;
  exportCanvas.height = cssHeight;

  const context = exportCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, source.width, source.height, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
};
