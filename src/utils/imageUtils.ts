import { ImageFilterMode } from '../types/ocr';

/**
 * Converts a File or Blob to base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Pre-processes image via HTML5 Canvas (high-contrast manga scan binarization, invert, etc.)
 */
export async function applyImageFilter(
  dataUrl: string,
  mode: ImageFilterMode,
  rotation: number = 0
): Promise<string> {
  if (mode === 'normal' && rotation === 0) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Handle 90/180/270 rotation
      const rads = (rotation * Math.PI) / 180;
      const isPerpendicular = Math.abs(rotation % 180) === 90;
      canvas.width = isPerpendicular ? img.height : img.width;
      canvas.height = isPerpendicular ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (mode !== 'normal') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (mode === 'grayscale') {
            d[i] = gray;
            d[i + 1] = gray;
            d[i + 2] = gray;
          } else if (mode === 'manga-contrast') {
            // Adaptive thresholding for clean ink manga look
            const threshold = 148;
            const val = gray > threshold ? 255 : 15;
            d[i] = val;
            d[i + 1] = val === 15 ? 30 : 255;
            d[i + 2] = val;
          } else if (mode === 'invert') {
            d[i] = 255 - r;
            d[i + 1] = 255 - g;
            d[i + 2] = 255 - b;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Text-to-Speech reader using browser Web Speech API
 */
export function speakText(text: string, lang: string = 'ja-JP'): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice if available for language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  utterance.lang = lang;
  utterance.rate = 0.95;

  window.speechSynthesis.speak(utterance);
  return {
    stop: () => window.speechSynthesis.cancel(),
  };
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
