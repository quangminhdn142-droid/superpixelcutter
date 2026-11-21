import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  Eraser,
  FileJson,
  Grid3X3,
  ImagePlus,
  Layers,
  MousePointerClick,
  Pipette,
  RotateCcw,
  Scissors,
  Square,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AutoIslandOptions,
  ChromaOptions,
  GridSliceOptions,
  SliceRect,
  computeGridSlices,
  detectSpriteIslands,
  exportSliceDataUrl,
  loadImageElement,
  renderProcessedCanvas,
  sampleTopLeftColor,
} from '../utils/pixelEngine';
import { createZipBlob, dataUrlToUint8Array } from '../utils/zipBuilder';

type CutMode = 'auto' | 'grid' | 'manual';

interface SampleAsset {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  defaultMode: CutMode;
  defaultCols: number;
  defaultRows: number;
}

const SAMPLE_ASSETS: SampleAsset[] = [
  {
    id: 'rpg-items',
    name: 'Bộ Vật Phẩm RPG',
    subtitle: '9 vật phẩm · Lưới 3×3',
    src: '/src/assets/images/sample_sprite_sheet_1795249631958.jpg',
    defaultMode: 'auto',
    defaultCols: 3,
    defaultRows: 3,
  },
  {
    id: 'iso-props',
    name: 'Đạo Cụ Isometric',
    subtitle: '4 khối kiến trúc · 2×2',
    src: '/src/assets/images/sample_isometric_tiles_1795249631358.jpg',
    defaultMode: 'auto',
    defaultCols: 2,
    defaultRows: 2,
  },
  {
    id: 'robot-frames',
    name: 'Hoạt Ảnh Robot',
    subtitle: '4 khung chuyển động',
    src: '/src/assets/images/sample_character_sheet_1795249631296.jpg',
    defaultMode: 'auto',
    defaultCols: 4,
    defaultRows: 1,
  },
];

interface SlicePreviewItem {
  slice: SliceRect;
  dataUrl: string;
}

