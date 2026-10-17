import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Search,
  Languages,
  Sparkles,
  ArrowRight,
  Code,
  ListOrdered,
  AlignLeft,
} from 'lucide-react';
import { OCRResult, OCRLine } from '../types/ocr';
import { speakText, downloadFile } from '../utils/imageUtils';

interface ExtractionResultPanelProps {
  result: OCRResult | null;
  isLoading: boolean;
  hoveredLineIndex: number | null;
  onHoverLine: (index: number | null) => void;
  targetLang: string;
}

export const ExtractionResultPanel: React.FC<ExtractionResultPanelProps> = ({
  result,
  isLoading,
  hoveredLineIndex,
  onHoverLine,
  targetLang,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'script' | 'translation' | 'json'>('text');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechInstance, setSpeechInstance] = useState<{ stop: () => void } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [formatCase, setFormatCase] = useState<'normal' | 'upper' | 'lower' | 'compact'>('normal');

  // Handle Copy
  const handleCopy = () => {
    if (!result?.fullText) return;
    let textToCopy = result.fullText;
    if (activeTab === 'translation' && result.translation) {
      textToCopy = result.translation;
    } else if (activeTab === 'json') {
      textToCopy = JSON.stringify(result, null, 2);
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Text-to-Speech
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechInstance?.stop();
      setIsSpeaking(false);
      setSpeechInstance(null);
    } else {
      const textToRead =
        activeTab === 'translation' && result?.translation
          ? result.translation
          : result?.fullText;
      if (!textToRead) return;

      const lang = result?.language?.toLowerCase().includes('japan')
        ? 'ja-JP'
        : 'en-US';
      const inst = speakText(textToRead, lang);
      setSpeechInstance(inst);
      setIsSpeaking(true);

      // Auto reset after rough estimate
      const durationMs = Math.min(30000, Math.max(3000, textToRead.length * 75));
      setTimeout(() => {
        setIsSpeaking(false);
      }, durationMs);
    }
  };

  // Handle Downloads
  const handleDownloadTxt = () => {
    if (!result?.fullText) return;
    downloadFile(result.fullText, `manga-ocr-${Date.now()}.txt`);
  };

  const handleDownloadMd = () => {
    if (!result?.fullText) return;
    const md = `# Manga OCR Extraction Result\n\n- **Engine**: ${result.model}\n- **Language**: ${result.language}\n- **Timestamp**: ${result.timestamp}\n\n## Extracted Text\n\n${result.fullText}\n\n${result.translation ? `## Translation\n\n${result.translation}\n` : ''}`;
    downloadFile(md, `manga-ocr-${Date.now()}.md`, 'text/markdown');
  };

  const handleDownloadJson = () => {
    if (!result) return;
    downloadFile(JSON.stringify(result, null, 2), `manga-ocr-${Date.now()}.json`, 'application/json');
  };

  // Get transformed text based on formatCase
  const getProcessedText = () => {
    if (!result?.fullText) return '';
    let text = result.fullText;
    if (formatCase === 'upper') text = text.toUpperCase();
    if (formatCase === 'lower') text = text.toLowerCase();
    if (formatCase === 'compact') {
      text = text.replace(/\n\s*\n/g, '\n').trim();
    }
    return text;
  };

  // Highlight search in text
  const renderTextContent = () => {
    const text = getProcessedText();
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <div className="font-mono-code text-sm leading-relaxed text-[#0E1A13] space-y-1">
        {lines.map((line, idx) => {
          const isMatch =
            searchQuery.trim() &&
            line.toLowerCase().includes(searchQuery.toLowerCase());

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 py-0.5 px-2 -mx-2 transition-colors ${
                isMatch ? 'bg-amber-100 font-bold' : 'hover:bg-emerald-50/60'
              }`}
            >
              {showLineNumbers && (
                <span className="text-[#6C8F79] select-none text-xs font-mono w-6 text-right shrink-0 pt-0.5">
                  {idx + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre-wrap break-words">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="results" className="bg-white border-2 border-[#0E1A13] shadow-[4px_4px_0px_#0E1A13] flex flex-col h-full">
      {/* Top Bar with Tabs (Segmented Button Controls) */}
      <div className="p-3 bg-[#F8FAF7] border-b-2 border-[#0E1A13] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#EDF3EC] border border-[#0E1A13]">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13]'
                : 'text-[#4A6B56] hover:text-[#0E1A13]'
            }`}
          >
            Clean Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'script'
                ? 'bg-white text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13]'
                : 'text-[#4A6B56] hover:text-[#0E1A13]'
            }`}
          >
            Manga Script ({result?.lines?.length || 0})
          </button>
          {result?.translation && (
            <button
              type="button"
              onClick={() => setActiveTab('translation')}
              className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'translation'
                  ? 'bg-white text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13]'
                  : 'text-[#4A6B56] hover:text-[#0E1A13]'
              }`}
            >
              Translation
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'bg-white text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13]'
                : 'text-[#4A6B56] hover:text-[#0E1A13]'
            }`}
          >
            JSON
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* TTS Readout */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            disabled={!result?.fullText}
            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
            className="p-1.5 bg-white border border-[#0E1A13] hover:bg-emerald-50 text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result?.fullText}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-[#0E1A13] text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#15803D]" />
                <span className="text-[#15803D]">カチャ！ Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={!result?.fullText}
              title="Download as .txt"
              className="px-2 py-1 bg-white hover:bg-emerald-50 border border-[#0E1A13] text-[11px] font-mono text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer"
            >
              .TXT
            </button>
            <button
              type="button"
              onClick={handleDownloadMd}
              disabled={!result?.fullText}
              title="Download Markdown"
              className="px-2 py-1 bg-white hover:bg-emerald-50 border border-[#0E1A13] text-[11px] font-mono text-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] cursor-pointer"
            >
              .MD
            </button>
          </div>
        </div>
      </div>

      {/* Sub-toolbar: Search & Formatting toggles */}
      <div className="px-3 py-1.5 bg-[#FAFBF9] border-b border-[#E5EAE3] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Search Input */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#6C8F79] absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extracted text..."
            className="w-full pl-7 pr-2 py-0.5 text-xs bg-white border border-[#CBD7CE] focus:border-[#15803D] focus:outline-none font-mono"
          />
        </div>

        {/* Text Modifiers */}
        <div className="flex items-center gap-1 text-[11px] text-[#4A6B56]">
          <button
            type="button"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`px-1.5 py-0.5 border cursor-pointer ${
              showLineNumbers ? 'border-[#15803D] bg-emerald-50 text-[#15803D]' : 'border-transparent text-slate-500'
            }`}
          >
            # lines
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setFormatCase(formatCase === 'upper' ? 'normal' : 'upper')}
            className={`px-1.5 py-0.5 border cursor-pointer ${
              formatCase === 'upper' ? 'border-[#15803D] bg-emerald-50 text-[#15803D]' : 'border-transparent text-slate-500'
            }`}
          >
            AA
          </button>
          <button
            type="button"
            onClick={() => setFormatCase(formatCase === 'compact' ? 'normal' : 'compact')}
            className={`px-1.5 py-0.5 border cursor-pointer ${
              formatCase === 'compact' ? 'border-[#15803D] bg-emerald-50 text-[#15803D]' : 'border-transparent text-slate-500'
            }`}
          >
            Unwrap
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-auto min-h-[360px] bg-white">
        {isLoading ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 border-3 border-[#15803D] border-t-transparent animate-spin rounded-none" />
            <div className="text-base font-black text-[#0E1A13] tracking-tight">
              Extracting Text with High Precision...
            </div>
            <p className="text-xs text-[#4A6B56] max-w-sm font-mono">
              Running optical character recognition, analyzing speech bubbles, kanji characters, and line geometry.
            </p>
          </div>
        ) : !result ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-[#5B7E6B]">
            <AlignLeft className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 text-[#15803D]" />
            <div className="text-base font-bold text-[#0E1A13]">
              No Image Processed Yet
            </div>
            <p className="text-xs mt-1 max-w-xs">
              Drop an image in the "Drop gere" canvas or click one of the manga samples above to begin.
            </p>
          </div>
        ) : (
          <div>
            {/* View 1: Clean Raw Text */}
            {activeTab === 'text' && renderTextContent()}

            {/* View 2: Manga Script / Lines Breakdown */}
            {activeTab === 'script' && (
              <div className="space-y-2">
                <div className="text-xs text-[#5B7E6B] font-mono pb-2 border-b border-[#E5EAE3]">
                  Hover over any dialogue item below to highlight its exact location on the manga panel.
                </div>
                {result.lines.map((line, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => onHoverLine(idx)}
                    onMouseLeave={() => onHoverLine(null)}
                    className={`p-2.5 border-1.5 transition-all cursor-pointer ${
                      hoveredLineIndex === idx
                        ? 'border-[#15803D] bg-emerald-50/80 shadow-[2px_2px_0px_#15803D]'
                        : 'border-[#CBD7CE] hover:border-[#15803D] bg-[#FDFEFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5B7E6B] mb-1">
                      <span className="font-bold text-[#15803D]">
                        Speech Bubble #{idx + 1}
                      </span>
                      {line.type && (
                        <span className="uppercase text-[10px]">{line.type}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[#0E1A13] whitespace-pre-wrap">
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View 3: Translation */}
            {activeTab === 'translation' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 font-bold">
                  <Languages className="w-4 h-4" />
                  <span>Auto Translation · {targetLang || 'English'}</span>
                </div>
                <div className="p-4 bg-[#F8FAF7] border-1.5 border-[#0E1A13] font-manga text-sm sm:text-base leading-relaxed text-[#0E1A13] whitespace-pre-wrap">
                  {result.translation || 'No translation generated for this scan.'}
                </div>
              </div>
            )}

            {/* View 4: JSON Raw Output */}
            {activeTab === 'json' && (
              <pre className="p-3 bg-[#0E1A13] text-[#A7F3D0] text-xs font-mono overflow-auto max-h-[460px] leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer Metadata (Zero-Pill Discipline: unboxed text with · separators) */}
      {result && (
        <div className="p-3 bg-[#F8FAF7] border-t-2 border-[#0E1A13] text-xs text-[#3E5C49] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Model: {result.model}</span>
            <span aria-hidden="true">·</span>
            <span>Language: {result.language}</span>
            <span aria-hidden="true">·</span>
            <span>Lines: {result.lines.length}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{result.processingTimeMs}ms</span>
          </div>

          {result.hfNote && (
            <div className="text-[11px] text-[#15803D] font-mono">
              {result.hfNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
