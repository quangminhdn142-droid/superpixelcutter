export interface SliceRect {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
}

export interface ChromaOptions {
  enabled: boolean;
  targetHex: string;
  tolerance: number; // 0 - 120
}

export interface GridSliceOptions {
  mode: 'count' | 'size';
  cols: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
  spacingX: number;
  spacingY: number;
  skipEmpty: boolean;
}

export interface AutoIslandOptions {
  mergeGap: number; // pixels to merge nearby islands
  minSize: number; // minimum width/height in px
  padding: number; // outer padding added to each box
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải ảnh đã chọn.'));
    img.src = src;
  });
}

export function sampleTopLeftColor(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#ffffff';
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  if (pixel[3] < 20) return '#ffffff';
  return rgbToHex(pixel[0], pixel[1], pixel[2]);
}

export function renderProcessedCanvas(
  sourceImg: HTMLImageElement,
  pixelSize: number,
  chroma: ChromaOptions
): HTMLCanvasElement {
  const width = sourceImg.naturalWidth || sourceImg.width;
  const height = sourceImg.naturalHeight || sourceImg.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
  if (!outCtx) return outCanvas;

  outCtx.imageSmoothingEnabled = false;

  if (pixelSize > 1) {
    const smallW = Math.max(1, Math.round(width / pixelSize));
    const smallH = Math.max(1, Math.round(height / pixelSize));
    const temp = document.createElement('canvas');
    temp.width = smallW;
    temp.height = smallH;
    const tempCtx = temp.getContext('2d');
    if (tempCtx) {
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(sourceImg, 0, 0, smallW, smallH);
      outCtx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, width, height);
    }
  } else {
    outCtx.drawImage(sourceImg, 0, 0, width, height);
  }

  if (chroma.enabled) {
    const imgData = outCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const { r: tr, g: tg, b: tb } = hexToRgb(chroma.targetHex);
    const maxDist = chroma.tolerance * 1.732; // Euclidean RGB scale

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const dr = data[i] - tr;
      const dg = data[i + 1] - tg;
      const db = data[i + 2] - tb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist <= maxDist) {
        data[i + 3] = 0;
      }
    }
    outCtx.putImageData(imgData, 0, 0);
  }

  return outCanvas;
}

function isRegionEmpty(
  data: Uint8ClampedArray,
  canvasWidth: number,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  const maxX = x + w;
  const maxY = y + h;
  for (let py = y; py < maxY; py++) {
    for (let px = x; px < maxX; px++) {
      const idx = (py * canvasWidth + px) * 4;
      if (data[idx + 3] > 16) {
        return false;
      }
    }
  }
  return true;
}

export function computeGridSlices(
  canvas: HTMLCanvasElement,
  options: GridSliceOptions
): SliceRect[] {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx ? ctx.getImageData(0, 0, width, height).data : null;

  const slices: SliceRect[] = [];
  let tileW = Math.max(4, options.tileWidth);
  let tileH = Math.max(4, options.tileHeight);
  let cols = Math.max(1, options.cols);
  let rows = Math.max(1, options.rows);

  const usableW = Math.max(1, width - options.offsetX);
  const usableH = Math.max(1, height - options.offsetY);

  if (options.mode === 'count') {
    tileW = Math.max(1, Math.floor((usableW - options.spacingX * (cols - 1)) / cols));
    tileH = Math.max(1, Math.floor((usableH - options.spacingY * (rows - 1)) / rows));
  } else {
    cols = Math.max(1, Math.floor((usableW + options.spacingX) / (tileW + options.spacingX)));
    rows = Math.max(1, Math.floor((usableH + options.spacingY) / (tileH + options.spacingY)));
  }

  let index = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = options.offsetX + c * (tileW + options.spacingX);
      const y = options.offsetY + r * (tileH + options.spacingY);
      const clippedW = Math.min(tileW, width - x);
      const clippedH = Math.min(tileH, height - y);
      if (clippedW <= 0 || clippedH <= 0) continue;

      if (options.skipEmpty && imgData) {
        if (isRegionEmpty(imgData, width, x, y, clippedW, clippedH)) {
          continue;
        }
      }

      const paddedNum = String(index).padStart(2, '0');
      slices.push({
        id: `grid-${r}-${c}`,
        label: `tile_${paddedNum}`,
        x,
        y,
        w: clippedW,
        h: clippedH,
        selected: true,
      });
      index++;
    }
  }

  return slices;
}

