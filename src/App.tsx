import React, { useState, useEffect } from 'react';
import { MangaHeader } from './components/MangaHeader';
import { DropzoneHero } from './components/DropzoneHero';
import { EngineSelector, EngineType } from './components/EngineSelector';
import { ImageInspector } from './components/ImageInspector';
import { ExtractionResultPanel } from './components/ExtractionResultPanel';
import { OCRResult, SampleImage, ImageFilterMode } from './types/ocr';
import { runTesseractOCR } from './utils/tesseractOcr';
import sampleMangaImage from './assets/images/manga_panel_sample_one_1792176612226.jpg';
import sampleReceiptImage from './assets/images/manga_cafe_receipt_1792176704175.jpg';

const SAMPLES: SampleImage[] = [
  {
    id: 'manga-forest',
    title: 'Manga Dialogue Panel',
    subtitle: 'Japanese & English Speech Bubble',
    src: sampleMangaImage,
    description: 'Features Japanese kanji, hiragana, and English dialogue inside a classic screentone manga panel.',
  },
  {
    id: 'tokyo-receipt',
    title: 'Tokyo Kissa Cafe Receipt',
    subtitle: 'Printed Tabular Text & Stamp',
    src: sampleReceiptImage,
    description: 'Clean monochrome Japanese cafe slip with items, prices, dates, kanji, and green ink stamp mark.',
  },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string>(sampleMangaImage);
  const [sourceName, setSourceName] = useState<string>('Forest Manga Panel (Sample)');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Engine state
  const [currentEngine, setCurrentEngine] = useState<EngineType>('huggingface');
  const [hfModel, setHfModel] = useState<string>('SeerRay-Lab/Xiaomi-OCR-0');
  const [hfToken, setHfToken] = useState<string>('');
  const [dockerEndpoint, setDockerEndpoint] = useState<string>('http://localhost:8000');
  const [targetLang, setTargetLang] = useState<string>('English');

  // Inspector & filter state
  const [filterMode, setFilterMode] = useState<ImageFilterMode>('normal');
  const [rotation, setRotation] = useState<number>(0);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  // Execute OCR Pipeline
  const runOCR = async (imageSource: string, engine = currentEngine) => {
    setIsLoading(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      if (engine === 'tesseract') {
        // Run In-Browser Client OCR
        const result = await runTesseractOCR(imageSource);
        const duration = Math.round(performance.now() - startTime);

        setOcrResult({
          fullText: result.fullText,
          lines: result.lines,
          language: 'Auto (Client-Side)',
          provider: 'tesseract',
          model: 'Tesseract.js In-Browser',
          processingTimeMs: duration,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        // Convert image path to base64 if it's an asset URL
        let base64Payload = imageSource;
        if (!imageSource.startsWith('data:')) {
          const res = await fetch(imageSource);
          const blob = await res.blob();
          base64Payload = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Payload,
            provider: engine,
            hfModel,
            hfToken,
            dockerEndpoint,
            targetLang,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server error occurred during OCR extraction.');
        }

        const data = await response.json();
        const duration = Math.round(performance.now() - startTime);

        setOcrResult({
          fullText: data.fullText,
          lines: data.lines || [],
          language: data.language || 'Detected',
          translation: data.translation,
          provider: data.provider,
          model: data.model || hfModel,
          dockerEndpoint: data.dockerEndpoint,
          hfNote: data.hfNote,
          processingTimeMs: duration,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      console.error('OCR Extraction Error:', err);
      setErrorMessage(err.message || 'An error occurred while recognizing characters.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial extraction on load with the sample image
  useEffect(() => {
    runOCR(sampleMangaImage, 'huggingface');
  }, []);

  // When image is selected or dropped
  const handleImageSelected = (dataUrl: string, name?: string) => {
    setSelectedImage(dataUrl);
    setSourceName(name || 'Uploaded Image');
    setFilterMode('normal');
    setRotation(0);
    runOCR(dataUrl);

    // Scroll to results if not visible
    const resultsEl = document.getElementById('results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // When URL is submitted
  const handleUrlFetch = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to fetch image from URL.');
      }

      const data = await res.json();
      handleImageSelected(data.dataUrl, url);
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0E1A13] flex flex-col font-manga selection:bg-emerald-200">
      {/* Top Bar Contract (Wordmark - 4 Nav Links - 1 Action) */}
      <MangaHeader
        onNewScan={() => {
          document.getElementById('dropzone')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectSample={() => {
          document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main className="flex-1">
        {/* Drop gere Hero Section */}
        <DropzoneHero
          onImageSelected={handleImageSelected}
          onUrlFetch={handleUrlFetch}
          isLoading={isLoading}
          samples={SAMPLES}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Engine Selector */}
          <EngineSelector
            currentEngine={currentEngine}
            onEngineChange={(newEngine) => {
              setCurrentEngine(newEngine);
              if (selectedImage) {
                runOCR(selectedImage, newEngine);
              }
            }}
            hfModel={hfModel}
            onHfModelChange={setHfModel}
            hfToken={hfToken}
            onHfTokenChange={setHfToken}
            dockerEndpoint={dockerEndpoint}
            onDockerEndpointChange={setDockerEndpoint}
            targetLang={targetLang}
            onTargetLangChange={(lang) => {
              setTargetLang(lang);
              if (selectedImage) {
                runOCR(selectedImage, currentEngine);
              }
            }}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-700 text-red-900 text-sm shadow-[3px_3px_0px_#991B1B]">
              <div className="font-bold flex items-center justify-between">
                <span>Recognition Notice</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-xs uppercase font-mono underline hover:text-red-950 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-1 text-xs">{errorMessage}</p>
            </div>
          )}

          {/* 2-Column Split: Image Inspector & OCR Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Image Canvas & Tools */}
            <div className="h-full">
              <ImageInspector
                imageSrc={selectedImage}
                sourceName={sourceName}
                lines={ocrResult?.lines || []}
                hoveredLineIndex={hoveredLineIndex}
                onHoverLine={setHoveredLineIndex}
                filterMode={filterMode}
                onFilterChange={setFilterMode}
                rotation={rotation}
                onRotate={() => setRotation((r) => (r + 90) % 360)}
                onRescan={() => runOCR(selectedImage)}
                isLoading={isLoading}
              />
            </div>

            {/* Right Column: Extracted Text & Manga Script */}
            <div className="h-full">
              <ExtractionResultPanel
                result={ocrResult}
                isLoading={isLoading}
                hoveredLineIndex={hoveredLineIndex}
                onHoverLine={setHoveredLineIndex}
                targetLang={targetLang}
              />
            </div>
          </div>

          {/* Manga Craft Details Section */}
          <div id="features" className="mt-16 pt-8 border-t-2 border-[#0E1A13]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white border-2 border-[#0E1A13] shadow-[3px_3px_0px_#0E1A13]">
                <h2 className="text-sm font-black uppercase text-[#0E1A13] mb-1">
                  01. Docker & Bun Architecture
                </h2>
                <p className="text-xs text-[#3E5C49] leading-relaxed">
                  Fully containerized using Bun <code className="font-mono bg-emerald-50 px-1 border border-emerald-200">Dockerfile</code>, <code className="font-mono bg-emerald-50 px-1 border border-emerald-200">docker-compose.yml</code>, and clean <code className="font-mono bg-emerald-50 px-1 border border-emerald-200">Makefile</code> targets.
                </p>
              </div>

              <div className="p-4 bg-white border-2 border-[#0E1A13] shadow-[3px_3px_0px_#0E1A13]">
                <h2 className="text-sm font-black uppercase text-[#0E1A13] mb-1">
                  02. Xiaomi-OCR-0 Inference
                </h2>
                <p className="text-xs text-[#3E5C49] leading-relaxed">
                  Call local/containerized endpoints via OpenAI Vision protocol or Hugging Face Cloud Inference with automated zero-failure fallback.
                </p>
              </div>

              <div className="p-4 bg-white border-2 border-[#0E1A13] shadow-[3px_3px_0px_#0E1A13]">
                <h2 className="text-sm font-black uppercase text-[#0E1A13] mb-1">
                  03. Tactile Manga Workspace
                </h2>
                <p className="text-xs text-[#3E5C49] leading-relaxed">
                  Drop images, drag web links, paste with <kbd className="font-mono text-[11px] bg-slate-100 px-1 border border-slate-300">Ctrl+V</kbd>, inspect bounding boxes, and export to TXT, MD, or JSON.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean quiet footer */}
      <footer className="bg-white border-t-2 border-[#0E1A13] py-6 text-xs text-[#4A6B56]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0E1A13]">Drop gere OCR</span>
            <span aria-hidden="true">·</span>
            <span>Minimalistic Green Manga Style</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Powered by Bun, Docker & Hugging Face</span>
            <span aria-hidden="true">·</span>
            <span>2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
