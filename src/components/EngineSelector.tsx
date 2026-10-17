import React, { useState } from 'react';
import { Cpu, ExternalLink, Key, Settings, HelpCircle, CheckCircle2 } from 'lucide-react';

export type EngineType = 'huggingface' | 'gemini' | 'tesseract';

interface EngineSelectorProps {
  currentEngine: EngineType;
  onEngineChange: (engine: EngineType) => void;
  hfModel: string;
  onHfModelChange: (model: string) => void;
  hfToken: string;
  onHfTokenChange: (token: string) => void;
  targetLang: string;
  onTargetLangChange: (lang: string) => void;
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  currentEngine,
  onEngineChange,
  hfModel,
  onHfModelChange,
  hfToken,
  onHfTokenChange,
  targetLang,
  onTargetLangChange,
}) => {
  const [showHfSettings, setShowHfSettings] = useState(false);

  return (
    <div id="engines" className="bg-white border-2 border-[#0E1A13] shadow-[4px_4px_0px_#0E1A13] p-5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAE3]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#15803D]" />
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-[#0E1A13]">
              OCR Engine Provider
            </h2>
            <p className="text-xs text-[#4A6B56]">
              Engine requested: Hugging Face <code className="font-mono bg-emerald-50 px-1 text-emerald-900 border border-emerald-200">SeerRay-Lab/Xiaomi-OCR-0</code>
            </p>
          </div>
        </div>

        {/* Translation Target Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="target-lang" className="font-bold text-[#0E1A13] whitespace-nowrap">
            Auto-Translate:
          </label>
          <select
            id="target-lang"
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value)}
            className="bg-[#F8FAF7] border-1.5 border-[#0E1A13] px-2.5 py-1 text-xs font-mono text-[#0E1A13] focus:border-[#15803D] focus:outline-none"
          >
            <option value="English">English (EN)</option>
            <option value="Japanese">Japanese (JA)</option>
            <option value="Spanish">Spanish (ES)</option>
            <option value="French">French (FR)</option>
            <option value="German">German (DE)</option>
            <option value="Chinese">Chinese (ZH)</option>
            <option value="">No Translation (OCR Only)</option>
          </select>
        </div>
      </div>

      {/* Engine Selection Tabs (Functional Buttons / Segmented Controls) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {/* Hugging Face Option */}
        <button
          type="button"
          onClick={() => onEngineChange('huggingface')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'huggingface'
              ? 'border-[#15803D] bg-emerald-50/70 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Hugging Face API
            </span>
            {currentEngine === 'huggingface' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13] truncate">
            {hfModel.split('/')[1] || hfModel}
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            Target model: {hfModel}. Connects directly via Hugging Face inference pipeline.
          </p>
        </button>

        {/* Gemini Vision Ultra Option */}
        <button
          type="button"
          onClick={() => onEngineChange('gemini')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'gemini'
              ? 'border-[#15803D] bg-emerald-50/70 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              AI Vision Pipeline
            </span>
            {currentEngine === 'gemini' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13]">
            Gemini 3.8 Flash Vision
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            Ultra-fast precision OCR with speech bubble breakdown & layout detection.
          </p>
        </button>

        {/* Tesseract Client Local Option */}
        <button
          type="button"
          onClick={() => onEngineChange('tesseract')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'tesseract'
              ? 'border-[#15803D] bg-emerald-50/70 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Local In-Browser
            </span>
            {currentEngine === 'tesseract' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13]">
            Tesseract.js Engine
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            100% offline client-side optical character recognition in browser.
          </p>
        </button>
      </div>

      {/* Hugging Face Advanced Drawer / Links */}
      <div className="mt-4 pt-3 border-t border-[#E5EAE3] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <a
            href="https://huggingface.co/SeerRay-Lab/Xiaomi-OCR-0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-emerald-900 hover:text-emerald-700 underline font-semibold"
          >
            <span>Model Card: SeerRay-Lab/Xiaomi-OCR-0</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setShowHfSettings(!showHfSettings)}
            className="inline-flex items-center gap-1 text-[#0E1A13] hover:text-[#15803D] font-bold cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showHfSettings ? 'Hide HF Settings' : 'Configure HF Model & Token'}</span>
          </button>
        </div>

        <div className="text-[#5B7E6B] font-mono">
          Auto-fallback active for cold starts
        </div>
      </div>

      {/* Expandable HF Model & Token settings */}
      {showHfSettings && (
        <div className="mt-3 p-3.5 bg-[#F8FAF7] border border-[#0E1A13] space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#0E1A13] mb-1">
              Hugging Face Model Repo ID:
            </label>
            <input
              type="text"
              value={hfModel}
              onChange={(e) => onHfModelChange(e.target.value)}
              placeholder="e.g. SeerRay-Lab/Xiaomi-OCR-0 or microsoft/trocr-base-stage1"
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#0E1A13] focus:border-[#15803D] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#0E1A13] flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Optional Hugging Face User Access Token (hf_...):</span>
              </label>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-800 underline hover:text-emerald-950 font-mono"
              >
                Get Free HF Token
              </a>
            </div>
            <input
              type="password"
              value={hfToken}
              onChange={(e) => onHfTokenChange(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxx (Optional, increases Hugging Face rate limits)"
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#0E1A13] focus:border-[#15803D] focus:outline-none"
            />
            <p className="text-[11px] text-[#5B7E6B] mt-1">
              Your token is only passed to the Hugging Face Inference API and is never stored permanently.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
