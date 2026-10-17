import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { SampleImage } from '../types/ocr';

interface DropzoneHeroProps {
  onImageSelected: (dataUrl: string, sourceName?: string) => void;
  onUrlFetch: (url: string) => Promise<void>;
  isLoading: boolean;
  selectedSample?: string;
  samples: SampleImage[];
}

export const DropzoneHero: React.FC<DropzoneHeroProps> = ({
  onImageSelected,
  onUrlFetch,
  isLoading,
  samples,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler (Ctrl+V anywhere on the page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't capture if focused in a text input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  onImageSelected(event.target.result as string, 'Pasted from Clipboard');
                }
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        }

        // Check if pasted text is an image URL
        const text = e.clipboardData.getData('text').trim();
        if (text.startsWith('http://') || text.startsWith('https://')) {
          setInputUrl(text);
          handleFetchUrl(text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageSelected]);

  // Handle Drag Over
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Handle Drop (Files, Image elements, or URLs)
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // 1. Check for files dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            onImageSelected(reader.result as string, file.name);
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 2. Check for dragged URLs or HTML image links from other browser tabs
    const droppedUrl =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') ||
      '';

    const urlMatch = droppedUrl.match(/https?:\/\/[^\s"']+/i);
    if (urlMatch) {
      const url = urlMatch[0];
      setInputUrl(url);
      await handleFetchUrl(url);
      return;
    }

    // 3. Check for HTML containing an image tag
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const imgMatch = html.match(/src=["'](https?:\/\/[^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        setInputUrl(imgMatch[1]);
        await handleFetchUrl(imgMatch[1]);
        return;
      }
    }
  };

  // Handle Manual URL submission
  const handleFetchUrl = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) return;

    setUrlError('');
    setIsFetchingUrl(true);
    try {
      await onUrlFetch(targetUrl);
    } catch (err: any) {
      setUrlError(err.message || 'Failed to fetch image from URL. Ensure the link points directly to an image.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <section id="dropzone" className="relative pt-8 pb-12 overflow-hidden">
      {/* Subtle manga background screentone */}
      <div className="absolute inset-0 manga-screentone-light opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Manga Title & Kicker */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-emerald-800 uppercase mb-2">
            <span>VOL. 01</span>
            <span aria-hidden="true">·</span>
            <span>PRECISION OCR ENGINE</span>
            <span aria-hidden="true">·</span>
            <span>HUGGINGFACE & VISION</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0E1A13] tracking-tight uppercase">
            Drop gere <span className="text-[#15803D] font-black italic">!</span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-[#254030] max-w-xl mx-auto font-medium">
            Drag & drop images, paste web links, or press{' '}
            <kbd className="px-2 py-0.5 font-mono text-xs font-semibold bg-emerald-100 border border-emerald-300 rounded text-emerald-950">
              Ctrl+V
            </kbd>{' '}
            for seamless Japanese and multilingual text extraction.
          </p>
        </div>

        {/* Central Manga Drop Frame */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer bg-white transition-all duration-200 border-2 ${
            isDragOver
              ? 'border-[#15803D] bg-emerald-50/60 shadow-[8px_8px_0px_#15803D] scale-[1.01]'
              : 'border-[#0E1A13] hover:border-[#15803D] shadow-[6px_6px_0px_#0E1A13] hover:shadow-[8px_8px_0px_#15803D]'
          } p-8 sm:p-12`}
        >
          {/* Manga Corner Brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#0E1A13]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#0E1A13]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#0E1A13]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#0E1A13]" />

          {/* Manga Onomatopoeia sound effect sticker */}
          <div className="absolute -top-4 -right-3 rotate-6 bg-[#15803D] text-white px-3 py-1 font-black text-xs sm:text-sm border-2 border-[#0E1A13] shadow-[2px_2px_0px_#0E1A13] pointer-events-none select-none">
            バンッ DROP!
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            {/* Manga drop icon badge */}
            <div className="w-16 h-16 mb-4 rounded-none bg-[#EDF3EC] border-2 border-[#0E1A13] flex items-center justify-center text-[#15803D] shadow-[3px_3px_0px_#0E1A13] group-hover:bg-[#15803D] group-hover:text-white transition-colors">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black text-[#0E1A13] tracking-tight">
                {isDragOver ? 'Release to Extract Text!' : '“ Drop gere ”'}
              </div>
              <p className="text-sm text-[#3E5C49] font-medium">
                Drop your image file, comic page, receipt, or drag links directly from any browser tab
              </p>
              <p className="text-xs font-mono text-[#587B66] pt-1">
                PNG, JPG, WEBP, SVG, TIFF up to 25MB · Clipboard paste active
              </p>
            </div>

            <button
              type="button"
              className="mt-6 px-6 py-2.5 text-xs sm:text-sm font-bold bg-[#0E1A13] text-white hover:bg-[#15803D] border-2 border-[#0E1A13] shadow-[3px_3px_0px_#15803D] transition-all cursor-pointer"
            >
              Browse Local Files
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                  if (reader.result) {
                    onImageSelected(reader.result as string, file.name);
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        {/* Drag & Drop Links Input Bar */}
        <div className="mt-6 bg-white border-2 border-[#0E1A13] p-4 shadow-[4px_4px_0px_#0E1A13]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchUrl();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#15803D] uppercase whitespace-nowrap shrink-0">
              <LinkIcon className="w-4 h-4" />
              <span>Paste Image Link:</span>
            </div>

            <div className="relative flex-1">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="https://example.com/manga-page.jpg or any image URL"
                className="w-full px-3 py-2 text-sm bg-[#F8FAF7] border-1.5 border-[#0E1A13] focus:border-[#15803D] focus:outline-none font-mono text-[#0E1A13] placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isFetchingUrl || !inputUrl.trim()}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 border-1.5 border-[#0E1A13] shadow-[2px_2px_0px_#0E1A13] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              {isFetchingUrl ? 'Fetching...' : 'Fetch & Scan'}
            </button>
          </form>

          {urlError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}
        </div>

        {/* Quick Sample Presets */}
        <div id="samples" className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#15803D]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-[#0E1A13]">
                Try With 1-Click Manga Samples
              </h2>
            </div>
            <span className="text-xs text-[#52735F] font-mono">Instant test</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samples.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onImageSelected(sample.src, sample.title)}
                className="group cursor-pointer bg-white border-2 border-[#0E1A13] p-3 shadow-[3px_3px_0px_#0E1A13] hover:shadow-[5px_5px_0px_#15803D] hover:border-[#15803D] transition-all flex gap-4 items-center"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F0F4EF] border border-[#0E1A13] overflow-hidden shrink-0 relative">
                  <img
                    src={sample.src}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-1 left-1 bg-[#15803D] text-white text-[10px] font-mono px-1">
                    SAMPLE
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#0E1A13] truncate group-hover:text-[#15803D]">
                    {sample.title}
                  </h3>
                  <p className="text-xs text-[#3E5C49] mt-0.5 line-clamp-2">
                    {sample.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#15803D] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Click to extract</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