export default function PixelCutterStudio() {
  const [activeSampleId, setActiveSampleId] = useState<string>(SAMPLE_ASSETS[0].id);
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_ASSETS[0].src);
  const [imageName, setImageName] = useState<string>('bo_vat_pham_rpg');
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Cutting mode
  const [cutMode, setCutMode] = useState<CutMode>('auto');

  // Zoom & View options
  const [zoom, setZoom] = useState<number>(0.65);
  const [showPixelGrid, setShowPixelGrid] = useState<boolean>(false);

  // Pixelation & Chroma background cut
  const [pixelSize, setPixelSize] = useState<number>(1);
  const [exportScale, setExportScale] = useState<number>(1);
  const [chroma, setChroma] = useState<ChromaOptions>({
    enabled: true,
    targetHex: '#ffffff',
    tolerance: 28,
  });
  const [eyedropperActive, setEyedropperActive] = useState<boolean>(false);

  // Grid mode parameters
  const [gridOptions, setGridOptions] = useState<GridSliceOptions>({
    mode: 'count',
    cols: 3,
    rows: 3,
    tileWidth: 64,
    tileHeight: 64,
    offsetX: 0,
    offsetY: 0,
    spacingX: 0,
    spacingY: 0,
    skipEmpty: true,
  });

  // Auto-island mode parameters
  const [autoOptions, setAutoOptions] = useState<AutoIslandOptions>({
    mergeGap: 14,
    minSize: 28,
    padding: 4,
  });

  // Manual marquee boxes
  const [manualSlices, setManualSlices] = useState<SliceRect[]>([]);
  const [manualSnap, setManualSnap] = useState<number>(1);
  const [drawingRect, setDrawingRect] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);

  // Computed / active slices
  const [slices, setSlices] = useState<SliceRect[]>([]);
  const [focusedSliceId, setFocusedSliceId] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<SlicePreviewItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image whenever imageSrc changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    loadImageElement(imageSrc)
      .then((img) => {
        if (cancelled) return;
        setSourceImg(img);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        setImgDimensions({ w, h });

        // Sample top-left pixel for default chroma color
        const temp = document.createElement('canvas');
        temp.width = 1;
        temp.height = 1;
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
          const sampled = sampleTopLeftColor(temp);
          setChroma((prev) => ({ ...prev, targetHex: sampled }));
        }

        // Auto fit zoom to viewport width (~700px container)
        const containerW = viewportContainerRef.current?.clientWidth
          ? viewportContainerRef.current.clientWidth - 48
          : 680;
        const containerH = 480;
        const fitZoom = Math.min(1, containerW / w, containerH / h);
        setZoom(Math.max(0.25, Math.min(2, Number(fitZoom.toFixed(2)))));
        setManualSlices([]);
        setFocusedSliceId(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Không thể đọc tệp ảnh.');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // Process canvas + compute slices whenever parameters change
  useEffect(() => {
    if (!sourceImg) return;

    const processed = renderProcessedCanvas(sourceImg, pixelSize, chroma);
    processedCanvasRef.current = processed;

    // Paint to visible canvas
    const display = displayCanvasRef.current;
    if (display) {
      display.width = processed.width;
      display.height = processed.height;
      const dCtx = display.getContext('2d');
      if (dCtx) {
        dCtx.imageSmoothingEnabled = false;
        dCtx.clearRect(0, 0, display.width, display.height);
        dCtx.drawImage(processed, 0, 0);
      }
    }

    let nextSlices: SliceRect[] = [];
    if (cutMode === 'grid') {
      nextSlices = computeGridSlices(processed, gridOptions);
    } else if (cutMode === 'auto') {
      nextSlices = detectSpriteIslands(processed, autoOptions, chroma.targetHex, chroma.enabled);
    } else {
      nextSlices = manualSlices;
    }

    setSlices(nextSlices);
  }, [sourceImg, pixelSize, chroma, cutMode, gridOptions, autoOptions, manualSlices]);

  // Generate thumbnail data URLs for the bottom Slice Gallery
  useEffect(() => {
    const processed = processedCanvasRef.current;
    if (!processed || slices.length === 0) {
      setPreviewItems([]);
      return;
    }

    const cappedSlices = slices.slice(0, 64);
    const items = cappedSlices.map((slice) => ({
      slice,
      dataUrl: exportSliceDataUrl(processed, slice, 1),
    }));
    setPreviewItems(items);
  }, [slices]);

  const selectedCount = useMemo(() => slices.filter((s) => s.selected).length, [slices]);

  const showToast = useCallback((msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const handleSelectSample = (sample: SampleAsset) => {
    setActiveSampleId(sample.id);
    setImageSrc(sample.src);
    setImageName(sample.id.replace(/-/g, '_'));
    setGridOptions((prev) => ({
      ...prev,
      mode: 'count',
      cols: sample.defaultCols,
      rows: sample.defaultRows,
    }));
    setPixelSize(1);
    setChroma((prev) => ({ ...prev, enabled: true }));
    setEyedropperActive(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, WEBP, GIF).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setActiveSampleId('custom');
        setImageSrc(reader.result);
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        setImageName(baseName || 'pixel_asset');
        setEyedropperActive(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = Math.floor((e.clientX - rect.left) * scaleX);
    let y = Math.floor((e.clientY - rect.top) * scaleY);
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    return { x, y };
  };

  const snapValue = (val: number) => {
    if (manualSnap <= 1) return val;
    return Math.round(val / manualSnap) * manualSnap;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Eyedropper mode takes priority
    if (eyedropperActive && sourceImg) {
      const temp = document.createElement('canvas');
      temp.width = imgDimensions.w;
      temp.height = imgDimensions.h;
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(sourceImg, 0, 0);
        const px = tCtx.getImageData(
          Math.min(imgDimensions.w - 1, coords.x),
          Math.min(imgDimensions.h - 1, coords.y),
          1,
          1
        ).data;
        const hex = `#${[px[0], px[1], px[2]]
          .map((n) => n.toString(16).padStart(2, '0'))
          .join('')}`;
        setChroma({ enabled: true, targetHex: hex, tolerance: chroma.tolerance });
        setEyedropperActive(false);
        showToast(`Đã lấy mẫu màu nền ${hex.toUpperCase()}`);
      }
      return;
    }

    if (cutMode === 'manual') {
      const sx = snapValue(coords.x);
      const sy = snapValue(coords.y);
      setDrawingRect({ startX: sx, startY: sy, curX: sx, curY: sy });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRect || cutMode !== 'manual') return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setDrawingRect((prev) =>
      prev ? { ...prev, curX: snapValue(coords.x), curY: snapValue(coords.y) } : null
    );
  };

  const handleCanvasMouseUp = () => {
    if (!drawingRect || cutMode !== 'manual') return;
    const x = Math.min(drawingRect.startX, drawingRect.curX);
    const y = Math.min(drawingRect.startY, drawingRect.curY);
    const w = Math.abs(drawingRect.curX - drawingRect.startX);
    const h = Math.abs(drawingRect.curY - drawingRect.startY);
    setDrawingRect(null);

    if (w >= 4 && h >= 4) {
      const newBox: SliceRect = {
        id: `manual-${Date.now()}`,
        label: `cut_${String(manualSlices.length + 1).padStart(2, '0')}`,
        x,
        y,
        w,
        h,
        selected: true,
      };
      setManualSlices((prev) => [...prev, newBox]);
      setFocusedSliceId(newBox.id);
    }
  };

  const toggleSliceSelection = (id: string) => {
    if (cutMode === 'manual') {
      setManualSlices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
      );
    } else {
      setSlices((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
    }
    setFocusedSliceId(id);
  };

  const setAllSelected = (selected: boolean) => {
    if (cutMode === 'manual') {
      setManualSlices((prev) => prev.map((s) => ({ ...s, selected })));
    } else {
      setSlices((prev) => prev.map((s) => ({ ...s, selected })));
    }
  };

  const deleteManualSlice = (id: string) => {
    setManualSlices((prev) => prev.filter((s) => s.id !== id));
    if (focusedSliceId === id) setFocusedSliceId(null);
  };

  const downloadSingleSlice = (slice: SliceRect) => {
    const processed = processedCanvasRef.current;
    if (!processed) return;
    const url = exportSliceDataUrl(processed, slice, exportScale);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageName}_${slice.label}_${slice.w * exportScale}x${slice.h * exportScale}.png`;
    link.click();
    showToast(`Đã tải xuống ${slice.label}.png`);
  };

  const downloadAllAsZip = () => {
    const processed = processedCanvasRef.current;
    if (!processed) return;
    const selectedSlices = slices.filter((s) => s.selected);
    if (selectedSlices.length === 0) {
      showToast('Hãy chọn ít nhất 1 mảnh cắt để xuất tệp ZIP.');
      return;
    }

    const entries = selectedSlices.map((slice) => {
      const dataUrl = exportSliceDataUrl(processed, slice, exportScale);
      return {
        name: `${imageName}_${slice.label}.png`,
        data: dataUrlToUint8Array(dataUrl),
      };
    });

    const atlasPayload = {
      source: imageName,
      sourceWidth: imgDimensions.w,
      sourceHeight: imgDimensions.h,
      exportScale,
      pixelSize,
      frames: selectedSlices.map((s) => ({
        name: `${imageName}_${s.label}.png`,
        x: s.x * exportScale,
        y: s.y * exportScale,
        w: s.w * exportScale,
        h: s.h * exportScale,
      })),
    };
    entries.push({
      name: `${imageName}_atlas.json`,
      data: new TextEncoder().encode(JSON.stringify(atlasPayload, null, 2)),
    });

    const blob = createZipBlob(entries);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageName}_superpixelcutter.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Đã đóng gói ${selectedSlices.length} ảnh PNG + atlas.json vào tệp ZIP.`);
  };

  const downloadAtlasJson = () => {
    const selectedSlices = slices.filter((s) => s.selected);
    if (selectedSlices.length === 0) {
      showToast('Chưa có khung cắt nào được chọn để xuất JSON.');
      return;
    }
    const payload = {
      generator: 'superpixelcutter.com',
      source: imageName,
      width: imgDimensions.w,
      height: imgDimensions.h,
      exportScale,
      slices: selectedSlices.map((s) => ({
        id: s.label,
        x: s.x * exportScale,
        y: s.y * exportScale,
        w: s.w * exportScale,
        h: s.h * exportScale,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageName}_atlas.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã xuất tệp tọa độ JSON.');
  };

  const fitZoomToCanvas = () => {
    if (!imgDimensions.w || !imgDimensions.h) return;
    const containerW = viewportContainerRef.current?.clientWidth
      ? viewportContainerRef.current.clientWidth - 48
      : 680;
    const fit = Math.min(2, containerW / imgDimensions.w, 480 / imgDimensions.h);
    setZoom(Math.max(0.25, Number(fit.toFixed(2))));
  };

  const resetAllSettings = () => {
    setPixelSize(1);
    setExportScale(1);
    setChroma((prev) => ({ ...prev, enabled: true, tolerance: 28 }));
    setAutoOptions({ mergeGap: 14, minSize: 28, padding: 4 });
    setGridOptions((prev) => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0,
      spacingY: 0,
      skipEmpty: true,
    }));
    setManualSlices([]);
    showToast('Đã khôi phục thông số cắt mặc định.');
  };

  const focusedSlice = useMemo(
    () => slices.find((s) => s.id === focusedSliceId) ?? null,
    [slices, focusedSliceId]
  );

  return (
    <section id="studio" className="border-b border-[#E2E2DC] bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Studio Header */}
        <div className="flex flex-col gap-4 border-b border-[#E2E2DC] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-[#E54826]">Trình Cắt Pixel Trực Tiếp</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#141619] sm:text-3xl">
              Bàn Cắt Sprite & Điểm Ảnh
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#141619] bg-[#141619] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2A2E33] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              <span>Tải Ảnh Từ Máy</span>
            </button>

            <button
              type="button"
              onClick={resetAllSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E2DC] bg-[#F8F8F6] px-3 py-2 text-xs font-medium text-[#141619] transition-colors hover:bg-[#ECECE6] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đặt Lại</span>
            </button>
          </div>
        </div>

        {/* Sample Asset Switcher Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-[#52565E]">Bộ ảnh mẫu thử ngay:</span>
            {SAMPLE_ASSETS.map((sample) => {
              const active = activeSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-[#E54826] bg-[#E54826]/8 font-semibold text-[#141619]'
                      : 'border-[#E2E2DC] bg-[#F8F8F6] text-[#52565E] hover:border-[#C5C5BD] hover:text-[#141619]'
                  }`}
                >
                  <img
                    src={sample.src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-5 w-5 rounded border border-[#E2E2DC] object-cover pixelated"
                  />
                  <span>{sample.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#52565E] font-mono tabular-nums">
            <span>
              Kích thước gốc: {imgDimensions.w} × {imgDimensions.h} px
            </span>
            <span aria-hidden="true">·</span>
            <span>{slices.length} khung cắt</span>
          </div>
        </div>

        {/* Main Workbench Container */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E2E2DC] bg-[#F8F8F6]">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left / Main Canvas Viewport (8 cols) */}
            <div className="flex flex-col border-b border-[#E2E2DC] lg:col-span-8 lg:border-b-0 lg:border-r">
              {/* Viewport Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E2DC] bg-white px-4 py-2.5">
                {/* Cutting Mode Segmented Control */}
                <div className="flex items-center gap-1 rounded-lg bg-[#F0F0EC] p-1">
                  <button
                    type="button"
                    onClick={() => setCutMode('auto')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cutMode === 'auto'
                        ? 'bg-white text-[#141619] shadow-xs'
                        : 'text-[#52565E] hover:text-[#141619]'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tách Tự Động</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCutMode('grid')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cutMode === 'grid'
                        ? 'bg-white text-[#141619] shadow-xs'
                        : 'text-[#52565E] hover:text-[#141619]'
                    }`}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Cắt Lưới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCutMode('manual')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cutMode === 'manual'
                        ? 'bg-white text-[#141619] shadow-xs'
                        : 'text-[#52565E] hover:text-[#141619]'
                    }`}
                  >
                    <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Vẽ Khung Cắt</span>
                  </button>
                </div>

                {/* Zoom & Pixel Grid Tools */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
                    aria-label="Thu nhỏ"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E2DC] bg-white text-[#141619] hover:bg-[#F0F0EC] cursor-pointer"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[52px] text-center font-mono text-xs font-medium text-[#141619] tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))))}
                    aria-label="Phóng to"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E2DC] bg-white text-[#141619] hover:bg-[#F0F0EC] cursor-pointer"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={fitZoomToCanvas}
                    className="rounded-md border border-[#E2E2DC] bg-white px-2.5 py-1 text-xs font-medium text-[#52565E] hover:text-[#141619] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Vừa khung
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPixelGrid((g) => !g)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      showPixelGrid
                        ? 'border-[#141619] bg-[#141619] text-white'
                        : 'border-[#E2E2DC] bg-white text-[#52565E] hover:text-[#141619]'
                    }`}
                  >
                    Lưới Pixel
                  </button>
                </div>
              </div>

              {/* Interactive Canvas Mat */}
              <div
                ref={viewportContainerRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className={`relative flex min-h-[440px] max-h-[540px] flex-1 items-center justify-center overflow-auto checkerboard-dark p-6 ${
                  isDraggingFile ? 'ring-2 ring-inset ring-[#E54826]' : ''
                }`}
              >
                {isLoading && (
                  <div className="rounded-lg bg-[#141619]/90 px-4 py-2 text-xs font-medium text-white">
                    Đang xử lý dữ liệu điểm ảnh...
                  </div>
                )}

                {loadError && (
                  <div className="rounded-lg border border-[#DC2626]/40 bg-[#141619] px-4 py-3 text-xs text-red-300">
                    {loadError}
                  </div>
                )}

                {!isLoading && !loadError && imgDimensions.w > 0 && (
                  <div
                    className="relative shrink-0 shadow-lg ring-1 ring-white/10"
                    style={{
                      width: `${Math.round(imgDimensions.w * zoom)}px`,
                      height: `${Math.round(imgDimensions.h * zoom)}px`,
                    }}
                  >
                    <canvas
                      ref={displayCanvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={() => {
                        if (drawingRect) handleCanvasMouseUp();
                      }}
                      className={`h-full w-full pixelated ${
                        eyedropperActive || cutMode === 'manual' ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                    />

                    {/* Optional subtle pixel grid overlay when zoomed or enabled */}
                    {showPixelGrid && (
                      <div
                        className="pointer-events-none absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
                          backgroundSize: `${Math.max(4, Math.round(pixelSize * zoom * 4))}px ${Math.max(
                            4,
                            Math.round(pixelSize * zoom * 4)
                          )}px`,
                        }}
                      />
                    )}

                    {/* Slice Rectangles Overlay */}
                    <div className="pointer-events-none absolute inset-0">
                      {slices.map((slice, idx) => {
                        const isFocused = focusedSliceId === slice.id;
                        return (
                          <button
                            key={slice.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!eyedropperActive && cutMode !== 'manual') {
                                toggleSliceSelection(slice.id);
                              } else {
                                setFocusedSliceId(slice.id);
                              }
                            }}
                            title={`${slice.label}: ${slice.w}×${slice.h} px`}
                            style={{
                              left: `${slice.x * zoom}px`,
                              top: `${slice.y * zoom}px`,
                              width: `${slice.w * zoom}px`,
                              height: `${slice.h * zoom}px`,
                              pointerEvents: cutMode === 'manual' || eyedropperActive ? 'none' : 'auto',
                            }}
                            className={`group absolute border transition-colors ${
                              isFocused
                                ? 'border-2 border-[#E54826] bg-[#E54826]/15 z-20'
                                : slice.selected
                                ? 'border-[#E54826]/85 bg-[#E54826]/8 hover:bg-[#E54826]/16 z-10'
                                : 'border-dashed border-white/40 bg-black/25 opacity-60'
                            }`}
                          >
                            <span
                              className={`absolute left-0 top-0 px-1 py-0.5 font-mono text-[10px] leading-none tabular-nums ${
                                slice.selected
                                  ? 'bg-[#E54826] text-white'
                                  : 'bg-[#141619]/80 text-neutral-300'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </button>
                        );
                      })}

                      {/* Live Marquee Drawing Box */}
                      {drawingRect && (
                        <div
                          style={{
                            left: `${Math.min(drawingRect.startX, drawingRect.curX) * zoom}px`,
                            top: `${Math.min(drawingRect.startY, drawingRect.curY) * zoom}px`,
                            width: `${Math.abs(drawingRect.curX - drawingRect.startX) * zoom}px`,
                            height: `${Math.abs(drawingRect.curY - drawingRect.startY) * zoom}px`,
                          }}
                          className="absolute border-2 border-dashed border-[#E54826] bg-[#E54826]/20"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Contextual Hint Banner inside Mat */}
                {eyedropperActive && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-[#141619] px-3 py-1.5 text-xs font-medium text-white shadow-md">
                    Nhấn vào vùng màu nền trên ảnh để lấy mẫu khử nền
                  </div>
                )}
                {cutMode === 'manual' && !eyedropperActive && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-[#141619]/90 px-3 py-1.5 text-xs font-medium text-white shadow-md">
                    Kéo chuột trực tiếp trên ảnh để vẽ khung cắt tùy chỉnh
                  </div>
                )}
              </div>

              {/* Status / Focused Slice Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E2DC] bg-white px-4 py-2 text-xs text-[#52565E]">
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  {focusedSlice ? (
                    <>
                      <span className="font-semibold text-[#141619]">{focusedSlice.label}</span>
                      <span>
                        X:{focusedSlice.x} Y:{focusedSlice.y}
                      </span>
                      <span>
                        {focusedSlice.w} × {focusedSlice.h} px
                      </span>
                    </>
                  ) : (
                    <span>Kéo thả ảnh vào khung tối hoặc chọn khung cắt để xem tọa độ.</span>
                  )}
                </div>

                {statusMessage && (
                  <span className="font-medium text-[#E54826]">{statusMessage}</span>
                )}
              </div>
            </div>

            {/* Right Precision Control Panel (4 cols) */}
            <aside className="flex flex-col justify-between bg-[#F8F8F6] p-5 lg:col-span-4">
              <div className="space-y-6">
                {/* Mode-Specific Controls */}
                {cutMode === 'auto' && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#141619]">
                      Thông số tách khối tự động
                    </h3>
                    <p className="mt-1 text-xs text-[#52565E]">
                      Tự động quét các cụm điểm ảnh tách biệt và tạo khung cắt bao quanh từng sprite.
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="merge-gap" className="font-medium text-[#141619]">
                            Khoảng gộp chi tiết rời
                          </label>
                          <span className="font-mono text-[#52565E] tabular-nums">
                            {autoOptions.mergeGap} px
                          </span>
                        </div>
                        <input
                          id="merge-gap"
                          type="range"
                          min={2}
                          max={40}
                          value={autoOptions.mergeGap}
                          onChange={(e) =>
                            setAutoOptions((o) => ({ ...o, mergeGap: Number(e.target.value) }))
                          }
                          className="mt-1.5 w-full accent-[#E54826] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="min-size" className="font-medium text-[#141619]">
                            Loại bỏ nhiễu nhỏ hơn
                          </label>
                          <span className="font-mono text-[#52565E] tabular-nums">
                            {autoOptions.minSize} px
                          </span>
                        </div>
                        <input
                          id="min-size"
                          type="range"
                          min={8}
                          max={96}
                          step={2}
                          value={autoOptions.minSize}
                          onChange={(e) =>
                            setAutoOptions((o) => ({ ...o, minSize: Number(e.target.value) }))
                          }
                          className="mt-1.5 w-full accent-[#E54826] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="box-padding" className="font-medium text-[#141619]">
                            Lề an toàn quanh vật thể
                          </label>
                          <span className="font-mono text-[#52565E] tabular-nums">
                            {autoOptions.padding} px
                          </span>
                        </div>
                        <input
                          id="box-padding"
                          type="range"
                          min={0}
                          max={20}
                          value={autoOptions.padding}
                          onChange={(e) =>
                            setAutoOptions((o) => ({ ...o, padding: Number(e.target.value) }))
                          }
                          className="mt-1.5 w-full accent-[#E54826] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {cutMode === 'grid' && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#141619]">Thông số cắt lưới đều</h3>
                    <div className="mt-3 flex gap-1 rounded-lg bg-[#EAEAE4] p-1">
                      <button
                        type="button"
                        onClick={() => setGridOptions((g) => ({ ...g, mode: 'count' }))}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          gridOptions.mode === 'count'
                            ? 'bg-white text-[#141619] shadow-xs'
                            : 'text-[#52565E]'
                        }`}
                      >
                        Theo Cột × Hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridOptions((g) => ({ ...g, mode: 'size' }))}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          gridOptions.mode === 'size'
                            ? 'bg-white text-[#141619] shadow-xs'
                            : 'text-[#52565E]'
                        }`}
                      >
                        Theo Kích Thước (px)
                      </button>
                    </div>

                    {gridOptions.mode === 'count' ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block text-xs">
                          <span className="font-medium text-[#141619]">Số cột (Cols)</span>
                          <input
                            type="number"
                            min={1}
                            max={32}
                            value={gridOptions.cols}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                cols: Math.max(1, Number(e.target.value) || 1),
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-[#D4D4CC] bg-white px-3 py-1.5 font-mono text-sm text-[#141619] tabular-nums focus:border-[#E54826] focus:outline-none"
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="font-medium text-[#141619]">Số hàng (Rows)</span>
                          <input
                            type="number"
                            min={1}
                            max={32}
                            value={gridOptions.rows}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                rows: Math.max(1, Number(e.target.value) || 1),
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-[#D4D4CC] bg-white px-3 py-1.5 font-mono text-sm text-[#141619] tabular-nums focus:border-[#E54826] focus:outline-none"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block text-xs">
                          <span className="font-medium text-[#141619]">Rộng ô (px)</span>
                          <input
                            type="number"
                            min={8}
                            max={1024}
                            value={gridOptions.tileWidth}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                tileWidth: Math.max(4, Number(e.target.value) || 16),
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-[#D4D4CC] bg-white px-3 py-1.5 font-mono text-sm text-[#141619] tabular-nums focus:border-[#E54826] focus:outline-none"
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="font-medium text-[#141619]">Cao ô (px)</span>
                          <input
                            type="number"
                            min={8}
                            max={1024}
                            value={gridOptions.tileHeight}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                tileHeight: Math.max(4, Number(e.target.value) || 16),
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-[#D4D4CC] bg-white px-3 py-1.5 font-mono text-sm text-[#141619] tabular-nums focus:border-[#E54826] focus:outline-none"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="block text-xs">
                        <span className="font-medium text-[#52565E]">Lệch X / Y (px)</span>
                        <div className="mt-1 flex gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={gridOptions.offsetX}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                offsetX: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full rounded-lg border border-[#D4D4CC] bg-white px-2 py-1 font-mono text-xs tabular-nums"
                          />
                          <input
                            type="number"
                            min={0}
                            value={gridOptions.offsetY}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                offsetY: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full rounded-lg border border-[#D4D4CC] bg-white px-2 py-1 font-mono text-xs tabular-nums"
                          />
                        </div>
                      </label>

                      <label className="block text-xs">
                        <span className="font-medium text-[#52565E]">Khoảng hở X / Y</span>
                        <div className="mt-1 flex gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={gridOptions.spacingX}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                spacingX: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full rounded-lg border border-[#D4D4CC] bg-white px-2 py-1 font-mono text-xs tabular-nums"
                          />
                          <input
                            type="number"
                            min={0}
                            value={gridOptions.spacingY}
                            onChange={(e) =>
                              setGridOptions((g) => ({
                                ...g,
                                spacingY: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full rounded-lg border border-[#D4D4CC] bg-white px-2 py-1 font-mono text-xs tabular-nums"
                          />
                        </div>
                      </label>
                    </div>

                    <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#141619] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gridOptions.skipEmpty}
                        onChange={(e) =>
                          setGridOptions((g) => ({ ...g, skipEmpty: e.target.checked }))
                        }
                        className="h-4 w-4 rounded accent-[#E54826]"
                      />
                      <span>Tự động bỏ qua các ô trong suốt rỗng</span>
                    </label>
                  </div>
                )}

                {cutMode === 'manual' && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#141619]">Vẽ khung cắt thủ công</h3>
                    <p className="mt-1 text-xs text-[#52565E]">
                      Kéo chuột trên vùng ảnh bên trái để tạo từng vùng cắt riêng biệt.
                    </p>

                    <div className="mt-3">
                      <span className="block text-xs font-medium text-[#141619]">
                        Bắt dính bước lưới (Snap)
                      </span>
                      <div className="mt-1.5 flex gap-1.5">
                        {[1, 8, 16, 32].map((snap) => (
                          <button
                            key={snap}
                            type="button"
                            onClick={() => setManualSnap(snap)}
                            className={`flex-1 rounded-md border py-1 font-mono text-xs tabular-nums transition-colors cursor-pointer ${
                              manualSnap === snap
                                ? 'border-[#141619] bg-[#141619] text-white'
                                : 'border-[#D4D4CC] bg-white text-[#52565E]'
                            }`}
                          >
                            {snap}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {manualSlices.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#141619]">
                            Khung đã vẽ ({manualSlices.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setManualSlices([])}
                            className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                          >
                            Xóa tất cả
                          </button>
                        </div>
                        <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                          {manualSlices.map((box) => (
                            <div
                              key={box.id}
                              className="flex items-center justify-between rounded-md border border-[#E2E2DC] bg-white px-2.5 py-1.5 text-xs"
                            >
                              <span className="font-mono text-[#141619] tabular-nums">
                                {box.label} ({box.w}×{box.h})
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteManualSlice(box.id)}
                                aria-label={`Xóa ${box.label}`}
                                className="text-[#6B707A] hover:text-[#DC2626] cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <hr className="border-[#E2E2DC]" />

                {/* Chroma Background Cut */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#141619] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chroma.enabled}
                        onChange={(e) =>
                          setChroma((c) => ({ ...c, enabled: e.target.checked }))
                        }
                        className="h-4 w-4 rounded accent-[#E54826]"
                      />
                      <span>Khử nền trong suốt</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setEyedropperActive((a) => !a)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        eyedropperActive
                          ? 'border-[#E54826] bg-[#E54826] text-white'
                          : 'border-[#D4D4CC] bg-white text-[#141619] hover:bg-[#F0F0EC]'
                      }`}
                    >
                      <Pipette className="h-3 w-3" aria-hidden="true" />
                      <span>Chấm màu</span>
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-[#D4D4CC] bg-white px-2.5 py-1">
                      <input
                        type="color"
                        aria-label="Chọn màu nền cần xóa"
                        value={chroma.targetHex}
                        onChange={(e) =>
                          setChroma((c) => ({ ...c, enabled: true, targetHex: e.target.value }))
                        }
                        className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs uppercase text-[#141619]">
                        {chroma.targetHex}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] text-[#52565E]">
                        <span>Độ dung sai</span>
                        <span className="font-mono tabular-nums">{chroma.tolerance}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={100}
                        disabled={!chroma.enabled}
                        value={chroma.tolerance}
                        onChange={(e) =>
                          setChroma((c) => ({ ...c, tolerance: Number(e.target.value) }))
                        }
                        className="mt-1 w-full accent-[#E54826] cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                {/* Pixelate & Output Scale */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="pixel-size" className="font-semibold text-[#141619]">
                        Hiệu ứng Pixel hóa
                      </label>
                      <span className="font-mono text-[#52565E] tabular-nums">
                        {pixelSize === 1 ? 'Gốc (1 px)' : `${pixelSize} px`}
                      </span>
                    </div>
                    <input
                      id="pixel-size"
                      type="range"
                      min={1}
                      max={20}
                      value={pixelSize}
                      onChange={(e) => setPixelSize(Number(e.target.value))}
                      className="mt-1.5 w-full accent-[#E54826] cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#141619]">
                      Tỷ lệ xuất ảnh (Nearest-Neighbor)
                    </span>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {[1, 2, 4].map((scale) => (
                        <button
                          key={scale}
                          type="button"
                          onClick={() => setExportScale(scale)}
                          className={`rounded-md border py-1.5 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                            exportScale === scale
                              ? 'border-[#141619] bg-[#141619] text-white'
                              : 'border-[#D4D4CC] bg-white text-[#52565E] hover:text-[#141619]'
                          }`}
                        >
                          {scale}×
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Export Buttons */}
              <div className="mt-6 space-y-2 border-t border-[#E2E2DC] pt-5">
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  disabled={selectedCount === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E54826] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C93A1B] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="tabular-nums">Tải Tất Cả ({selectedCount} PNG + ZIP)</span>
                </button>
                <button
                  type="button"
                  onClick={downloadAtlasJson}
                  disabled={selectedCount === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4D4CC] bg-white px-4 py-2 text-xs font-semibold text-[#141619] transition-colors hover:bg-[#F0F0EC] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xuất Tọa Độ Atlas (.JSON)</span>
                </button>
              </div>
            </aside>
          </div>

          {/* Slice Output Gallery Strip */}
          <div className="border-t border-[#E2E2DC] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-base font-semibold text-[#141619]">
                  Kết quả mảnh đã cắt
                </h3>
                <span className="font-mono text-xs text-[#52565E] tabular-nums">
                  {selectedCount}/{slices.length} mảnh được chọn
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllSelected(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E2DC] bg-[#F8F8F6] px-2.5 py-1 text-xs font-medium text-[#141619] hover:bg-[#ECECE6] cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Chọn tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllSelected(false)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E2DC] bg-[#F8F8F6] px-2.5 py-1 text-xs font-medium text-[#52565E] hover:bg-[#ECECE6] cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bỏ chọn</span>
                </button>
              </div>
            </div>

            {previewItems.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#D4D4CC] bg-[#F8F8F6] py-10 text-center">
                <Eraser className="h-6 w-6 text-[#6B707A]" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-[#141619]">
                  Chưa có mảnh cắt nào được tạo
                </p>
                <p className="mt-1 max-w-md text-xs text-[#52565E]">
                  {cutMode === 'manual'
                    ? 'Hãy kéo chuột trên vùng ảnh tối phía trên để vẽ khung cắt đầu tiên.'
                    : 'Hãy điều chỉnh độ dung sai tách nền hoặc chuyển sang chế độ Cắt Lưới.'}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {previewItems.map(({ slice, dataUrl }) => {
                  const isFocused = focusedSliceId === slice.id;
                  return (
                    <div
                      key={slice.id}
                      className={`flex flex-col justify-between rounded-lg border p-2.5 transition-colors ${
                        isFocused
                          ? 'border-[#E54826] bg-[#E54826]/5'
                          : slice.selected
                          ? 'border-[#E2E2DC] bg-[#F8F8F6]'
                          : 'border-[#E2E2DC] bg-white opacity-55'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <label className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#141619] cursor-pointer truncate">
                          <input
                            type="checkbox"
                            checked={slice.selected}
                            onChange={() => toggleSliceSelection(slice.id)}
                            className="h-3.5 w-3.5 rounded accent-[#E54826]"
                          />
                          <span className="truncate">{slice.label}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => downloadSingleSlice(slice)}
                          title={`Tải ${slice.label}.png`}
                          aria-label={`Tải ${slice.label}.png`}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#D4D4CC] bg-white text-[#141619] hover:border-[#E54826] hover:text-[#E54826] cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFocusedSliceId(slice.id)}
                        className="flex h-24 w-full items-center justify-center overflow-hidden rounded border border-[#E2E2DC] checkerboard-light p-2 cursor-pointer"
                      >
                        <img
                          src={dataUrl}
                          alt={slice.label}
                          className="max-h-full max-w-full object-contain pixelated"
                        />
                      </button>

                      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#52565E] tabular-nums">
                        <span>
                          {slice.w * exportScale}×{slice.h * exportScale}
                        </span>
                        <span>
                          {slice.x},{slice.y}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {slices.length > 64 && (
              <p className="mt-3 text-xs text-[#52565E]">
                Đang hiển thị trước 64 mảnh đầu tiên. Tệp ZIP khi tải xuống sẽ bao gồm toàn bộ{' '}
                {selectedCount} mảnh đã chọn.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