export function detectSpriteIslands(
  canvas: HTMLCanvasElement,
  options: AutoIslandOptions,
  bgFallbackHex: string,
  chromaEnabled: boolean
): SliceRect[] {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Downsample for fast connected-component detection on large images (> 640px)
  const scale = Math.max(1, Math.ceil(Math.max(width, height) / 480));
  const dw = Math.max(1, Math.floor(width / scale));
  const dh = Math.max(1, Math.floor(height / scale));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = dw;
  tempCanvas.height = dh;
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tCtx) return [];
  tCtx.imageSmoothingEnabled = false;
  tCtx.drawImage(canvas, 0, 0, dw, dh);

  const imgData = tCtx.getImageData(0, 0, dw, dh).data;
  const { r: bgR, g: bgG, b: bgB } = hexToRgb(bgFallbackHex);
  const fgMask = new Uint8Array(dw * dh);

  for (let i = 0; i < dw * dh; i++) {
    const p = i * 4;
    const a = imgData[p + 3];
    if (a <= 24) continue;
    if (!chromaEnabled) {
      // Also ignore solid background matching sampled edge color so non-keyed sheets still auto-detect
      const dr = imgData[p] - bgR;
      const dg = imgData[p + 1] - bgG;
      const db = imgData[p + 2] - bgB;
      if (Math.sqrt(dr * dr + dg * dg + db * db) < 34) {
        continue;
      }
    }
    fgMask[i] = 1;
  }

  // BFS flood fill with merge radius
  const visited = new Uint8Array(dw * dh);
  const stepRadius = Math.max(1, Math.round(options.mergeGap / scale));
  const rawBoxes: { minX: number; minY: number; maxX: number; maxY: number }[] = [];

  const queueX = new Int32Array(dw * dh);
  const queueY = new Int32Array(dw * dh);

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const startIdx = y * dw + x;
      if (fgMask[startIdx] === 0 || visited[startIdx] === 1) continue;

      let head = 0;
      let tail = 0;
      queueX[tail] = x;
      queueY[tail] = y;
      tail++;
      visited[startIdx] = 1;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (head < tail) {
        const cx = queueX[head];
        const cy = queueY[head];
        head++;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const y0 = Math.max(0, cy - stepRadius);
        const y1 = Math.min(dh - 1, cy + stepRadius);
        const x0 = Math.max(0, cx - stepRadius);
        const x1 = Math.min(dw - 1, cx + stepRadius);

        for (let ny = y0; ny <= y1; ny++) {
          const rowOff = ny * dw;
          for (let nx = x0; nx <= x1; nx++) {
            const nIdx = rowOff + nx;
            if (fgMask[nIdx] === 1 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queueX[tail] = nx;
              queueY[tail] = ny;
              tail++;
            }
          }
        }
      }

      const realX = Math.max(0, minX * scale - options.padding);
      const realY = Math.max(0, minY * scale - options.padding);
      const realMaxX = Math.min(width, (maxX + 1) * scale + options.padding);
      const realMaxY = Math.min(height, (maxY + 1) * scale + options.padding);
      const realW = realMaxX - realX;
      const realH = realMaxY - realY;

      if (realW >= options.minSize && realH >= options.minSize) {
        rawBoxes.push({
          minX: realX,
          minY: realY,
          maxX: realMaxX,
          maxY: realMaxY,
        });
      }
    }
  }

  // Sort reading order: top-to-bottom bands, then left-to-right
  rawBoxes.sort((a, b) => {
    const band = Math.max(24, Math.min(a.maxY - a.minY, b.maxY - b.minY) * 0.5);
    if (Math.abs(a.minY - b.minY) > band) {
      return a.minY - b.minY;
    }
    return a.minX - b.minX;
  });

  return rawBoxes.map((b, i) => ({
    id: `island-${i}`,
    label: `sprite_${String(i + 1).padStart(2, '0')}`,
    x: b.minX,
    y: b.minY,
    w: b.maxX - b.minX,
    h: b.maxY - b.minY,
    selected: true,
  }));
}

export function exportSliceDataUrl(
  canvas: HTMLCanvasElement,
  slice: SliceRect,
  scaleMultiplier = 1
): string {
  const outW = Math.max(1, Math.round(slice.w * scaleMultiplier));
  const outH = Math.max(1, Math.round(slice.h * scaleMultiplier));
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, slice.x, slice.y, slice.w, slice.h, 0, 0, outW, outH);
  return out.toDataURL('image/png');
}
