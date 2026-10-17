import React from 'react';

interface MangaHeaderProps {
  onNewScan: () => void;
  onSelectSample: () => void;
}

export const MangaHeader: React.FC<MangaHeaderProps> = ({ onNewScan, onSelectSample }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F8FAF7]/95 backdrop-blur-sm border-b-2 border-[#0E1A13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 bg-[#15803D] border-2 border-[#0E1A13] flex items-center justify-center text-white font-black text-sm shadow-[2px_2px_0px_#0E1A13]">
            画
          </div>
          <a href="#" className="text-lg sm:text-xl font-black tracking-tight text-[#0E1A13] hover:text-[#15803D] transition-colors">
            Drop gere <span className="text-xs font-mono font-medium text-emerald-800 ml-1">OCR · 文字認識</span>
          </a>
        </div>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1A2E22]">
          <a href="#dropzone" className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0">
            Drop Canvas
          </a>
          <button
            onClick={onSelectSample}
            className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Manga Samples
          </button>
          <a href="#engines" className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0">
            Hugging Face Engine
          </a>
          <a href="#features" className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0">
            Speech & Script
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewScan}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#15803D] hover:bg-[#166534] border-2 border-[#0E1A13] shadow-[2px_2px_0px_#0E1A13] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            + New Scan
          </button>
        </div>
      </div>
    </header>
  );
};
