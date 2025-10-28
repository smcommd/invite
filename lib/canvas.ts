export const createPreviewScaleCanvas = (source: HTMLCanvasElement): HTMLCanvasElement | null => {
  if (!source.width || !source.height) {
    return null;
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = source.width;
  exportCanvas.height = source.height;
  const context = exportCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, source.width, source.height, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
};
