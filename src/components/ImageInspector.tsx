import React, { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { OCRLine, ImageFilterMode } from '../types/ocr';

interface ImageInspectorProps {
  imageSrc: string;
  sourceName?: string;
  lines: OCRLine[];
  hoveredLineIndex: number | null;
  onHoverLine: (index: number | null) => void;
  filterMode: ImageFilterMode;
  onFilterChange: (mode: ImageFilterMode) => void;
  rotation: number;
  onRotate: () => void;
  onRescan: () => void;
  isLoading: boolean;
}

export const ImageInspector: React.FC<ImageInspectorProps> = ({
  imageSrc,
  sourceName,
  lines,
  hoveredLineIndex,
  onHoverLine,
  filterMode,
  onFilterChange,
  rotation,
  onRotate,
  onRescan,
  isLoading,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Compute filter class for quick visual preview
  const getFilterStyle = () => {
    switch (filterMode) {
      case 'manga-contrast':
        return 'contrast-200 grayscale brightness-110';
      case 'invert':
        return 'invert hue-rotate-180';
      case 'grayscale':
        return 'grayscale';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white border-2 border-[#0E1A13] shadow-[4px_4px_0px_#0E1A13] flex flex-col h-full">
      {/* Header Bar */}
      <div className="p-3 bg-[#F8FAF7] border-b-2 border-[#0E1A13] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 bg-[#15803D]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0E1A13] truncate">
            {sourceName || 'Current Manga Scan'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
            title="Zoom Out"
            className="p-1.5 bg-white border border-[#0E1A13] hover:bg-emerald-50 text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Indicator */}
          <span className="font-mono text-[11px] text-[#4A6B56] px-1">
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            title="Zoom In"
            className="p-1.5 bg-white border border-[#0E1A13] hover:bg-emerald-50 text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Rotate 90 deg */}
          <button
            type="button"
            onClick={onRotate}
            title="Rotate 90° Clockwise"
            className="p-1.5 bg-white border border-[#0E1A13] hover:bg-emerald-50 text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer ml-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Bounding Boxes */}
          <button
            type="button"
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            title="Toggle OCR text highlights on image"
            className={`px-2 py-1 border border-[#0E1A13] text-[11px] font-bold shadow-[1px_1px_0px_#0E1A13] cursor-pointer ml-1 ${
              showBoundingBoxes
                ? 'bg-[#15803D] text-white'
                : 'bg-white text-[#0E1A13] hover:bg-emerald-50'
            }`}
          >
            Boxes
          </button>

          {/* Rescan Button */}
          <button
            type="button"
            onClick={onRescan}
            disabled={isLoading}
            title="Re-run OCR extraction"
            className="px-2.5 py-1 bg-[#0E1A13] text-white hover:bg-[#15803D] disabled:opacity-50 border border-[#0E1A13] text-[11px] font-bold shadow-[1px_1px_0px_#15803D] cursor-pointer flex items-center gap-1 ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {/* Filter Presets Toolbar */}
      <div className="px-3 py-1.5 bg-[#FAFBF9] border-b border-[#E5EAE3] flex items-center gap-2 text-xs overflow-x-auto">
        <span className="text-[11px] font-mono text-[#587B66] uppercase whitespace-nowrap">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => onFilterChange('normal')}
          className={`px-2 py-0.5 text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
            filterMode === 'normal'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#0E1A13] border-slate-300 hover:border-[#15803D]'
          }`}
        >
          Original
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('manga-contrast')}
          className={`px-2 py-0.5 text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
            filterMode === 'manga-contrast'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#0E1A13] border-slate-300 hover:border-[#15803D]'
          }`}
        >
          Manga Ink Binarize
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('grayscale')}
          className={`px-2 py-0.5 text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
            filterMode === 'grayscale'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#0E1A13] border-slate-300 hover:border-[#15803D]'
          }`}
        >
          Grayscale
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('invert')}
          className={`px-2 py-0.5 text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
            filterMode === 'invert'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#0E1A13] border-slate-300 hover:border-[#15803D]'
          }`}
        >
          Inverted (Night Mode)
        </button>
      </div>

      {/* Canvas / Viewport Area */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-[#0E1A13]/5 overflow-auto flex items-center justify-center p-4">
        {/* Manga Screentone background pattern behind image */}
        <div className="absolute inset-0 manga-screentone-light opacity-30 pointer-events-none" />

        <div
          className="relative transition-transform duration-150 inline-block"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Main Scanned Image */}
          <img
            src={imageSrc}
            alt="Scanned Document or Manga Panel"
            referrerPolicy="no-referrer"
            className={`max-w-full max-h-[600px] object-contain border-2 border-[#0E1A13] shadow-[4px_4px_0px_#0E1A13] transition-all ${getFilterStyle()}`}
          />

          {/* Interactive Bounding Boxes Overlay */}
          {showBoundingBoxes &&
            lines.map((line, idx) => {
              if (!line.box) return null;
              const [ymin, xmin, ymax, xmax] = line.box;
              const top = `${ymin / 10}%`;
              const left = `${xmin / 10}%`;
              const height = `${(ymax - ymin) / 10}%`;
              const width = `${(xmax - xmin) / 10}%`;
              const isHovered = hoveredLineIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => onHoverLine(idx)}
                  onMouseLeave={() => onHoverLine(null)}
                  style={{ top, left, width, height }}
                  className={`absolute cursor-pointer transition-all ${
                    isHovered
                      ? 'border-2 border-[#15803D] bg-emerald-500/30 z-20 shadow-[0_0_8px_rgba(21,128,61,0.8)]'
                      : 'border border-emerald-600/70 bg-emerald-500/10 hover:border-emerald-600 hover:bg-emerald-500/20 z-10'
                  }`}
                  title={line.text}
                >
                  <span
                    className={`absolute -top-3.5 left-0 px-1 text-[9px] font-mono font-bold leading-none select-none ${
                      isHovered
                        ? 'bg-[#15803D] text-white'
                        : 'bg-black/70 text-emerald-300'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
