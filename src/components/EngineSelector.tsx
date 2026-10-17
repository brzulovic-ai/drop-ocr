import React, { useState } from 'react';
import { Cpu, ExternalLink, Key, Settings, CheckCircle2, Box, Terminal, RefreshCw, Copy, Check } from 'lucide-react';

export type EngineType = 'docker' | 'huggingface' | 'gemini' | 'tesseract';

interface EngineSelectorProps {
  currentEngine: EngineType;
  onEngineChange: (engine: EngineType) => void;
  hfModel: string;
  onHfModelChange: (model: string) => void;
  hfToken: string;
  onHfTokenChange: (token: string) => void;
  dockerEndpoint: string;
  onDockerEndpointChange: (endpoint: string) => void;
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
  dockerEndpoint,
  onDockerEndpointChange,
  targetLang,
  onTargetLangChange,
}) => {
  const [showHfSettings, setShowHfSettings] = useState(false);
  const [showDockerModal, setShowDockerModal] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ available?: boolean; status?: string; latencyMs?: number; message?: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Ping Docker container health check
  const handlePingDocker = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/docker-health?endpoint=${encodeURIComponent(dockerEndpoint)}`);
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({ available: false, status: 'offline', message: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  const handleCopyCmd = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

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
              Engine requested: Hugging Face <code className="font-mono bg-emerald-50 px-1 text-emerald-900 border border-emerald-200">{hfModel}</code>
            </p>
          </div>
        </div>

        {/* Translation Target Selector & Docker Quick Action */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowDockerModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-[#0E1A13] text-white hover:bg-[#15803D] border border-[#0E1A13] shadow-[2px_2px_0px_#15803D] cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Docker & Makefile Guide</span>
          </button>

          <div className="flex items-center gap-1.5">
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
      </div>

      {/* Engine Selection Tabs (4 Functional Buttons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* 1. Docker Inference Container (hf.co/SeerRay-Lab/Xiaomi-OCR-0) */}
        <button
          type="button"
          onClick={() => onEngineChange('docker')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'docker'
              ? 'border-[#15803D] bg-emerald-50/80 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Box className="w-3 h-3 text-[#15803D]" />
              Docker Container
            </span>
            {currentEngine === 'docker' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13] truncate">
            Xiaomi-OCR-0 Docker
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            Local/hosted Hugging Face container (`{dockerEndpoint}`).
          </p>
        </button>

        {/* 2. Hugging Face Cloud Inference */}
        <button
          type="button"
          onClick={() => onEngineChange('huggingface')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'huggingface'
              ? 'border-[#15803D] bg-emerald-50/80 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Hugging Face Cloud
            </span>
            {currentEngine === 'huggingface' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13] truncate">
            HF Serverless API
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            Hugging Face Inference router pipeline with automatic fallback.
          </p>
        </button>

        {/* 3. Gemini Vision Ultra */}
        <button
          type="button"
          onClick={() => onEngineChange('gemini')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'gemini'
              ? 'border-[#15803D] bg-emerald-50/80 shadow-[3px_3px_0px_#15803D]'
              : 'border-[#0E1A13] bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0E1A13]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              AI Vision Engine
            </span>
            {currentEngine === 'gemini' && (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            )}
          </div>
          <div className="text-sm font-black text-[#0E1A13]">
            Gemini 3.8 Flash Vision
          </div>
          <p className="text-xs text-[#4A6B56] mt-1 line-clamp-2">
            Ultra-fast precision OCR with speech bubble breakdown & layout bounding boxes.
          </p>
        </button>

        {/* 4. Tesseract Client Local */}
        <button
          type="button"
          onClick={() => onEngineChange('tesseract')}
          className={`p-3.5 text-left border-2 transition-all cursor-pointer relative ${
            currentEngine === 'tesseract'
              ? 'border-[#15803D] bg-emerald-50/80 shadow-[3px_3px_0px_#15803D]'
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

      {/* Docker Container Configuration Bar (visible when Docker is selected or settings opened) */}
      {currentEngine === 'docker' && (
        <div className="mt-4 p-3.5 bg-emerald-50/50 border border-emerald-700/40 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#0E1A13] flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Docker Container Endpoint:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePingDocker}
                disabled={isPinging}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-100 text-[#0E1A13] border border-[#0E1A13] shadow-[1px_1px_0px_#0E1A13] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Test Ping</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dockerEndpoint}
              onChange={(e) => onDockerEndpointChange(e.target.value)}
              placeholder="http://localhost:8000 or http://ocr-inference:8000"
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-[#0E1A13] focus:border-[#15803D] focus:outline-none"
            />
          </div>

          {pingResult && (
            <div
              className={`p-2 text-xs font-mono flex items-center justify-between border ${
                pingResult.available
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                  : 'bg-amber-100 border-amber-300 text-amber-950'
              }`}
            >
              <span>
                {pingResult.available
                  ? `Online (${pingResult.latencyMs}ms) · Container ready for inference`
                  : `Notice: ${pingResult.message || 'Container not detected at endpoint yet. Auto-fallback active.'}`}
              </span>
              <span className="text-[11px] underline cursor-pointer" onClick={() => setShowDockerModal(true)}>
                View setup instructions
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hugging Face Advanced Drawer / Links */}
      <div className="mt-4 pt-3 border-t border-[#E5EAE3] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <a
            href="https://huggingface.co/SeerRay-Lab/Xiaomi-OCR-0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-emerald-900 hover:text-emerald-700 underline font-semibold"
          >
            <span>Model: SeerRay-Lab/Xiaomi-OCR-0</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setShowHfSettings(!showHfSettings)}
            className="inline-flex items-center gap-1 text-[#0E1A13] hover:text-[#15803D] font-bold cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showHfSettings ? 'Hide Settings' : 'Configure Model & Token'}</span>
          </button>
        </div>

        <div className="text-[#5B7E6B] font-mono">
          Docker Compose & Bun Ready
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
              Your token is passed securely to Hugging Face during inference and is never stored permanently.
            </p>
          </div>
        </div>
      )}

      {/* Docker Setup Modal */}
      {showDockerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1A13] shadow-[8px_8px_0px_#0E1A13] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0E1A13] mb-4">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#15803D]" />
                <h3 className="text-base font-black uppercase text-[#0E1A13]">
                  Docker & Makefile Architecture
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDockerModal(false)}
                className="text-xs font-mono font-bold text-slate-500 hover:text-black border border-slate-300 px-2 py-0.5"
              >
                ESC / Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#3E5C49] leading-relaxed">
                You can run both the Bun Web App and the Hugging Face Xiaomi-OCR-0 inference container locally using Docker Compose or the included Makefile:
              </p>

              {/* Command 1: Pull model */}
              <div className="bg-[#0E1A13] text-emerald-300 p-3 font-mono space-y-1 relative">
                <div className="text-[11px] text-slate-400"># 1. Pull Model / Inference Container</div>
                <div className="flex items-center justify-between">
                  <code>docker pull hf.co/SeerRay-Lab/Xiaomi-OCR-0</code>
                  <button
                    onClick={() => handleCopyCmd('docker pull hf.co/SeerRay-Lab/Xiaomi-OCR-0', 'cmd1')}
                    className="p-1 hover:text-white"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Command 2: Makefile shortcut */}
              <div className="bg-[#0E1A13] text-emerald-300 p-3 font-mono space-y-1 relative">
                <div className="text-[11px] text-slate-400"># 2. Build with Bun & Launch Stack via Makefile</div>
                <div className="flex items-center justify-between">
                  <code>make build && make up</code>
                  <button
                    onClick={() => handleCopyCmd('make build && make up', 'cmd2')}
                    className="p-1 hover:text-white"
                  >
                    {copiedCmd === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Command 3: Docker Compose */}
              <div className="bg-[#0E1A13] text-emerald-300 p-3 font-mono space-y-1 relative">
                <div className="text-[11px] text-slate-400"># 3. Native Docker Compose</div>
                <div className="flex items-center justify-between">
                  <code>docker compose up -d</code>
                  <button
                    onClick={() => handleCopyCmd('docker compose up -d', 'cmd3')}
                    className="p-1 hover:text-white"
                  >
                    {copiedCmd === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 font-mono text-[11px]">
                <strong>Endpoints:</strong>
                <br />• Web App (Bun): <code>http://localhost:3000</code>
                <br />• Docker OCR Inference: <code>http://localhost:8000</code>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#E5EAE3] text-right">
              <button
                type="button"
                onClick={() => setShowDockerModal(false)}
                className="px-4 py-2 text-xs font-bold bg-[#0E1A13] text-white hover:bg-[#15803D] border border-[#0E1A13] shadow-[2px_2px_0px_#15803D] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
